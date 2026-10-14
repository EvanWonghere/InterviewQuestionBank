import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useReviewStore } from '@/store/reviewStore';
import { GBITS_TOPIC, GBITS_PAPERS, selectTopicQuestions, topicIds } from '@/data/gbitsTopic';

export default function GbitsTopicPage() {
  const { questions, loading, error } = useQuestions();
  const states = useReviewStore((state) => state.reviewStates);
  const selected = selectTopicQuestions(questions);
  const done = selected.filter((question) => states[question.id]).length;
  const missing = topicIds().length - selected.length;
  const availableIds = new Set(questions.map((question) => question.legacyId || question.id));
  return (
    <div className="space-y-8 min-w-0">
      <header className="space-y-4">
        <p className="type-eyebrow">笔试训练 · 来源与范围校正于 2026-10-14</p>
        <h1 className="type-display-sm">{GBITS_TOPIC.title}</h1>
        <p className="type-body">默认练 38 道基础与编程题；另外 40 道机制口述、面试与工程题放在可选补充。难度是训练评级，题面是历史题意改写、回忆改写或考点变式，不能据此确认本批次会考什么。</p>
        <p role="note" className="type-caption">原来的混合卷只有两道简单编程，现明确标为“基础自测卷”。客户端资源加载、UI 排查和定时器设计未核验为笔试原题，三天冲刺可先跳过。</p>
        {!loading && !error && <p className="type-caption">笔试训练已练 {done} / 当前可用 {selected.length} 题 · 选择掌握程度后才计入历史。</p>}
        {loading && <p role="status">正在加载专题题目…</p>}
        {error && <p role="alert">加载失败：{error}</p>}
        {!loading && !error && missing > 0 && <p role="alert">默认训练有 {missing} 题尚未在当前题库发布；下方只统计可用题目。</p>}
        <div className="flex flex-wrap gap-3">
          <Link to="/quiz?topic=gbits&set=start" className="btn-blue">先做 6 题 · 30 分钟起步</Link>
          <Link to="/quiz?topic=gbits" className="btn-neutral">练笔试基础与编程</Link>
        </div>
      </header>
      <section className="space-y-4" aria-label="自测卷">
        <p className="type-caption">两张卷均可手动计时 90 分钟、逐题查看解析。题量借鉴附件记录的某些场次；时长、选题和组合均为训练安排，以正式考试通知为准。</p>
        {GBITS_PAPERS.map((paper) => <div key={paper.set} className="surface-card p-5 space-y-3">
          <h2 className="type-title">{paper.title}</h2>
          <p className="type-body">{paper.description}</p>
          {paper.ids.every((id) => availableIds.has(id)) ? <Link to={`/quiz?topic=gbits&set=${paper.set}`} className="btn-neutral">打开{paper.title}</Link> : <p className="type-caption">等待题目加载或发布。</p>}
        </div>)}
      </section>
      <section className="space-y-4" aria-label="笔试训练模块">
        {GBITS_TOPIC.sections.map((section) => {
          const available = selectTopicQuestions(questions, { section: section.id });
          const practised = available.filter((question) => states[question.id]).length;
          return <div key={section.id} className="divider-subtle pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 min-w-0"><h2 className="type-title">{section.title}</h2><p className="type-caption">{section.description}</p><p className="type-micro">已练 {practised} / {available.length} 题 · 建议一次练习 {section.minutes} 分钟</p></div>
            <Link className="btn-neutral" to={`/quiz?topic=gbits&section=${section.id}`}>练习这个模块</Link>
          </div>;
        })}
      </section>
      <details className="surface-card p-5 space-y-4">
        <summary className="cursor-pointer type-title">可选补充 · 机制口述、面试与工程（40 题）</summary>
        <p className="type-body">这部分用于深入理解或后续面试，不作为三天笔试冲刺的必做清单。资源加载方向的线索来自附件中可信度为“中”的单篇二手复盘，完整工程要求由训练编写；Unity 文档支持机制，不证明公司考过本题。</p>
        {GBITS_TOPIC.sections.map((section) => <p key={section.id}><Link to={`/quiz?topic=gbits&scope=supplement&section=${section.id}`} className="btn-neutral">{section.supplementTitle} · {section.supplementIds.length} 题</Link></p>)}
      </details>
      <section className="space-y-3 divider-subtle pt-5">
        <h2 className="type-title">三天冲刺怎么取舍</h2>
        <ol className="list-decimal pl-5 space-y-2 type-body"><li>先练 24 道选择与填空，再写括号匹配、前缀和、子数组 DP、注册校验、走格子和背包。</li><li>基础自测检查速度；进阶自测接触较难题，卡住时记录思路、实现或边界缺口。</li><li>隔天闭卷重做错题。工程补充可后排；较难算法有回忆依据，也仍需按剩余时间取舍。</li></ol>
      </section>
      <details className="surface-card p-5 space-y-3">
        <summary className="cursor-pointer type-title">来源与题面边界</summary>
        <p className="type-body">用户附件中 space-2 与客户端备考清单相同，已去重。历史卷、亲历回忆和考点补强分别标注；选项、范围、样例与解答为训练编写。本次未重复附件所记的登录核验，也未取得本批次官方考纲。</p>
        <p className="type-body">“有考点线索”不等于“该完整题目已在笔试出现”。公开回忆既有简单题，也有较难算法，不能以基础卷概括实际难度。编程题没有在线编译器，不按阅读答案自动记通过。</p>
        <ul className="list-disc pl-5 space-y-1"><li><a href="https://www.nowcoder.com/enterprise/760/question/company" target="_blank" rel="noreferrer">牛客历史题库（附件记录）</a></li><li><a href="https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/" target="_blank" rel="noreferrer">亲历笔经（附件引用，本次未能重新读取）</a></li></ul>
      </details>
    </div>
  );
}
