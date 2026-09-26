import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useGameSync } from './useGameSync';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';

const state = vi.hoisted(() => ({ auth: { user: { id: 'admin' }, isAdmin: true }, merge: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@/data/gameRepository', () => ({ MAX_BONUS_DELTA: 10000, mergeGameProgress: (...args) => state.merge(...args) }));

const cloudRow = { records: { 'c:2': { cleared: true } }, best_stars: { q9: 3 }, bonus_xp: 40, seen_achievements: ['steady-60'] };

beforeEach(() => {
  vi.useFakeTimers();
  state.auth = { user: { id: 'admin' }, isAdmin: true };
  state.merge.mockReset().mockResolvedValue(cloudRow);
  useReviewStore.setState({ hydratedUserId: 'admin' });
  useGameStore.setState({
    records: { 'c:1': { cleared: true } }, bestStars: { q1: 2 }, bonusXp: 10, pendingBonus: 10,
    seenAchievements: ['first-clear'], localRev: 3, syncedRev: 0,
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('useGameSync', () => {
  it('merges once the cloud data has loaded and adopts the union', async () => {
    renderHook(() => useGameSync());
    await act(async () => {});
    expect(state.merge).toHaveBeenCalledWith({ records: { 'c:1': { cleared: true } }, bestStars: { q1: 2 }, bonusDelta: 10, seen: ['first-clear'] });
    const s = useGameStore.getState();
    expect(s.records).toEqual({ 'c:1': { cleared: true }, 'c:2': { cleared: true } });
    expect(s.bestStars).toEqual({ q1: 2, q9: 3 });
    expect(s).toMatchObject({ bonusXp: 40, pendingBonus: 0, syncedRev: 3 });
    expect(s.seenAchievements).toEqual(['first-clear', 'steady-60']);
  });

  it('syncs again after a local change settles, sending only the new bonus', async () => {
    renderHook(() => useGameSync());
    await act(async () => {});
    state.merge.mockResolvedValue({ ...cloudRow, bonus_xp: 45 });
    act(() => { useGameStore.getState().addBonusXp(5); });
    expect(state.merge).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(state.merge).toHaveBeenCalledTimes(2);
    expect(state.merge.mock.calls[1][0].bonusDelta).toBe(5);
    expect(useGameStore.getState()).toMatchObject({ bonusXp: 45, pendingBonus: 0 });
  });

  it('keeps local state and stops retrying when the merge fails', async () => {
    state.merge.mockRejectedValue(new Error('offline'));
    renderHook(() => useGameSync());
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(state.merge).toHaveBeenCalledTimes(1);
    expect(useGameStore.getState()).toMatchObject({ bonusXp: 10, pendingBonus: 10, syncedRev: 0 });
  });

  it('does nothing for visitors', async () => {
    state.auth = { user: null, isAdmin: false };
    renderHook(() => useGameSync());
    await act(async () => {});
    expect(state.merge).not.toHaveBeenCalled();
  });
});
