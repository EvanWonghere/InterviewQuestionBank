import { useEffect, useRef, useState } from 'react';
import { ChatMarkdown } from '@/components/ai/ChatMarkdown';
import { aiRequest, streamChat } from '@/data/aiRepository';
import { useNotesStore } from '@/store/notesStore';
import { useAIDraft } from '@/lib/aiDrafts';

const EFFORT_LABELS = { none: '关闭', low: '低', high: '高（默认）', max: '最大' };
const POLICY_OPTIONS = [
  { value: 'aggressive', label: '优先消耗 DeepSeek', detail: '容易和中等的提问、评估、报告、出题使用 DeepSeek。判为高难或需要强推理时使用 Sol。' },
  { value: 'balanced', label: '均衡', detail: '容易的提问使用 DeepSeek，中等的提问使用 Luna。评估、报告、出题仍使用 DeepSeek。高难或强推理使用 Sol。' },
  { value: 'conservative', label: '实时对话优先 OpenAI', detail: '容易和中等的提问使用 Luna。评估、报告、出题仍使用 DeepSeek。高难或强推理使用 Sol。' },
];
const PROBE_NAMES = { deepseek: 'DeepSeek', luna: 'Luna', sol: 'Sol', jev: 'Jev' };
const quickPrompts = ['给我一个提示', '检查我的思路', '解释背后的机制', '联系Unity项目', '用C#和C++对照', '像面试官一样追问', '出一道变式，先不告诉我答案'];

function describeProbes(probes) {
  return probes.map((probe) => {
    const name = PROBE_NAMES[probe.id] ?? probe.id;
    if (probe.status === 'ok') return `${name} ${probe.model} 可用`;
    if (probe.status === 'untested') return `${name} 未测试${probe.reason ? `（${probe.reason}）` : ''}`;
    return `${name} ${probe.model} 失败：${probe.error}`;
  }).join('；');
}

function copyLabel(copied, id) {
  return copied === id ? '已复制' : '复制';
}

export default function TutorPanel({ question, phase = 'hint', submission, onAssistance, onClose, user }) {
  const dialog = useRef(null); const inputRef = useRef(null); const operation = useRef(null); const alive = useRef(true);
  const scrollRef = useRef(null); const stickToBottom = useRef(true); const noteRef = useRef(null);
  const phaseRef = useRef(phase);
  const assistRef = useRef(onAssistance);
  useEffect(() => { phaseRef.current = phase; assistRef.current = onAssistance; }, [phase, onAssistance]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [text, setText] = useAIDraft(`${user.id}:${question.id}:chat`); const [includeNote, setIncludeNote] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ reasoningEffort: 'high', configured: false, allowedOrigins: [], creditPolicy: 'aggressive', keys: { deepseek: false, openai: false, jev: false }, models: { fast: 'deepseek-flash', default: 'gpt-6-luna', reasoning: 'gpt-6-sol' } });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [noteDraft, setNoteDraft] = useState(null); const [noteBusy, setNoteBusy] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [showJump, setShowJump] = useState(false);
  const markAssisted = () => { if (phaseRef.current === 'hint') assistRef.current?.(); };
  const refresh = async () => {
    const data = await aiRequest({ action: 'history', questionId: question.id });
    if (!alive.current) return;
    setMessages(data.messages);
    if (data.messages.some(m => m.role === 'assistant' && m.body)) markAssisted();
    if (data.versionChanged) setNotice('题目已更新：历史内容基于旧版本，新提问使用当前题目。');
  };
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stickToBottom.current = atBottom;
    setShowJump(!atBottom);
  };
  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight });
    stickToBottom.current = true;
    setShowJump(false);
  };
  useEffect(() => {
    if (stickToBottom.current) jumpToBottom();
  }, [messages]);
  useEffect(() => {
    if (noteDraft !== null) noteRef.current?.scrollIntoView({ block: 'nearest' });
  }, [noteDraft]);
  const copyMessage = async (id, body) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? '' : current)), 1500);
    } catch {
      setError('复制失败，请手动选择内容');
    }
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
        setSettings({
          reasoningEffort: config.settings.reasoning_effort ?? 'high',
          configured: config.configured,
          allowedOrigins: config.allowedOrigins ?? [],
          creditPolicy: config.creditPolicy ?? 'aggressive',
          keys: config.keys ?? { deepseek: Boolean(config.configured), openai: false, jev: false },
          models: config.models ?? { fast: 'deepseek-flash', default: 'gpt-6-luna', reasoning: 'gpt-6-sol' },
        });
        setSettingsOpen(!config.configured);
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
    stickToBottom.current = true;
    let persisted = false; let completed = false;
    try {
      await streamChat(request, { signal: controller.signal, onEvent: event => {
        if (!alive.current) return;
        if (event.truncated) setNotice('更早的对话超出条数或长度预算，未随本次请求发送；历史不会被删除。');
        else if (event.phaseFiltered) setNotice(phaseRef.current === 'hint' ? '答前提示只发送答前阶段的对话；答后内容未发送。' : '未完成的回复不会随本次请求发送。');
        if (event.thinking) setMessages(prev => prev.map(m => m.id === localId ? { ...m, thinking: true } : m));
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
      const result = await aiRequest({ action, reasoningEffort: settings.reasoningEffort, creditPolicy: settings.creditPolicy });
      if (alive.current && action === 'test') {
        const detail = Array.isArray(result.probes) ? describeProbes(result.probes) : '';
        if (result.ok === false) setError(detail || '连接测试未通过');
        else setNotice(`连接成功（仅发送固定测试文本）${detail ? `。${detail}` : ''}`);
      } else if (alive.current) setNotice('设置已保存');
    } catch (e) { if (alive.current) setError(Array.isArray(e.probes) ? describeProbes(e.probes) : e.message); }
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
  const statusLine = (m) => {
    if (m.status === 'running') return m.thinking && !m.body ? '思考中…' : '生成中…';
    if (m.status !== 'complete') return '未完成回复';
    return 'AI生成 · 请结合资料核对';
  };
  return <dialog ref={dialog} className="ai-tutor-panel" aria-labelledby="ai-title" onCancel={e => { e.preventDefault(); onClose(); }} onKeyDown={e => { if(e.key==='Escape'){e.preventDefault();onClose();} }}>
    <header className="ai-tutor-header">
      <div><p className="type-eyebrow">学习教练 · {phase === 'hint' ? '答前提示' : '答后巩固'}</p><h2 id="ai-title" className="type-card-title">{question.legacyId || question.id} · {question.title}</h2></div>
      <button className="btn-neutral" onClick={onClose} aria-label="关闭学习助手">关闭</button>
    </header>
    <div className="ai-tutor-scroll" ref={scrollRef} onScroll={onScroll}>
      <p className="type-caption">先理解，再用反例和变式巩固。AI建议不会自动修改成绩或掌握状态。</p>
      <div className="flex gap-2 my-3 flex-wrap"><button className="btn-neutral" onClick={() => setSettingsOpen(v => !v)}>API设置</button><button className="btn-neutral" disabled={busy || loading} onClick={() => refresh().catch(e => setError(e.message))}>刷新历史</button><button className="btn-neutral" disabled={busy || loading} onClick={clear}>清空对话</button></div>
      {settingsOpen && <section className="ai-settings" aria-label="API设置">
        <p className="type-caption">Key由Supabase服务端保管：{settings.configured ? '已配置' : '未配置AI_API_KEY'}。网页不接收Key。</p>
        <p className="type-caption">DeepSeek {settings.keys.deepseek ? '已配置' : '未配置'} · OpenAI {settings.keys.openai ? '已配置' : '未配置'} · Jev {settings.keys.jev ? '已配置' : '未配置'}</p>
        <label>额度策略<select className="input-apple" aria-label="额度策略" value={settings.creditPolicy} onChange={e => setSettings(s => ({ ...s, creditPolicy: e.target.value }))}>{POLICY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <p className="type-caption">{POLICY_OPTIONS.find((option) => option.value === settings.creditPolicy)?.detail} 模型名称：容易 {settings.models.fast}，常规 {settings.models.default}，高难 {settings.models.reasoning}。保存后以这里的选择为准；还没保存时沿用服务端默认。</p>
        <label>思考强度<select className="input-apple" value={settings.reasoningEffort} onChange={e => setSettings(s => ({ ...s, reasoningEffort: e.target.value }))}>{Object.entries(EFFORT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <p className="type-caption">DeepSeek 使用 thinking 字段，OpenAI 只发送 reasoning_effort。聊天、评估、报告和连接测试共用。思考越强越慢，单次最长等待 90 秒；超时或截断时可降低强度。</p>
        <p className="type-caption">允许的域名：{settings.allowedOrigins.join('、') || '需在服务端设置AI_ALLOWED_ORIGINS'}</p>
        <p className="type-caption">连接测试分别调用 DeepSeek、Luna 和 Sol，并逐项显示结果。Jev 显示为未测试。仅发送固定测试文本，可能产生三次少量调用费用。</p>
        <div className="flex gap-2"><button className="btn-blue" disabled={settingsBusy || busy} onClick={() => configure('save-settings')}>保存设置</button><button className="btn-neutral" disabled={settingsBusy || busy || !settings.configured} onClick={() => configure('test')}>测试连接</button></div>
      </section>}
      <details className="my-3"><summary>本次会发送什么</summary><p>本题题干、选项、当前作答；{phase === 'review' ? '参考解析与评分点；本题最近一次 AI 评估的结论（分轮次标注，教练不能据此改分）；' : '不发送参考解析，也不发送 AI 评估结论；'}符合当前阶段的最近20条对话（另有长度限制）。不发送其他题目或整个学习档案。</p><pre className="ai-context">{JSON.stringify(submission ?? {}, null, 2)}</pre><label><input type="checkbox" checked={includeNote} onChange={e => setIncludeNote(e.target.checked)} /> 附带本题云端笔记</label></details>
      {notice && <p role="status" className="ai-notice">{notice}</p>}
      {loading && <p role="status">正在读取本题对话…</p>}
      <div role="log" aria-label="本题AI对话">
        {!loading && messages.length === 0 && <div className="ai-empty"><h3>从一个具体疑问开始</h3><p>可以问“为什么我的思路不成立”，或让教练用项目场景说明。</p></div>}
        {messages.map(m => <article className={`ai-message ai-${m.role}`} key={m.id}>
          <p className="type-eyebrow">{m.role === 'user' ? '我' : '学习教练'}{m.model ? ` · ${m.model}` : ''}</p>
          <ChatMarkdown content={m.body} streaming={m.status === 'running'} />
          {m.role === 'assistant' && <>
            <p className="type-micro" aria-live="polite">{statusLine(m)}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {m.body ? <button className="btn-neutral" onClick={() => copyMessage(m.id, m.body)}>{copyLabel(copiedId, m.id)}</button> : null}
              {m.body ? <button className="btn-neutral" onClick={() => setNoteDraft(m.body)}>加入本题笔记</button> : null}
              {lastRequest && m.status !== 'complete' && m.status !== 'running' ? <button className="btn-neutral" onClick={() => send(true)}>核对此次请求</button> : null}
            </div>
          </>}
        </article>)}
      </div>
      {noteDraft !== null && <section className="ai-settings" ref={noteRef}><h3>编辑后追加到笔记</h3><textarea aria-label="待追加笔记" className="input-apple min-h-40" value={noteDraft} onChange={e => setNoteDraft(e.target.value)} /><div className="flex gap-2"><button className="btn-blue" disabled={noteBusy || !noteDraft.trim()} onClick={appendNote}>确认追加</button><button className="btn-neutral" disabled={noteBusy} onClick={() => setNoteDraft(null)}>取消</button></div></section>}
    </div>
    {showJump && <button type="button" className="ai-jump-bottom" onClick={jumpToBottom}>回到底部</button>}
    <footer className="ai-tutor-compose">
      {error && <p role="alert" className="ai-error">{error}</p>}
      <div className="ai-prompts">{quickPrompts.map(p => <button key={p} className="filter-pill" onClick={() => { setText(p); inputRef.current?.focus(); }}>{p}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); void send(); }}>
        <textarea ref={inputRef} aria-label="向学习教练提问" className="input-apple" value={text} maxLength={8000} onChange={e => setText(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void send(); } }} placeholder="你的疑问，或需要一起分析的代码…（草稿自动保留；Ctrl/Cmd+Enter 发送）" rows={3} />
        <div className="flex gap-2 mt-2 flex-wrap"><button className="btn-blue" disabled={busy || loading || !settings.configured || !text.trim()}>发送</button>{busy && <button type="button" className="btn-neutral" onClick={stop}>停止</button>}{lastRequest && !busy && <><button type="button" className="btn-neutral" onClick={() => send(true)}>核对此次请求</button><button type="button" className="btn-neutral" onClick={() => setText(lastRequest.message)}>重新提问</button></>}</div>
      </form>
    </footer>
  </dialog>;
}
