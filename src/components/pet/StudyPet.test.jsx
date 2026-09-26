import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import StudyPet from './StudyPet';
import { usePetStore } from '@/store/petStore';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';

const questions = [{ id: 'q1', title: '题1', categoryId: 'c', difficulty: 'easy', order: 1, status: 'published' }];
vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({ questions, categories: [{ id: 'c', slug: 'csharp-basics', name: 'C# 基础', order: 1 }], loading: false, error: null }),
}));

function Where() { return <p data-testid="where">{useLocation().pathname}</p>; }
const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="*" element={<><StudyPet /><Where /></>} /></Routes>
  </MemoryRouter>,
);
const pet = () => screen.getByRole('button', { name: /小芽：打开菜单/ });

beforeEach(() => {
  vi.useFakeTimers();
  try { sessionStorage.setItem('iqb:pet-greeted', '1'); } catch { /* ignore */ }
  usePetStore.setState({ hidden: false, side: 'right', height: 0, across: 1, snap: true, tipsEnabled: true, tipsShown: {}, mood: 'idle', panelOpen: false, opener: null, tutorBlocked: null, speech: null });
  useGameStore.setState({ records: {}, bestStars: {}, bonusXp: 0, pendingBonus: 0, quiet: true, seenAchievements: [], localRev: 0, syncedRev: 0 });
  useReviewStore.setState({ reviewStates: { q1: { lastQuality: 4, repetitions: 1, dueAt: '2026-01-01T00:00:00Z' } }, attempts: [] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('StudyPet', () => {
  it('shows for visitors and opens a menu with today and the handbook', () => {
    renderAt('/quiz');
    fireEvent.pointerDown(pet(), { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(pet(), { pointerId: 1, clientX: 10, clientY: 10 });
    expect(screen.getByRole('menu', { name: '小芽的菜单' })).toBeVisible();
    expect(screen.getByText(/1 道题到期/)).toBeVisible();
    expect(screen.queryByRole('menuitem', { name: /问小芽/ })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: '闯关手册' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/handbook');
  });

  it('puts the tutor first for administrators and explains when hint cards are gone', () => {
    const opener = vi.fn();
    usePetStore.setState({ opener });
    renderAt('/quiz');
    fireEvent.click(pet(), { detail: 0 });
    fireEvent.click(screen.getByRole('menuitem', { name: '问小芽（学习助手）' }));
    expect(opener).toHaveBeenCalled();
    cleanup();
    usePetStore.setState({ opener: null, tutorBlocked: '提示卡用完了' });
    renderAt('/quiz');
    fireEvent.click(pet(), { detail: 0 });
    expect(screen.getByRole('menuitem', { name: /问小芽提示卡用完了/ })).toBeDisabled();
  });

  it('moves to the other side from the keyboard and remembers it', () => {
    renderAt('/quiz');
    fireEvent.keyDown(pet(), { key: 'ArrowLeft' });
    expect(usePetStore.getState().side).toBe('left');
  });

  it('snaps to the nearest side after a drag', () => {
    renderAt('/quiz');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    fireEvent.pointerDown(pet(), { pointerId: 1, button: 0, clientX: 950, clientY: 700 });
    fireEvent.pointerMove(pet(), { pointerId: 1, clientX: 100, clientY: 300 });
    fireEvent.pointerUp(pet(), { pointerId: 1, clientX: 100, clientY: 300 });
    expect(usePetStore.getState().side).toBe('left');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('stays where it is dropped when snapping is off, and snaps again when turned back on', () => {
    renderAt('/quiz');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    fireEvent.click(pet(), { detail: 0 });
    act(() => { usePetStore.setState({ side: 'left', across: 1 }); });
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /吸附到边/ }));
    expect(usePetStore.getState(), 'turning snapping off keeps it on its side').toMatchObject({ snap: false, across: 0 });
    // jsdom lays the pet out at 0,0 with no size, so the drop point is the offset itself.
    fireEvent.pointerDown(pet(), { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(pet(), { pointerId: 1, clientX: 450, clientY: 300 });
    fireEvent.pointerUp(pet(), { pointerId: 1, clientX: 450, clientY: 300 });
    const { across, side } = usePetStore.getState();
    expect(across).toBeGreaterThan(0.2);
    expect(across).toBeLessThan(0.6);
    expect(side).toBe('left');
    const root = document.querySelector('.study-pet');
    expect(root.style.getPropertyValue('--pet-across')).toBe(String(across));
    act(() => { usePetStore.getState().setSnap(true); });
    expect(usePetStore.getState()).toMatchObject({ snap: true, side: 'left' });
  });

  it('gives one reminder on the map, once a day', () => {
    renderAt('/map');
    act(() => { vi.advanceTimersByTime(1300); });
    expect(screen.getByText('有 1 道题到期了，巡检一下？')).toBeInTheDocument();
    expect(Object.keys(usePetStore.getState().tipsShown)).toEqual(['due']);
    cleanup();
    usePetStore.setState({ speech: null });
    renderAt('/map');
    act(() => { vi.advanceTimersByTime(1300); });
    expect(screen.queryByText(/巡检一下/)).toBeNull();
  });

  it('stays quiet on question pages and when reminders are off', () => {
    renderAt('/quiz');
    act(() => { vi.advanceTimersByTime(1300); });
    expect(usePetStore.getState().speech).toBeNull();
    cleanup();
    usePetStore.setState({ tipsEnabled: false });
    renderAt('/map');
    act(() => { vi.advanceTimersByTime(1300); });
    expect(usePetStore.getState().speech).toBeNull();
  });

  it('says a game reaction', () => {
    renderAt('/stage/csharp-basics/1');
    act(() => { usePetStore.getState().react('combo3'); });
    expect(screen.getByText('三连！')).toBeInTheDocument();
  });

  it('can be hidden from its menu', () => {
    renderAt('/quiz');
    fireEvent.click(pet(), { detail: 0 });
    fireEvent.click(screen.getByRole('menuitem', { name: /收起小芽/ }));
    expect(usePetStore.getState().hidden).toBe(true);
    expect(screen.queryByRole('button', { name: /小芽/ })).toBeNull();
  });
});
