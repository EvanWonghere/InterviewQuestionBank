import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useReviewStore } from '@/store/reviewStore';
import { GBITS_MOCK_PAPERS, mockQuestionIds } from '@/data/gbitsMockPapers';
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
        <p className="type-eyebrow">笔试训练 · 历年采样与冲刺卷更新于 2026-10-15</p>
        <h1 className="type-display-sm">{GBITS_TOPIC.title}</h1>
        <p className="type-body">默认练 38 道基础与编程题；另外 40 道机制口述、面试与工程题放在可选补充。难度是训练评级，题面是历史题意改写、回忆改写或考点变式，不能据此确认本批次会考什么。</p>
        <p role="note" className="type-caption">原来的混合卷只有两道简单编程，现明确标为“基础自测卷”。客户端资源加载、UI 排查和定时器设计未核验为笔试原题，两天冲刺可先跳过。</p>
        {!loading && !error && <p className="type-caption">笔试训练已练 {done} / 当前可用 {selected.length} 题 · 选择掌握程度后才计入历史。</p>}
        {loading && <p role="status">正在加载专题题目…</p>}
        {error && <p role="alert">加载失败：{error}</p>}
        {!loading && !error && missing > 0 && <p role="alert">默认训练有 {missing} 题尚未在当前题库发布；下方只统计可用题目。</p>}
        <div className="flex flex-wrap gap-3">
          <Link to="/quiz?topic=gbits&set=start" className="btn-blue">先做 6 题 · 30 分钟起步</Link>
          <Link to="/quiz?topic=gbits" className="btn-neutral">练笔试基础与编程</Link>
        </div>
      </header>
      <section className="space-y-4" aria-label="两天冲刺新卷">
        <h2 className="type-title">两天冲刺 · 三张全新卷</h2>
        <p className="type-body">先做 A 卷，复盘后做 B 卷；C 卷留作加练。三卷共 78 道原创题，逐题区分历年考点变式与预测考点，不能据此确认今年会考什么。新模拟中进入题型后须整区块提交才能切换，提交后不可返回。</p>
        {GBITS_MOCK_PAPERS.map((paper) => {
          const missing = mockQuestionIds(paper).filter((id) => !availableIds.has(id)).length;
          return <div key={paper.id} className="surface-card p-5 space-y-3"><p className="type-eyebrow">{paper.priority}</p><h3 className="type-title">{paper.title}</h3><p>{paper.description}</p>{!loading && !error && !missing ? <Link className="btn-blue" to={`/written-mock/${paper.id}`}>开始{paper.title}模拟</Link> : <p role="status">{loading ? '题目加载中…' : `缺少 ${missing} 题，等待发布后开放。`}</p>}</div>;
        })}
      </section>
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
        <p className="type-body">这部分用于深入理解或后续面试，不作为两天笔试冲刺的必做清单。资源加载方向的线索来自附件中可信度为“中”的单篇二手复盘，完整工程要求由训练编写；Unity 文档支持机制，不证明公司考过本题。</p>
        {GBITS_TOPIC.sections.map((section) => <p key={section.id}><Link to={`/quiz?topic=gbits&scope=supplement&section=${section.id}`} className="btn-neutral">{section.supplementTitle} · {section.supplementIds.length} 题</Link></p>)}
      </details>
      <section className="space-y-3 divider-subtle pt-5">
        <h2 className="type-title">两天冲刺怎么取舍</h2>
        <ol className="list-decimal pl-5 space-y-2 type-body"><li>先闭卷完成 A 卷，记录错在概念、读题、实现还是边界；随后补练对应旧题。</li><li>第二天做 B 卷并复盘三道编程；C 卷按余力加练，不要求刷完整库。</li><li>隔天闭卷重做错题。工程补充可后排；较难算法有回忆依据，也仍需按剩余时间取舍。</li></ol>
      </section>
      <details className="surface-card p-5 space-y-3">
        <summary className="cursor-pointer type-title">来源与题面边界</summary>
        <p className="type-body">原42道专项题参考用户附件，space-2与客户端备考清单已去重。新增三卷另核看2017、2018 A/B、2018提前批、2023技术卷的结构与可见题面，以及2024/2025第一手笔经。未读取的图片、公式、代码不用于还原题目；重复卷不当作独立频次。尚未取得本批次官方考纲。</p>
        <p className="type-body">“有考点线索”不等于“该完整题目已在笔试出现”。公开回忆既有简单题，也有较难算法，不能以基础卷概括实际难度。编程题没有在线编译器，不按阅读答案自动记通过。</p>
        <ul className="list-disc pl-5 space-y-1"><li><a href="https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e" target="_blank" rel="noreferrer">2024 Unity客户端第一手笔经 · 16选择 / 2填空 / 3编程</a></li><li><a href="https://www.nowcoder.com/feed/main/detail/f3ad63377c7b4bee94641bcb9eb6efc7?sourceSSR=enterprise" target="_blank" rel="noreferrer">2025研发第一手笔经 · 选择题总数未知，2填空 / 3编程</a></li><li><a href="https://www.nowcoder.com/enterprise/760/question/company" target="_blank" rel="noreferrer">牛客历史题库（附件记录）</a></li><li><a href="https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/" target="_blank" rel="noreferrer">亲历笔经（附件引用，本次未能重新读取）</a></li></ul>
      </details>
    </div>
  );
}
