import { describe, expect, it } from 'vitest';
import { pickTip } from './petTips';

const base = {
  today: '2026-09-26', hour: 10, shown: {}, newAchievements: [],
  streak: { streak: 0, activeToday: false, frozen: 0 }, yesterdayActive: true,
  dueCount: 0, patrolDone: false, bossWaiting: null,
};

describe('pickTip', () => {
  it('says nothing when there is nothing to say', () => {
    expect(pickTip(base)).toBeNull();
  });

  it('follows the priority order', () => {
    const all = {
      ...base, hour: 21, newAchievements: [{ name: '三次握手' }], streak: { streak: 12, activeToday: false, frozen: 1 }, yesterdayActive: false,
      dueCount: 3, bossWaiting: { name: 'C# 面试官', href: '/boss/csharp-basics' },
    };
    expect(pickTip(all)).toMatchObject({ id: 'achievement', text: '解锁新成就：三次握手！' });
    expect(pickTip({ ...all, newAchievements: [] })).toMatchObject({ id: 'streak', action: { to: '/random-practice' } });
    expect(pickTip({ ...all, newAchievements: [], hour: 19 })).toMatchObject({ id: 'freeze' });
    expect(pickTip({ ...all, newAchievements: [], hour: 19, yesterdayActive: true })).toMatchObject({ id: 'due', text: '有 3 道题到期了，巡检一下？' });
    expect(pickTip({ ...all, newAchievements: [], hour: 19, yesterdayActive: true, patrolDone: true })).toMatchObject({ id: 'boss', action: { to: '/boss/csharp-basics' } });
  });

  it('droops at ten due reviews', () => {
    expect(pickTip({ ...base, dueCount: 12 })).toMatchObject({ id: 'due', mood: 'sad', text: '我蔫了……有 12 道题到期。' });
  });

  it('gives each kind at most once a day, then moves on to the next', () => {
    const ctx = { ...base, dueCount: 3, bossWaiting: { name: 'C# 面试官', href: '/boss/x' } };
    expect(pickTip({ ...ctx, shown: { due: '2026-09-26' } })).toMatchObject({ id: 'boss' });
    expect(pickTip({ ...ctx, shown: { due: '2026-09-25' } })).toMatchObject({ id: 'due' });
    expect(pickTip({ ...ctx, shown: { due: '2026-09-26', boss: '2026-09-26' } })).toBeNull();
  });
});
