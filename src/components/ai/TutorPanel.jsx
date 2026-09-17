import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { aiRequest, streamChat } from '@/data/aiRepository';
import { useNotesStore } from '@/store/notesStore';
import { useAIDraft } from '@/lib/aiDrafts';

const quickPrompts = ['给我一个提示', '检查我的思路', '解释背后的机制', '联系Unity项目', '用C#和C++对照', '像面试官一样追问', '出一道变式，先不告诉我答案'];
export function ChatMarkdown({ content }) {
  return <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} skipHtml components={{
    img: ({ alt }) => <span>[图片未自动加载：{alt || '图片'}]</span>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  }}>{content}</ReactMarkdown></div>;
}
export default function TutorPanel({ question, phase = 'hint', submission, onAssistance, onClose, user }) {
  const dialog = useRef(null); const inputRef = useRef(null); const operation = useRef(null); const alive = useRef(true);
  const phaseRef = useRef(phase);
  const assistRef = useRef(onAssistance);
  useEffect(() => { phaseRef.current = phase; assistRef.current = onAssistance; }, [phase, onAssistance]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [text, setText] = useAIDraft(`${user.id}:${question.id}:chat`); const [includeNote, setIncludeNote] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ baseUrl: '', model: '', configured: false, allowedOrigins: [] });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [noteDraft, setNoteDraft] = useState(null); const [noteBusy, setNoteBusy] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  const markAssisted = () => { if (phaseRef.current === 'hint') assistRef.current?.(); };
  const refresh = async () => {
    const data = await aiRequest({ action: 'history', questionId: question.id });
    if (!alive.current) return;
    setMessages(data.messages);
    if (data.messages.some(m => m.role === 'assistant' && m.body)) markAssisted();
    if (data.versionChanged) setNotice('题目已更新：历史内容基于旧版本，新提问使用当前题目。');
  };
  useEffect(() => {
    alive.current = true;
    const el = dialog.current;
    const previous = document.activeElement;
    if (window.matchMedia('(max-width: 899px)').matches) el.showModal(); else el.show();
    document.body.classList.add('ai-panel-open');
    inputRef.current?.focus();
    Promise.all([aiRequest({ action: 'settings' }), aiRequest({ action: 'history', questionId: question.id })])
      .then(([config, history]) => {
        if (!alive.current) return;
        setSettings({ baseUrl: config.settings.base_url, model: config.settings.model, configured: config.configured, allowedOrigins: config.allowedOrigins });
        setSettingsOpen(!config.configured || !config.settings.model);
        setMessages(history.messages);
        if (phaseRef.current === 'hint' && history.messages.some(m => m.role === 'assistant' && m.body)) assistRef.current?.();
        if (history.versionChanged) setNotice('题目已更新：历史基于旧版本，新提问使用当前题目。');
      }).catch(e => { if (alive.current) setError(e.message); })
      .finally(() => { if (alive.current) setLoading(false); });
    return () => {
      alive.current = false;
      const op = operation.current;
      if (op) { void aiRequest({ action: 'cancel', requestId: op.id }).catch(() => {}); op.controller.abort(); }
      document.body.classList.remove('ai-panel-open');
      el.close(); previous?.focus?.();
    };
  // Instance is keyed by user/question in TutorEntry; do not reset on each submission edit.
  }, [question.id, user.id]);

  const send = async (reuse = false) => {
    if (operation.current || !text.trim() && !reuse) return;
    setError(''); setNotice('');
    const request = reuse && lastRequest ? lastRequest : {
      questionId: question.id, requestId: crypto.randomUUID(), phase,
      submission: structuredClone(submission ?? {}), includeNote, message: text.trim(),
    };
    setLastRequest(request);
    const controller = new AbortController(); operation.current = { id: request.requestId, controller }; setBusy(true);
    const localId = `${request.requestId}-reply`;
    if (!reuse) setMessages(prev => [...prev, { id: `${request.requestId}-user`, role: 'user', body: request.message, status: 'complete' }]);
    setMessages(prev => [...prev.filter(m => m.id !== localId), { id: localId, role: 'assistant', body: '', status: 'running' }]);
    let persisted = false; let completed = false;
    try {
      await streamChat(request, { signal: controller.signal, onEvent: event => {
        if (!alive.current) return;
        if (event.truncated) setNotice('上下文仅包含最近20条及长度预算内内容；历史不会被删除。');
        if (event.text) {
          markAssisted();
          setMessages(prev => prev.map(m => m.id === localId ? { ...m, body: m.body + event.text } : m));
        }
        if (event.status) {
          persisted = true;
          completed = event.status === 'complete';
          setMessages(prev => prev.map(m => m.id === localId ? { ...m, status: event.status } : m));
          if (event.error) setError(event.error);
        }
        if (event.message) throw new Error(event.message);
      }});
      if (persisted && alive.current) { if (completed) setText(''); await refresh(); }
    } catch (e) {
      if (alive.current) {
        setError(e.name === 'AbortError' ? '已停止；当前内容可能尚未全部保存，可复制或刷新历史核对。' : e.message);
        setMessages(prev => prev.map(m => m.id === localId && m.status === 'running' ? { ...m, status: 'failed' } : m));
      }
    } finally { operation.current = null; if (alive.current) setBusy(false); }
  };
  const stop = async () => {
    const op = operation.current; if (!op) return;
    try { await aiRequest({ action: 'cancel', requestId: op.id }); }
    catch (e) { if (alive.current) setError(e.message); }
    finally { op.controller.abort(); }
  };
  const configure = async action => {
    setSettingsBusy(true); setError('');
    try {
      await aiRequest({ action, baseUrl: settings.baseUrl, model: settings.model });
      if (alive.current) setNotice(action === 'test' ? '连接成功（仅发送固定测试文本）' : '设置已保存');
    } catch (e) { if (alive.current) setError(e.message); }
    finally { if (alive.current) setSettingsBusy(false); }
  };
  const clear = async () => {
    if (!window.confirm('清空本题AI对话？笔记和作答记录会保留。')) return;
    try { await aiRequest({ action: 'clear', questionId: question.id }); setMessages([]); setLastRequest(null); }
    catch (e) { setError(e.message); }
  };
  const appendNote = async () => {
    setNoteBusy(true); setError('');
    try {
      // Atomic server append reads latest cloud body, preserving concurrent edits.
      const data = await aiRequest({ action: 'append-note', questionId: question.id, body: noteDraft, expectedNote: useNotesStore.getState().notes[question.id] ?? '' });
      if (alive.current) { useNotesStore.getState().setNote(question.id, data.body); setNoteDraft(null); setNotice('已追加到本题笔记'); }
    } catch (e) { if (alive.current) setError(e.message); }
    finally { if (alive.current) setNoteBusy(false); }
  };
  return <dialog ref={dialog} className="ai-tutor-panel" aria-labelledby="ai-title" onCancel={e => { e.preventDefault(); onClose(); }} onKeyDown={e => { if(e.key==='Escape'){e.preventDefault();onClose();} }}>
    <header className="ai-tutor-header">
      <div><p className="type-eyebrow">学习教练 · {phase === 'hint' ? '答前提示' : '答后巩固'}</p><h2 id="ai-title" className="type-card-title">{question.legacyId || question.id} · {question.title}</h2></div>
      <button className="btn-neutral" onClick={onClose} aria-label="关闭学习助手">关闭</button>
    </header>
    <div className="ai-tutor-scroll">
      <p className="type-caption">先理解，再用反例和变式巩固。AI建议不会自动修改成绩或掌握状态。</p>
      <div className="flex gap-2 my-3 flex-wrap"><button className="btn-neutral" onClick={() => setSettingsOpen(v => !v)}>API设置</button><button className="btn-neutral" disabled={busy || loading} onClick={() => refresh().catch(e => setError(e.message))}>刷新历史</button><button className="btn-neutral" disabled={busy || loading} onClick={clear}>清空对话</button></div>
      {settingsOpen && <section className="ai-settings" aria-label="API设置">
        <p className="type-caption">Key由Supabase服务端保管：{settings.configured ? '已配置' : '未配置AI_API_KEY'}。网页不接收Key。</p>
        <label>Base URL<input className="input-apple" value={settings.baseUrl} placeholder="https://api.example.com/v1" onChange={e => setSettings(s => ({ ...s, baseUrl: e.target.value }))} /></label>
        <label>Model<input className="input-apple" value={settings.model} placeholder="填写服务商的model名称" onChange={e => setSettings(s => ({ ...s, model: e.target.value }))} /></label>
        <p className="type-caption">允许的域名：{settings.allowedOrigins.join('、') || '需在服务端设置AI_ALLOWED_ORIGINS'}</p>
        <div className="flex gap-2"><button className="btn-blue" disabled={settingsBusy || busy} onClick={() => configure('save-settings')}>保存设置</button><button className="btn-neutral" disabled={settingsBusy || busy || !settings.configured} onClick={() => configure('test')}>测试连接</button></div>
      </section>}
      <details className="my-3"><summary>本次会发送什么</summary><p>本题题干、选项、当前作答；{phase === 'review' ? '参考解析与评分点；' : '不发送参考解析；'}符合当前阶段的最近20条对话（另有长度限制）。不发送其他题目或整个学习档案。</p><pre className="ai-context">{JSON.stringify(submission ?? {}, null, 2)}</pre><label><input type="checkbox" checked={includeNote} onChange={e => setIncludeNote(e.target.checked)} /> 附带本题云端笔记</label></details>
      {notice && <p role="status" className="ai-notice">{notice}</p>}
      {loading && <p role="status">正在读取本题对话…</p>}
      <div role="log" aria-label="本题AI对话" aria-live="polite">
        {!loading && messages.length === 0 && <div className="ai-empty"><h3>从一个具体疑问开始</h3><p>可以问“为什么我的思路不成立”，或让教练用项目场景说明。</p></div>}
        {messages.map(m => <article className={`ai-message ai-${m.role}`} key={m.id}>
          <p className="type-eyebrow">{m.role === 'user' ? '我' : '学习教练'}{m.model ? ` · ${m.model}` : ''}</p>
          <ChatMarkdown content={m.body} />
          {m.role === 'assistant' && <>
            <p className="type-micro">{m.status === 'running' ? '生成中…' : m.status !== 'complete' ? '未完成回复' : 'AI生成 · 请结合资料核对'}</p>
            {m.body && <div className="flex gap-2 mt-2"><button className="btn-neutral" onClick={() => navigator.clipboard.writeText(m.body).catch(() => setError('复制失败，请手动选择内容'))}>复制</button><button className="btn-neutral" onClick={() => setNoteDraft(m.body)}>加入本题笔记</button></div>}
          </>}
        </article>)}
      </div>
      {noteDraft !== null && <section className="ai-settings"><h3>编辑后追加到笔记</h3><textarea aria-label="待追加笔记" className="input-apple min-h-40" value={noteDraft} onChange={e => setNoteDraft(e.target.value)} /><div className="flex gap-2"><button className="btn-blue" disabled={noteBusy || !noteDraft.trim()} onClick={appendNote}>确认追加</button><button className="btn-neutral" disabled={noteBusy} onClick={() => setNoteDraft(null)}>取消</button></div></section>}
    </div>
    <footer className="ai-tutor-compose">
      {error && <p role="alert" className="ai-error">{error}</p>}
      <div className="ai-prompts">{quickPrompts.map(p => <button key={p} disabled={busy} className="filter-pill" onClick={() => { setText(p); inputRef.current?.focus(); }}>{p}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); void send(); }}>
        <textarea ref={inputRef} aria-label="向学习教练提问" className="input-apple" value={text} disabled={busy} maxLength={8000} onChange={e => setText(e.target.value)} placeholder="你的疑问，或需要一起分析的代码…（草稿自动保留）" rows={3} />
        <div className="flex gap-2 mt-2 flex-wrap"><button className="btn-blue" disabled={busy || loading || !settings.configured || !settings.model || !text.trim()}>发送</button>{busy && <button type="button" className="btn-neutral" onClick={stop}>停止</button>}{lastRequest && !busy && <><button type="button" className="btn-neutral" onClick={() => send(true)}>核对此次请求</button><button type="button" className="btn-neutral" onClick={() => setText(lastRequest.message)}>重新提问</button></>}</div>
      </form>
    </footer>
  </dialog>;
}
