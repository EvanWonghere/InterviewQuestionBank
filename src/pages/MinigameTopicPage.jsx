import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useReviewStore } from '@/store/reviewStore';
import { MINIGAME_TOPIC, minigameTopicIds, selectMinigameQuestions } from '@/data/minigameTopic';

export default function MinigameTopicPage() {
  const { questions, loading, error } = useQuestions();
  const states = useReviewStore((state) => state.reviewStates);
  const selected = selectMinigameQuestions(questions);
  const expected = minigameTopicIds().length;
  const done = selected.filter((question) => states[question.id]).length;
  return (
    <div className="space-y-8 min-w-0">
      <header className="space-y-4">
        <p className="type-eyebrow">客户端复习 · 按模块练习</p>
        <h1 className="type-display-sm">{MINIGAME_TOPIC.title}</h1>
        <p className="type-body">从语言基础到小游戏场景，先独立回答，再对照参考与验证。题目按公开资料整理，不代表特定公司的面试原题。</p>
        <p role="note" className="type-caption">LayaAir 题目限定示例版本；项目和平台的实际接口请按所用版本核对。</p>
        {loading && <p role="status">正在加载专题题目…</p>}
        {error && <p role="alert">加载失败：{error}</p>}
        {!loading && !error && <p className="type-caption">已练 {done} / 当前可用 {selected.length} 题 · 选择掌握程度后才计入历史。</p>}
        {!loading && !error && selected.length < expected && <p role="alert">当前题库缺少 {expected - selected.length} 道专题题目，下方只显示已发布的题目。</p>}
        {!loading && !error && selected.length > 0 && <div className="flex flex-wrap gap-2"><Link to="/quiz?topic=minigame-client" className="btn-blue">开始练习全部可用题</Link><Link to="/quiz?topic=minigame-client&mode=fast" className="btn-neutral">速刷全部可用题</Link></div>}
      </header>
      <section className="space-y-4" aria-label="小游戏客户端复习模块">
        {MINIGAME_TOPIC.sections.map((section) => {
          const available = selectMinigameQuestions(questions, { section: section.id });
          const practised = available.filter((question) => states[question.id]).length;
          return (
            <div key={section.id} className="divider-subtle pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <h2 className="type-title">{section.title}</h2>
                <p className="type-caption">{section.description}</p>
                {!loading && !error && <p className="type-micro">已练 {practised} / 可用 {available.length} / 计划 {section.ids.length} 题</p>}
              </div>
              {!loading && !error && available.length > 0 && <div className="flex flex-wrap gap-2"><Link className="btn-neutral" to={`/quiz?topic=minigame-client&section=${section.id}`}>练习{section.title}</Link><Link className="btn-neutral" to={`/quiz?topic=minigame-client&section=${section.id}&mode=fast`}>速刷{section.title}</Link></div>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
