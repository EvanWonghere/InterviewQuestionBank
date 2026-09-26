import { TIP_MS } from './petLines';

export const TIP_PAGES = ['/', '/map'];
export const EVENING_HOUR = 20;

/**
 * The one reminder 小芽 should give now, by priority, skipping any already given today.
 * Context: { today, hour, shown, newAchievements: [{ name }], streak: { streak, activeToday, frozen },
 *   yesterdayActive, dueCount, patrolDone, bossWaiting: { name, href } | null }.
 * @returns {{ id, text, mood, action?: { label, to }, ms } | null}
 */
export function pickTip(ctx) {
  const tips = [];
  if (ctx.newAchievements?.length) {
    tips.push({ id: 'achievement', text: `解锁新成就：${ctx.newAchievements[0].name}！`, mood: 'happy', motion: 'cheer', action: { label: '看成就', to: '/map' } });
  }
  if (ctx.streak.streak > 0 && !ctx.streak.activeToday && ctx.hour >= EVENING_HOUR) {
    tips.push({ id: 'streak', text: `连签 ${ctx.streak.streak} 天，今天还差一题就续上。`, mood: 'talking', action: { label: '随机来一题', to: '/random-practice' } });
  }
  if (ctx.streak.frozen > 0 && !ctx.yesterdayActive && ctx.streak.streak > 0) {
    tips.push({ id: 'freeze', text: '昨天没来，我用了一张补签卡，连签还在。', mood: 'happy', motion: 'hop' });
  }
  if (ctx.dueCount > 0 && !ctx.patrolDone) {
    tips.push(ctx.dueCount >= 10
      ? { id: 'due', text: `我蔫了……有 ${ctx.dueCount} 道题到期。`, mood: 'sad', action: { label: '去巡检', to: '/patrol' } }
      : { id: 'due', text: `有 ${ctx.dueCount} 道题到期了，巡检一下？`, mood: 'talking', action: { label: '去巡检', to: '/patrol' } });
  }
  if (ctx.bossWaiting) {
    tips.push({ id: 'boss', text: `${ctx.bossWaiting.name}在等你了。`, mood: 'thinking', action: { label: '去挑战', to: ctx.bossWaiting.href } });
  }
  const tip = tips.find((t) => ctx.shown?.[t.id] !== ctx.today);
  return tip ? { ...tip, ms: TIP_MS } : null;
}
