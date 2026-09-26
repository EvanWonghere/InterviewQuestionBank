import PixelPet from '@/components/pet/PixelPet';
import { HEARTS_PER_STAGE } from '@/lib/gameRules';

function Heart({ lost }) {
  return (
    <svg className={`stage-heart${lost ? ' is-lost' : ''}`} width="18" height="18" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d="M2 3h4v1h1v1h2V4h1V3h4v1h1v5h-1v1h-1v1h-1v1h-1v1H9v1H7v-1H6v-1H5v-1H4v-1H3V9H2V8H1V4h1z" fill="var(--game-heart)" />
    </svg>
  );
}

/** Sticky run header: stage label, hearts (none in a patrol), combo, XP gained, per-question pips and the pet. */
export default function StageHud({ ref, heartsRef, comboRef, cardsRef, label, hearts, combo, gained, results, position, total, pet, petForm, hintCards = null }) {
  return (
    <div ref={ref} className="stage-hud">
      <span className="stage-hud-pet"><PixelPet form={petForm} mood={pet} size={32} /></span>
      <span className="stage-hud-label game-pixel">{label}</span>
      {hearts !== null && (
        <span ref={heartsRef} className="stage-hearts" role="img" aria-label={`剩余 ${hearts} 颗心`}>
          {Array.from({ length: HEARTS_PER_STAGE }, (_, i) => <Heart key={i} lost={i >= hearts} />)}
        </span>
      )}
      {hintCards !== null && (
        <span ref={cardsRef} className={`stage-cards game-pixel${hintCards === 0 ? ' is-empty' : ''}`} title="问一次小芽用掉一张；连击到 5 再送一张" aria-label={`提示卡剩余 ${hintCards} 张`}>
          HINT ×{hintCards}
        </span>
      )}
      <span ref={comboRef} className={`stage-combo game-pixel${combo >= 5 ? ' is-blazing' : combo >= 3 ? ' is-hot' : ''}`} aria-live="polite">
        {combo > 1 ? `COMBO ×${combo}` : ''}
      </span>
      <span className="stage-xp game-pixel" aria-label={`本关已获得 ${gained} 经验`}>+{gained} XP</span>
      <span className="stage-pips" aria-label={`第 ${Math.min(position + 1, total)} / ${total} 题`}>
        {Array.from({ length: total }, (_, i) => {
          const result = results[i];
          const cls = result ? `is-s${result.stars}` : i === position ? 'is-now' : '';
          return <span key={i} className={`stage-pip ${cls}`} />;
        })}
      </span>
    </div>
  );
}
