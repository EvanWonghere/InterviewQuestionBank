import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, it, expect } from 'vitest';
import { parseQuestion } from './questionSchema';
import { normalizeStaticQuestion } from './staticQuestion';
import { gradeObjective } from './grading';
import { GBITS_MOCK_PAPERS, mockQuestionIds } from '../data/gbitsMockPapers';
const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const data = JSON.parse(read('public/questions.json'));
const parts = ['a', 'b', 'c'].map((letter) => JSON.parse(read(`scripts/gbits-sprint/paper-${letter}.json`)));
const ids = GBITS_MOCK_PAPERS.flatMap(mockQuestionIds);
const bank = new Map(data.questions.map((q) => [q.id, q]));
const pack = ids.map((id) => bank.get(id));
describe('G-bits sprint content and insertion artifact', () => {
  it('contains 78 new, schema-valid questions with honest per-question provenance and no unchanged old prompts', () => {
    expect(data.questions).toHaveLength(298);
    expect(new Set(data.questions.map((q) => q.id)).size).toBe(298);
    expect(pack).toEqual(parts.flat());
    const oldPrompts = new Set(data.questions.filter((q) => !ids.includes(q.id)).map((q) => q.question));
    for (const raw of pack) {
      expect(() => parseQuestion(normalizeStaticQuestion(raw))).not.toThrow();
      expect(raw.tags).toContain('吉比特冲刺预测');
      expect(raw.question).toContain('来源边界');
      expect(raw.question).toMatch(/历年考点|预测考点/);
      expect(raw.sourceTitle).toBeTruthy();
      if (raw.sourceUrl) expect(raw.sourceUrl).toMatch(/^https:/);
      if (raw.question.includes('历年考点')) expect(raw.sourceUrl).toMatch(/^https:/);
      expect(raw.answer).toBe(raw.solution.referenceAnswerMd);
      expect(oldPrompts.has(raw.question)).toBe(false);
      expect(raw.answer).toContain('评分点');
      if (raw.type === 'single_choice') {
        expect(raw.payload.options).toHaveLength(4);
        expect(new Set(raw.payload.options.map((o) => o.id)).size).toBe(4);
        expect(raw.solution.correctOptionIds).toHaveLength(1);
        for (const o of raw.payload.options) expect(gradeObjective(normalizeStaticQuestion(raw), { optionId: o.id })).toBe(raw.solution.correctOptionIds[0] === o.id);
      } else if (raw.type === 'fill_blank') {
        const q = normalizeStaticQuestion(raw);
        expect(gradeObjective(q, { answers: Object.fromEntries(q.payload.blanks.map((b) => [b.id, q.solution.acceptedAnswers[b.id][0]])) })).toBe(true);
        expect(gradeObjective(q, {})).toBe(false);
      } else {
        for (const marker of ['输入', '输出', '样例', '```cpp']) expect(raw.question + raw.answer).toContain(marker);
        expect(raw.answer).toMatch(/(?:复杂度|时间)[\s\S]*?O\(/);
      }
    }
    expect(new Set(pack.map((q) => q.title)).size).toBe(78);
    expect(new Set(pack.map((q) => q.question)).size).toBe(78);
    const longBlanks = pack.filter((q) => q.type === 'fill_blank' && (q.question.match(/```cpp\n([\s\S]*?)```/)?.[1].trim().split('\n').length ?? 0) >= 15);
    expect(longBlanks.length).toBeGreaterThanOrEqual(6);
  });
  it('matches each variable blueprint and freezes question order', () => {
    for (const [i, paper] of GBITS_MOCK_PAPERS.entries()) {
      expect(parts[i].map((q) => q.id)).toEqual(mockQuestionIds(paper));
      for (const [type, ids] of Object.entries(paper.groups)) for (const id of ids) expect(bank.get(id).type).toBe(type);
    }
    expect(pack.filter((q) => q.type === 'single_choice')).toHaveLength(60);
    expect(pack.filter((q) => q.type === 'fill_blank')).toHaveLength(10);
    expect(pack.filter((q) => q.type === 'algorithm')).toHaveLength(8);
  });
  it('embeds exactly reviewed new content in an insert-only independent migration', () => {
    const sql = read('supabase/migrations/20261015000000_gbits_sprint_pack.sql');
    expect(JSON.parse(sql.split('$question_data$')[1])).toEqual(pack);
    expect(sql).toContain('on conflict (legacy_id) do nothing');
    expect(sql).not.toMatch(/(?:update|delete from|truncate) public\.(questions|question_solutions|attempts|review_states)/i);
  });
});
