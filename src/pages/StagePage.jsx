import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useReviewStore } from '@/store/reviewStore';
import { useGameStore } from '@/store/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import QuestionContent from '@/components/quiz/QuestionContent';
import AnswerPanel from '@/components/quiz/AnswerPanel';
import PixelPet from '@/components/pet/PixelPet';
import Stars from '@/components/game/Stars';
import StageHud from '@/components/game/StageHud';
import StageResult from '@/components/game/StageResult';
import { burstFrom, floatText, pulseClass, setEffectsQuiet } from '@/components/game/effects';
import {
  HEARTS_PER_STAGE, answerStars, answerXp, chapterProgress, currentStars, findCategory, nextCombo, questionXp, stageHref,
} from '@/lib/gameRules';
import '@/components/game/game.css';
import '@/components/game/stage.css';

const VERDICT = ['MISS', 'OK', 'NICE'];

export default function StagePage() {
  const { categoryId: categoryParam, index } = useParams();
  const stageIndex = Number(index);
  const { questions, categories, loading, error } = useQuestions();
  const records = useGameStore((s) => s.records);
  const quiet = useGameStore((s) => s.quiet);
  const { reviewStates, attempts, bestStars, level } = useGameProgress(questions);

  useEffect(() => { setEffectsQuiet(quiet); }, [quiet]);

  const category = findCategory(categories, categoryParam);
  const categoryId = category?.id ?? categoryParam;
  const chapter = chapterProgress(questions, categoryId, { records, reviewStates, attempts });
  const stage = chapter.stages.find((s) => s.index === stageIndex) ?? null;
  const world = [...categories].sort((a, b) => a.order - b.order).findIndex((c) => c.id === categoryId) + 1;

  // Run key restarts the run (replay, or next stage via the route) without leaking state.
  const [runKey, setRunKey] = useState(0);

  if (loading) return <p className="type-body py-24 text-center" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>;
  if (error) return <p className="rounded-2xl p-5 type-body" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>{error}</p>;
  if (!stage || !stage.unlocked) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="type-body mb-4" style={{ color: 'var(--text-secondary)' }}>
          {stage ? '这一关还没解锁：先通关前一关。' : '没有找到这一关。'}
        </p>
        <Link to="/map" className="btn-blue">返回闯关地图</Link>
      </div>
    );
  }

  return (
    <StageRun
      key={`${stage.key}#${runKey}`}
      stage={stage}
      label={`${world}-${stage.index}`}
      categoryName={category?.name ?? ''}
      nextHref={category && chapter.stages.some((s) => s.index === stageIndex + 1) ? stageHref(category, stageIndex + 1) : null}
      bestStars={bestStars}
      reviewStates={reviewStates}
      startLevel={level}
      onReplay={() => setRunKey((k) => k + 1)}
    />
  );
}

function StageRun({ stage, label, categoryName, nextHref, bestStars, reviewStates, startLevel, onReplay }) {
  const recordRun = useGameStore((s) => s.recordRun);
  const addBonusXp = useGameStore((s) => s.addBonusXp);
  const quiet = useGameStore((s) => s.quiet);
  // The stage's question list is frozen for the run, so a background refresh cannot reshuffle it.
  const [questions] = useState(stage.questions);
  const [startXp] = useState(startLevel.xp);
  const [position, setPosition] = useState(0);
  const [hearts, setHearts] = useState(HEARTS_PER_STAGE);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gained, setGained] = useState(0);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState('intro'); // intro | answering | rated | done
  const [pet, setPet] = useState('idle');
  const verdictRef = useRef(null);
  const hudRef = useRef(null);
  const heartsRef = useRef(null);
  const comboRef = useRef(null);

  const question = questions[position];
  const last = results[results.length - 1];
  const failed = hearts === 0;
  const finished = phase === 'done';

  useEffect(() => {
    if (phase !== 'intro') return undefined;
    const timer = window.setTimeout(() => setPhase('answering'), 1300);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Effects run after the verdict is on screen so they start from its position.
  useEffect(() => {
    if (phase !== 'rated' || !last) return;
    verdictRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    const target = verdictRef.current?.querySelector('.stage-verdict-stars');
    if (last.stars === 0) {
      pulseClass(hudRef.current, 'is-shaking', 420);
      pulseClass(heartsRef.current, 'is-breaking', 600);
      burstFrom(heartsRef.current, { kind: 'miss' });
    } else {
      burstFrom(target, { kind: 'spark', count: last.stars === 2 ? 30 : 14 });
      if (last.lit) window.setTimeout(() => burstFrom(target, { kind: 'confetti', count: 50 }), 250);
    }
    if (last.combo >= 2 && last.stars === 2) pulseClass(comboRef.current, 'is-bumped', 500);
    if (last.combo === 3 || last.combo === 5) pulseClass(document.documentElement, 'game-flash', 700);
    floatText(target, `+${last.xp} XP`, last.stars === 0 ? 'muted' : 'xp');
  }, [phase, last]);

  const handleRated = (_status, detail) => {
    if (!detail) return;
    const stars = answerStars(detail);
    const newCombo = nextCombo(combo, { stars, assisted: detail.assisted });
    const { bonus } = answerXp(question, stars, newCombo);
    // Real XP change: best-star increase plus the lapse XP, read from the store the attempt was just written to.
    const after = useReviewStore.getState();
    const oldBest = bestStars[question.id] ?? 0;
    const nowStars = currentStars(question, after.reviewStates, after.attempts);
    const stateKey = after.reviewStates[question.id] ? question.id : question.legacyId;
    const xpBefore = questionXp(question, oldBest, reviewStates[stateKey]?.lapseCount ?? 0);
    const xpAfter = questionXp(question, Math.max(oldBest, nowStars), after.reviewStates[stateKey]?.lapseCount ?? 0);
    const xp = Math.max(0, xpAfter - xpBefore) + bonus;
    if (bonus) addBonusXp(bonus);

    const nextHearts = stars === 0 ? hearts - 1 : hearts;
    setHearts(nextHearts);
    setCombo(newCombo);
    setMaxCombo((m) => Math.max(m, newCombo));
    setGained((g) => g + xp);
    setResults((r) => [...r, { questionId: question.id, title: question.title, stars, assisted: detail.assisted, xp, combo: newCombo, lit: nowStars === 3 && oldBest < 3 }]);
    setPet(stars === 0 ? 'sad' : 'happy');
    setPhase('rated');
  };

  const goNext = () => {
    if (failed || position === questions.length - 1) {
      recordRun({ key: stage.key, cleared: !failed, flawless: hearts === HEARTS_PER_STAGE });
      setPhase('done');
      return;
    }
    setPosition((p) => p + 1);
    setPet('idle');
    setPhase('answering');
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const pageClass = `stage-page${quiet ? ' game-quiet' : ''}`;
  if (finished) {
    return (
      <div className={pageClass}>
        <StageResult
          label={label}
          categoryName={categoryName}
          cleared={!failed}
          flawless={hearts === HEARTS_PER_STAGE}
          results={results}
          total={questions.length}
          maxCombo={maxCombo}
          gained={gained}
          startXp={startXp}
          nextHref={!failed ? nextHref : null}
          onReplay={onReplay}
        />
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <StageHud
        ref={hudRef}
        heartsRef={heartsRef}
        comboRef={comboRef}
        label={label}
        hearts={hearts}
        combo={combo}
        gained={gained}
        results={results}
        position={position}
        total={questions.length}
        pet={pet}
      />

      {phase === 'intro' ? (
        <div className="stage-intro" role="status">
          <span className="stage-intro-label game-pixel">STAGE {label}</span>
          <h1 className="type-display-md">{categoryName}</h1>
          <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>{questions.length} 题 · {HEARTS_PER_STAGE} 颗心 · 连续两星叠连击</p>
          <button type="button" className="btn-neutral" onClick={() => setPhase('answering')}>开始</button>
        </div>
      ) : (
        <article key={question.id} className="surface-card-elevated stage-card p-6 lg:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`stage-difficulty game-pixel is-${question.difficulty}`}>{(question.difficulty ?? 'medium').toUpperCase()}</span>
            <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>第 {position + 1} / {questions.length} 题</span>
          </div>
          <h2 className="type-card-title mb-4" style={{ color: 'var(--text-primary)' }}>{question.title}</h2>
          <div style={{ color: 'var(--text-secondary)' }}>
            <QuestionContent content={question.question} />
          </div>
          <AnswerPanel question={question} onRated={handleRated} />

          {phase === 'rated' && last && (
            <div ref={verdictRef} className={`stage-verdict ${last.stars === 0 ? 'is-miss' : 'is-hit'}`} role="status">
              <span className="stage-verdict-word game-pixel">{VERDICT[last.stars]}</span>
              <span className="stage-verdict-stars"><Stars count={last.lit ? 3 : last.stars} size={22} pendingThird={last.stars === 2} /></span>
              <span className="stage-verdict-text type-caption">
                {last.lit ? '复习再次通过，第 3 颗星点亮！'
                  : last.stars === 0 ? (failed ? '心用完了。已答的题都记进了复习计划。' : '扣 1 颗心。这题会出现在之后的复习里。')
                    : last.assisted ? '用过小芽的提示，本题 1 星；连击保持。'
                      : last.stars === 1 ? '过关，1 星。连击清零。'
                        : last.combo >= 2 ? `连击 ×${last.combo}！` : '漂亮！之后复习再过一次就能拿第 3 颗星。'}
              </span>
              <span className="stage-verdict-pet"><PixelPet mood={last.stars === 0 ? 'sad' : 'happy'} size={40} still /></span>
              <button type="button" className="btn-blue stage-next" onClick={goNext} autoFocus>
                {failed ? '查看结算' : position === questions.length - 1 ? '结算' : '下一题'}
              </button>
            </div>
          )}
        </article>
      )}

      <div className="flex justify-end">
        <Link to="/map" className="btn-ghost type-caption">退出到地图</Link>
      </div>
    </div>
  );
}
