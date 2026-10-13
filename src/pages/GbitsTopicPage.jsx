import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useReviewStore } from '@/store/reviewStore';
import { GBITS_TOPIC, selectTopicQuestions, topicIds } from '@/data/gbitsTopic';

export default function GbitsTopicPage() {
  const { questions, loading, error } = useQuestions();
  const states = useReviewStore((state) => state.reviewStates);
  const selected = selectTopicQuestions(questions);
  const done = selected.filter((question) => states[question.id]).length;
  const missing = topicIds().length - selected.length;
  return (
    <div className="space-y-8 min-w-0">
      <header className="space-y-4">
        <p className="type-eyebrow">专项练习 · 调研整理于 2026-10-13</p>
        <h1 className="type-display-sm">{GBITS_TOPIC.title}</h1>
        <p className="type-body">先拿公共基础分，再补客户端。42 道新题搭配已有机制题；客观题自动判，编程与设计题提交后对照评分点自评。</p>
        {!loading && !error && <p className="type-caption">已练 {done} / 当前可用 {selected.length} 题 · 看过解析后仍需选择掌握程度，才计入历史。</p>}
        {loading && <p role="status">正在加载专题题目…</p>}
        {error && <p role="alert">加载失败：{error}</p>}
        {!loading && !error && missing > 0 && <p role="alert">专题有 {missing} 题尚未在当前题库发布；下方只统计可用题目，练习卷暂不可开始。</p>}
        <div className="flex flex-wrap gap-3">
          <Link to="/quiz?topic=gbits&set=start" className="btn-blue">先做 6 题 · 30 分钟起步</Link>
          <Link to="/quiz?topic=gbits" className="btn-neutral">按专题顺序练习</Link>
        </div>
      </header>
      <section className="surface-card p-5 space-y-3">
        <h2 className="type-title">90 分钟混合练习卷</h2>
        <p className="type-body">20 道选择 + 4 道填空 + 2 道编程。建议基础 35 分钟、编程 50 分钟、检查 5 分钟。页面提供手动倒计时与逐题解析，适合练取舍；这是训练编排，当前场次规则以考试通知为准。</p>
        {GBITS_TOPIC.paperIds.every((id) => questions.some((question) => (question.legacyId || question.id) === id))
          ? <Link to="/quiz?topic=gbits&set=paper" className="btn-neutral">打开混合练习卷</Link>
          : <p className="type-caption">练习卷等待题目加载或发布。</p>}
      </section>
      <section className="space-y-4" aria-label="专项模块">
        {GBITS_TOPIC.sections.map((section) => {
          const available = selectTopicQuestions(questions, { section: section.id });
          const practised = available.filter((question) => states[question.id]).length;
          return <div key={section.id} className="divider-subtle pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 min-w-0"><h2 className="type-title">{section.title}</h2><p className="type-caption">{section.description}</p><p className="type-micro">已练 {practised} / {available.length} 题 · 建议一轮 {section.minutes} 分钟</p></div>
            <Link className="btn-neutral" to={`/quiz?topic=gbits&section=${section.id}`}>练习这个模块</Link>
          </div>;
        })}
      </section>
      <section className="space-y-3 divider-subtle pt-5">
        <h2 className="type-title">怎么安排今天</h2>
        <ol className="list-decimal pl-5 space-y-2 type-body"><li>30 分钟做起步 6 题，先作答再看解析，记录错误原因。</li><li>优先练 C++ 与代码填空，再各做一题栈、前缀和、DP。</li><li>有整块时间就做混合卷；次日从今日复习中闭卷重做。</li></ol>
      </section>
      <details className="surface-card p-5 space-y-3">
        <summary className="cursor-pointer type-title">来源与题面边界</summary>
        <p className="type-body">用户附件中 space-2 与客户端备考清单相同，已去重。历史卷、亲历回忆和考点补强分别标注在每道新题中；选项、范围、样例与参考解答为训练编写。附件记录的登录核验未在本次重复进行。</p>
        <p className="type-body">积木推倒、小图游览、三维共线等题缺少足够明确的规则或完整输入，暂不编造可判定原题；数据分析卷、公司常识与跨公司混合笔经不占核心练习时间。编程题没有在线编译器，也不按阅读答案自动记通过。</p>
        <ul className="list-disc pl-5 space-y-1"><li><a href="https://www.nowcoder.com/enterprise/760/question/company" target="_blank" rel="noreferrer">牛客历史题库（附件记录）</a></li><li><a href="https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/" target="_blank" rel="noreferrer">2026-10-01 亲历笔经（附件引用）</a></li></ul>
      </details>
    </div>
  );
}
