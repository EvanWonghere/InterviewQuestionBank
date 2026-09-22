import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ReviewPage from './ReviewPage';

const state = vi.hoisted(() => ({ questions: [], reviewStates: {}, attempts: [] }));
vi.mock('@/context/QuestionsContext', () => ({ useQuestions: () => ({ questions: state.questions }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null, isAdmin: false, loading: false }) }));
vi.mock('@/store/reviewStore', () => ({ useReviewStore: (select) => select(state) }));

const renderIt = () => render(
  <MemoryRouter initialEntries={['/review/wrong']}>
    <Routes><Route path="/review/:mode" element={<ReviewPage />} /></Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  state.questions = [{ id: 'uuid-040', legacyId: 'q-040', title: '动态分派', tags: ['C++'] }];
  state.reviewStates = { 'uuid-040': { lapseCount: 2, intervalDays: 1, lastQuality: 1 } };
  state.attempts = [];
});
afterEach(cleanup);

describe('ReviewPage stable question links', () => {
  it('uses the database ID for a wrong-question link', () => {
    renderIt();
    expect(screen.getByRole('link', { name: /动态分派/ })).toHaveAttribute('href', '/quiz?questionId=uuid-040');
  });
});
