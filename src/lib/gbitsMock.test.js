import { describe, expect, it } from 'vitest';
import { GBITS_MOCK_PAPERS, mockQuestionIds, selectMockQuestions } from '../data/gbitsMockPapers';
import { hasAnswer, isComplete, loadMockStore, MOCK_STORAGE_KEY, saveMockStore, startMock, updateMock } from './gbitsMock';
const paper = GBITS_MOCK_PAPERS[0];
function memory(raw = null) { const data = new Map(raw === null ? [] : [[MOCK_STORAGE_KEY, raw]]); return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; }
const initial = () => startMock(loadMockStore(memory()).record, paper, 120, 'a');
const enter = (s, type = 'algorithm') => updateMock(s, 'a', { type: 'enter', block: type }, 1000);
const submit = (s) => updateMock(s, 'a', { type: 'submit' }, 2000);
describe('written mock rules and durable snapshots', () => {
  it('has variable paper sizes and resolves cloud UUIDs in blueprint order', () => {
    expect(GBITS_MOCK_PAPERS.map((p) => Object.values(p.groups).map((ids) => ids.length))).toEqual([[20, 4, 2], [16, 2, 3], [24, 4, 3]]);
    expect(new Set(GBITS_MOCK_PAPERS.flatMap(mockQuestionIds)).size).toBe(78);
    expect(selectMockQuestions([{ id: 'uuid', legacyId: 'gbits-043' }], paper)[0].id).toBe('uuid');
    expect(selectMockQuestions([], paper)).toEqual([]);
  });
  it('allows any first block, forbids switching or editing another type', () => {
    for (const type of ['single_choice', 'fill_blank', 'algorithm']) {
      const s = enter(initial(), type);
      expect(s.attempts.a.activeType).toBe(type);
      expect(() => enter(s, 'fill_blank')).toThrow();
      const foreign = Object.entries(paper.groups).find(([t]) => t !== type)[1][0];
      expect(() => updateMock(s, 'a', { type: 'edit', questionId: foreign, submission: { answerMd: 'bypass' } })).toThrow();
    }
  });
  it('saves drafts, permits blank submissions, and preserves irreversible locks on reload', () => {
    let s = enter(initial());
    s = updateMock(s, 'a', { type: 'edit', questionId: 'gbits-067', submission: { answerMd: 'my code' } });
    s = submit(s);
    const storage = memory(); saveMockStore(storage, s, null);
    s = loadMockStore(storage).record;
    expect(s.attempts.a.submitted.algorithm.snapshot['gbits-067'].answerMd).toBe('my code');
    expect(s.attempts.a.submitted.algorithm.snapshot['gbits-068'].answerMd).toBe('');
    expect(() => enter(s)).toThrow();
    expect(() => updateMock(s, 'a', { type: 'edit', questionId: 'gbits-067', submission: { answerMd: 'rewrite' } })).toThrow();
    expect(isComplete(s.attempts.a)).toBe(false);
    for (const t of ['fill_blank', 'single_choice']) s = submit(enter(s, t));
    expect(isComplete(s.attempts.a)).toBe(true);
    const next = startMock(s, paper, 90, 'b');
    expect(next.attempts.a).toEqual(s.attempts.a);
    expect(next.current[paper.id]).toBe('b');
  });
  it('cannot replace a still open attempt with a fresh one', () => {
    expect(() => startMock(initial(), paper, 90, 'b')).toThrow();
  });
  it('rejects corrupt, newer-version, changed-paper, and inconsistent-lock records without writing', () => {
    const s = submit(enter(initial()));
    const badVersion = { ...s, version: 2 };
    const badRevision = structuredClone(s); badRevision.attempts.a.revision++;
    const badLock = structuredClone(s); badLock.attempts.a.activeType = 'algorithm';
    const badDraft = structuredClone(s); badDraft.attempts.a.drafts['gbits-067'] = { answerMd: 'tampered' };
    for (const raw of ['{', JSON.stringify(badVersion), JSON.stringify(badRevision), JSON.stringify(badLock), JSON.stringify(badDraft)]) {
      const storage = memory(raw);
      expect(loadMockStore(storage).record).toBeNull();
      expect(loadMockStore(storage).error).toContain('未覆盖原数据');
      expect(storage.getItem(MOCK_STORAGE_KEY)).toBe(raw);
    }
  });
  it('rejects stale windows and storage failures before advancing their persisted locks', () => {
    const storage = memory(); const original = initial();
    const raw = saveMockStore(storage, original, null);
    const active = enter(original);
    saveMockStore(storage, active, raw);
    expect(() => saveMockStore(storage, submit(active), raw)).toThrow('其他页面');
    const failure = { getItem: () => raw, setItem: () => { throw new Error('quota'); } };
    expect(() => saveMockStore(failure, submit(enter(original)), raw)).toThrow('quota');
    expect(JSON.parse(failure.getItem()).attempts.a.submitted).toEqual({});
  });
  it('counts partially filled questions as incomplete', () => {
    expect(hasAnswer({ type: 'fill_blank', payload: { blanks: [{ id: 'a' }, { id: 'b' }] } }, { answers: { a: '1', b: ' ' } })).toBe(false);
    expect(hasAnswer({ type: 'algorithm' }, { answerMd: 'code' })).toBe(true);
  });
});
