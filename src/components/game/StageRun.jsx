import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useReviewStore } from '@/store/reviewStore';
import { useGameStore } from '@/store/gameStore';
import QuestionContent from '@/components/quiz/QuestionContent';
import AnswerPanel from '@/components/quiz/AnswerPanel';
import PixelPet from '@/components/pet/PixelPet';
import Stars from '@/components/game/Stars';
import StageHud from '@/components/game/StageHud';
import StageResult from '@/components/game/StageResult';
import { burstFrom, floatText, pulseClass } from '@/components/game/effects';
import {
  HEARTS_PER_STAGE, HINT_CARDS, HINT_CARD_COMBO, REVIVE_SCORE, answerStars, answerXp, currentStars, nextCombo, questionXp, revives,
} from '@/lib/gameRules';

const VERDICT = ['MISS', 'OK', 'NICE'];

/**
 * One run over a fixed list of questions. `mode` 'stage' has 3 hearts and can fail;
 * 'patrol' (daily review) has no hearts. `progress` is the useGameProgress result at the start.
 * With the AI tutor (administrators): asking 小芽 before answering costs a hint card, and after a
 * miss a follow-up answered well in the AI evaluation revives one heart, once per run.
 */
export default function StageRun({ mode = 'stage', recordKey, questions: runQuestions, label, badge: badgeProp, title, nextHref, progress, onReplay }) {
  const { bestStars, reviewStates, level: startLevel, petForm } = progress;
  const patrol = mode === 'patrol';
  // Short pixel label for the HUD, intro and result: STAGE 1-2, PATROL, or a caller's own (e.g. DUNGEON).
  const badge = badgeProp ?? (patrol ? 'PATROL' : `STAGE ${label}`);
  const recordRun = useGameStore((s) => s.recordRun);
  const addBonusXp = useGameStore((s) => s.addBonusXp);
  const quiet = useGameStore((s) => s.quiet);
  const { isAdmin } = useAuth();
  // The stage's question list is frozen for the run, so a background refresh cannot reshuffle it.
  const [questions] = useState(runQuestions);
  const [startXp] = useState(startLevel.xp);
  const [position, setPosition] = useState(0);
  const [hearts, setHearts] = useState(patrol ? null : HEARTS_PER_STAGE);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gained, setGained] = useState(0);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState('intro'); // intro | answering | rated | done
  const [pet, setPet] = useState('idle');
  const [cards, setCards] = useState(HINT_CARDS);
  const [cardEarned, setCardEarned] = useState(false);
  const [cardUsedOn, setCardUsedOn] = useState(null);
  const [revived, setRevived] = useState(false);
  const cardsRef = useRef(null);
  const verdictRef = useRef(null);
  const hudRef = useRef(null);
  const heartsRef = useRef(null);
  const comboRef = useRef(null);

  const question = questions[position];
  const last = results[results.length - 1];
  const failed = !patrol && hearts === 0;
  const noMiss = results.every((r) => r.stars > 0);
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
      burstFrom(heartsRef.current ?? target, { kind: 'miss' });
    } else {
      burstFrom(target, { kind: 'spark', count: last.stars === 2 ? 30 : 14 });
      if (last.lit) window.setTimeout(() => burstFrom(target, { kind: 'confetti', count: 50 }), 250);
    }
    if (last.combo >= 2 && last.stars === 2) pulseClass(comboRef.current, 'is-bumped', 500);
    if (last.combo === 3 || last.combo === 5) pulseClass(document.documentElement, 'game-flash', 700);
    floatText(target, `+${last.xp} XP`, last.stars === 0 ? 'muted' : 'xp');
    if (last.cardEarned) window.setTimeout(() => { floatText(cardsRef.current, '+1 提示卡', 'xp'); pulseClass(cardsRef.current, 'is-bumped', 500); }, 400);
  }, [phase, last]);

  const handleAssistance = () => {
    if (cardUsedOn === question.id) return;
    setCardUsedOn(question.id);
    setCards((c) => Math.max(0, c - 1));
    pulseClass(cardsRef.current, 'is-bumped', 500);
  };

  const handleEvaluated = (evaluation) => {
    if (patrol || revived || phase !== 'rated' || last?.stars !== 0 || last.questionId !== question.id || !revives(evaluation)) return;
    setRevived(true);
    setHearts((h) => h + 1);
    setResults((r) => r.map((item, i) => (i === r.length - 1 ? { ...item, revived: true } : item)));
    setPet('happy');
    burstFrom(heartsRef.current, { kind: 'confetti', count: 40 });
    floatText(heartsRef.current, 'REVIVE +1', 'xp');
  };

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
    const earnsCard = isAdmin && !cardEarned && newCombo >= HINT_CARD_COMBO;
    if (earnsCard) { setCardEarned(true); setCards((c) => c + 1); }

    if (!patrol && stars === 0) setHearts(hearts - 1);
    setCombo(newCombo);
    setMaxCombo((m) => Math.max(m, newCombo));
    setGained((g) => g + xp);
    setResults((r) => [...r, { questionId: question.id, title: question.title, stars, assisted: detail.assisted, xp, combo: newCombo, lit: nowStars === 3 && oldBest < 3, cardEarned: earnsCard }]);
    setPet(stars === 0 ? 'sad' : 'happy');
    setPhase('rated');
  };

  const goNext = () => {
    if (failed || position === questions.length - 1) {
      recordRun({
        key: recordKey,
        cleared: !failed,
        flawless: noMiss,
        unassisted: results.every((r) => !r.assisted),
        maxCombo,
      });
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
          mode={mode}
          badge={badge}
          title={title}
          cleared={!failed}
          flawless={noMiss}
          results={results}
          total={questions.length}
          maxCombo={maxCombo}
          gained={gained}
          startXp={startXp}
          nextHref={!failed ? nextHref : null}
          progress={progress}
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
        label={badge}
        hearts={hearts}
        combo={combo}
        gained={gained}
        results={results}
        position={position}
        total={questions.length}
        pet={pet}
        petForm={petForm}
        cardsRef={cardsRef}
        hintCards={isAdmin ? cards : null}
      />

      {phase === 'intro' ? (
        <div className="stage-intro" role="status">
          <span className="stage-intro-label game-pixel">{patrol ? 'DAILY PATROL' : badge}</span>
          <h1 className="type-display-md">{title}</h1>
          <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
            {patrol ? `${questions.length} 道到期题 · 不扣心 · 再答对就点亮第 3 颗星` : `${questions.length} 题 · ${HEARTS_PER_STAGE} 颗心 · 连续两星叠连击`}
          </p>
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
          <AnswerPanel
            question={question}
            onRated={handleRated}
            onEvaluated={handleEvaluated}
            onAssistance={handleAssistance}
            hintEnabled={cards > 0 || cardUsedOn === question.id}
          />

          {phase === 'rated' && last && (
            <div ref={verdictRef} className={`stage-verdict ${last.stars === 0 ? 'is-miss' : 'is-hit'}`} role="status">
              <span className="stage-verdict-word game-pixel">{VERDICT[last.stars]}</span>
              <span className="stage-verdict-stars"><Stars count={last.lit ? 3 : last.stars} size={22} pendingThird={last.stars === 2} /></span>
              <span className="stage-verdict-text type-caption">
                {last.lit ? '复习再次通过，第 3 颗星点亮！'
                  : last.stars === 0 ? (patrol ? '没过，复习计划已经缩短间隔。' : failed ? '心用完了。已答的题都记进了复习计划。' : '扣 1 颗心。这题会出现在之后的复习里。')
                    : last.assisted ? '用过小芽的提示，本题 1 星；连击保持。'
                      : last.stars === 1 ? '过关，1 星。连击清零。'
                        : last.combo >= 2 ? `连击 ×${last.combo}！` : '漂亮！之后复习再过一次就能拿第 3 颗星。'}
              </span>
              {last.stars === 0 && !patrol && isAdmin && !revived && (
                <span className="stage-revive type-caption">
                  追问复活：点上方「AI 评估我的回答」，回答追问得分 ≥ {REVIVE_SCORE} 可补回 1 颗心（每关一次）。
                </span>
              )}
              {last.revived && <span className="stage-revive is-done type-caption">追问答得好，复活成功，补回 1 颗心！</span>}
              <span className="stage-verdict-pet"><PixelPet form={petForm} mood={last.stars === 0 ? 'sad' : 'happy'} size={40} still /></span>
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
