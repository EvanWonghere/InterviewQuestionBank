import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useAuth } from '@/context/AuthContext';
import { useGameStore } from '@/store/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import QuestionContent from '@/components/quiz/QuestionContent';
import AnswerPanel from '@/components/quiz/AnswerPanel';
import InterviewReport from '@/components/ai/InterviewReport';
import BossSprite from '@/components/game/BossSprite';
import { burst, burstFrom, effectsEnabled, floatText, pulseClass, setEffectsQuiet } from '@/components/game/effects';
import {
  BOSS_DAILY_LIMIT, BOSS_HP, aiDamage, bossDeck, bossFightsLeft, bossKey, categorySlug, chapterProgress, findCategory, ratingDamage,
} from '@/lib/gameRules';
import '@/components/game/game.css';
import '@/components/game/stage.css';
import '@/components/game/boss.css';

// Hand-written interviewer lines per chapter; no model call.
const BOSSES = {
  'csharp-basics': { name: 'C# 面试官', taunt: '先说说，装箱发生在哪一行？' },
  'unity-core': { name: 'Unity 主程', taunt: '生命周期的调用顺序，背熟了吗？' },
  'rendering-graphics': { name: '图形程序', taunt: '一帧里的 Draw Call 都是从哪来的？' },
  'algorithms-datastructures': { name: '算法面试官', taunt: '先别写代码，复杂度是多少？' },
  'project-practice': { name: '项目负责人', taunt: '这个方案上线以后出过事故吗？' },
  'cpp-basics': { name: 'C++ 面试官', taunt: '这段代码是不是未定义行为？' },
  'os-fundamentals': { name: '系统面试官', taunt: '进程和线程，你先挑一个讲。' },
  'computer-networks': { name: '网络面试官', taunt: '三次握手，第三次能省吗？' },
  'design-patterns': { name: '架构师', taunt: '这里为什么不用单例？' },
};
const bossFor = (category) => BOSSES[categorySlug(category)] ?? { name: `${category.name} 面试官`, taunt: '我们开始吧。' };

export default function BossPage() {
  const { categoryId: param } = useParams();
  const { questions, categories, loading, error } = useQuestions();
  const records = useGameStore((s) => s.records);
  const quiet = useGameStore((s) => s.quiet);
  const progress = useGameProgress(questions, categories);
  const [fight, setFight] = useState(0);

  useEffect(() => { setEffectsQuiet(quiet); }, [quiet]);

  if (loading) return <p className="type-body py-24 text-center" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>;
  if (error) return <p className="rounded-2xl p-5 type-body" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>{error}</p>;

  const category = findCategory(categories, param);
  const chapter = category ? chapterProgress(questions, category.id, { records, reviewStates: progress.reviewStates, attempts: progress.attempts }) : null;
  const record = category ? records[bossKey(category.id)] : null;
  const left = bossFightsLeft(record, progress.today);
  const blocked = !category ? '没有找到这一章。'
    : !chapter.bossReady ? '本章每一关都拿到 2 颗星，面试官才会出现。'
      : null;

  if (blocked) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="type-body mb-4" style={{ color: 'var(--text-secondary)' }}>{blocked}</p>
        <Link to="/map" className="btn-blue">返回闯关地图</Link>
      </div>
    );
  }

  return (
    <BossFight
      key={fight}
      category={category}
      boss={bossFor(category)}
      questions={questions}
      record={record}
      fightsLeft={left}
      today={progress.today}
      quiet={quiet}
      onAgain={() => setFight((f) => f + 1)}
    />
  );
}

function BossFight({ category, boss, questions: allQuestions, record, fightsLeft, today, quiet, onAgain }) {
  const { isAdmin } = useAuth();
  const recordBoss = useGameStore((s) => s.recordBoss);
  const [deck] = useState(() => bossDeck(allQuestions, category.id));
  const [sessionId] = useState(() => crypto.randomUUID());
  const [phase, setPhase] = useState('intro'); // intro | fighting | rated | done
  const [position, setPosition] = useState(0);
  const [hp, setHp] = useState(BOSS_HP);
  const [dealt, setDealt] = useState({}); // question id → damage dealt so far
  const [log, setLog] = useState([]);
  const spriteRef = useRef(null);
  const hpRef = useRef(null);

  const question = deck[position];
  const total = Object.values(dealt).reduce((a, b) => a + b, 0);
  const defeated = hp <= 0;
  const lastQuestion = position === deck.length - 1;

  const hit = (amount, { crit = false } = {}) => {
    if (amount <= 0) return;
    setHp((value) => Math.max(0, value - amount));
    pulseClass(spriteRef.current, 'is-hit', 450);
    pulseClass(hpRef.current, 'is-shaking', 420);
    floatText(spriteRef.current, crit ? `CRIT -${amount}` : `-${amount}`, crit ? 'xp' : 'muted');
    burstFrom(spriteRef.current, { kind: 'spark', count: crit ? 36 : 18 });
    if (crit) pulseClass(document.documentElement, 'game-flash', 700);
  };

  // Every AI evaluation round raises this question's damage to half its score; a follow-up that
  // raises it is a critical hit.
  const handleEvaluated = (evaluation) => {
    const target = aiDamage(evaluation.score ?? 0);
    const before = dealt[question.id] ?? 0;
    const add = Math.max(0, target - before);
    setDealt((d) => ({ ...d, [question.id]: Math.max(before, target) }));
    const crit = (evaluation.round ?? 1) > 1 && add > 0;
    setLog((l) => [...l, { questionId: question.id, round: evaluation.round ?? 1, score: evaluation.score, add, crit }]);
    hit(add, { crit });
  };

  // Without an AI evaluation the self-rating decides the damage.
  const handleRated = (_status, detail) => {
    if (detail && dealt[question.id] === undefined) {
      const add = ratingDamage(detail.quality);
      setDealt((d) => ({ ...d, [question.id]: add }));
      setLog((l) => [...l, { questionId: question.id, round: 0, score: null, add, crit: false }]);
      hit(add);
    }
    setPhase('rated');
  };

  const finish = () => {
    recordBoss({ key: bossKey(category.id), defeated, damage: total, day: today });
    setPhase('done');
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
    if (defeated && effectsEnabled()) {
      window.setTimeout(() => burst(window.innerWidth / 2, window.innerHeight * 0.35, { kind: 'confetti', count: 160 }), 300);
    }
  };

  const next = () => {
    if (defeated || lastQuestion) { finish(); return; }
    setPosition((p) => p + 1);
    setPhase('fighting');
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const pageClass = `stage-page boss-page${quiet ? ' game-quiet' : ''}`;
  const hpBar = (
    <div ref={hpRef} className="boss-hp" role="meter" aria-label={`${boss.name} 剩余血量`} aria-valuemin={0} aria-valuemax={BOSS_HP} aria-valuenow={hp}>
      <span className="boss-hp-label game-pixel">HP {hp}/{BOSS_HP}</span>
      <span className="boss-hp-track"><span className={`boss-hp-fill${hp <= 30 ? ' is-low' : ''}`} style={{ width: `${(hp / BOSS_HP) * 100}%` }} /></span>
    </div>
  );

  if (phase === 'intro') {
    const noFights = fightsLeft === 0;
    return (
      <div className={pageClass}>
        <section className="boss-arena surface-card-elevated">
          <span className="stage-intro-label game-pixel">BOSS · {category.name}</span>
          <span ref={spriteRef} className="boss-sprite-wrap"><BossSprite size={128} /></span>
          <h1 className="type-display-md">{boss.name}</h1>
          <p className="boss-taunt">「{boss.taunt}」</p>
          {hpBar}
          <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
            {deck.length} 道题 · {isAdmin ? '每题首答和追问的 AI 评分直接算伤害，追问答得更好就是暴击' : '按自评算伤害：困难 20、良好 35、简单 40'}
            {' '}· 今日剩余 {fightsLeft}/{BOSS_DAILY_LIMIT} 次
            {record?.bestDamage ? ` · 最高伤害 ${record.bestDamage}` : ''}
          </p>
          {noFights
            ? <p className="type-body" style={{ color: 'var(--warning-fg)' }}>今天已经挑战 {BOSS_DAILY_LIMIT} 次了，明天再来。</p>
            : <button type="button" className="btn-blue" onClick={() => setPhase('fighting')} disabled={!deck.length}>开始面试</button>}
          <Link to="/map" className="btn-ghost type-caption">返回地图</Link>
        </section>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className={pageClass}>
        <section className="boss-arena surface-card-elevated" aria-labelledby="boss-result-title">
          <span ref={spriteRef} className={`boss-sprite-wrap${defeated ? ' is-defeated' : ''}`}><BossSprite size={112} /></span>
          <h1 id="boss-result-title" className={`stage-result-title game-pixel${defeated ? '' : ' is-failed'}`}>
            {(defeated ? 'BOSS DEFEATED' : 'NOT THIS TIME').split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${i * 35}ms` }}>{ch === ' ' ? ' ' : ch}</span>
            ))}
          </h1>
          <p className="boss-taunt">{defeated ? `「${boss.name}：可以，等 HR 电话吧。」` : `「${boss.name}：回去再准备准备。」`}</p>
          {hpBar}
          <div className="stage-tally">
            <div><b className="game-pixel">{total}</b><span>总伤害</span></div>
            <div><b className="game-pixel">{log.filter((l) => l.crit).length}</b><span>追问暴击</span></div>
            <div><b className="game-pixel">{Math.max(record?.bestDamage ?? 0, total)}</b><span>最高伤害</span></div>
          </div>
          <ul className="stage-result-list">
            {deck.map((q) => <li key={q.id}><span className="truncate">{q.title}</span><b className="game-pixel">-{dealt[q.id] ?? 0}</b></li>)}
          </ul>
          <div className="flex flex-wrap justify-center gap-3">
            {fightsLeft - 1 > 0 && !defeated && <button type="button" className="btn-blue" onClick={onAgain}>再战（今日剩余 {fightsLeft - 1} 次）</button>}
            <Link to="/map" className={defeated ? 'btn-blue' : 'btn-neutral'}>返回地图</Link>
          </div>
        </section>
        {isAdmin && <section className="boss-report"><h2 className="type-card-title mb-3">面试官战报</h2><InterviewReport sessionId={sessionId} questions={deck} /></section>}
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="boss-hud">
        <span ref={spriteRef} className="boss-sprite-wrap is-small"><BossSprite size={48} /></span>
        <span className="boss-hud-name"><b>{boss.name}</b><small className="game-pixel">Q{position + 1}/{deck.length}</small></span>
        {hpBar}
      </div>
      <article key={question.id} className="surface-card-elevated stage-card p-6 lg:p-8">
        <h2 className="type-card-title mb-4" style={{ color: 'var(--text-primary)' }}>{question.title}</h2>
        <div style={{ color: 'var(--text-secondary)' }}><QuestionContent content={question.question} /></div>
        <AnswerPanel
          question={question}
          onRated={handleRated}
          onEvaluated={handleEvaluated}
          assistantEnabled={false}
          evaluationMode={isAdmin ? 'interview' : 'practice'}
          sessionId={sessionId}
        />
        {phase === 'rated' && (
          <div className={`stage-verdict ${dealt[question.id] ? 'is-hit' : 'is-miss'}`} role="status">
            <span className="stage-verdict-word game-pixel">{defeated ? 'K.O.' : `-${dealt[question.id] ?? 0}`}</span>
            <span className="stage-verdict-text type-caption">
              {defeated ? '面试官撑不住了！' : dealt[question.id] ? `这题造成 ${dealt[question.id]} 点伤害，面试官还剩 ${hp} 血。` : '这题没打出伤害。'}
            </span>
            <button type="button" className="btn-blue stage-next" onClick={next} autoFocus>{defeated || lastQuestion ? '结算' : '下一题'}</button>
          </div>
        )}
      </article>
    </div>
  );
}
