import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import { parseQuestion } from './questionSchema';
import { normalizeStaticQuestion } from './staticQuestion';
import { gradeObjective } from './grading';
import { GBITS_TOPIC, selectTopicQuestions, topicIds } from '../data/gbitsTopic';

const data = JSON.parse(readFileSync(resolve(process.cwd(), 'public/questions.json'), 'utf8'));
const pack = data.questions.filter((q) => q.id.startsWith('gbits-'));
describe('G-bits training topic', () => {
  it('has valid typed questions, provenance and assessable solutions', () => {
    expect(pack).toHaveLength(42);
    for (const question of pack) {
      expect(() => parseQuestion(normalizeStaticQuestion(question))).not.toThrow();
      expect(question.question).toContain('来源边界');
      for (const heading of ['参考回答', '评分点', '追问与易错点', '最小验证', '资料与适用范围']) expect(question.answer).toContain(heading);
    }
    expect(pack.filter((q) => q.type === 'algorithm')).toHaveLength(14);
  });
  it('keeps old static records readable and new objective grading functional', () => {
    expect(normalizeStaticQuestion(data.questions[0]).type).toBe('short_answer');
    for (const raw of pack.filter((q) => ['single_choice', 'multiple_choice', 'fill_blank'].includes(q.type))) {
      const q = normalizeStaticQuestion(raw);
      const correct = q.type === 'single_choice' ? { optionId: q.solution.correctOptionIds[0] } : q.type === 'multiple_choice' ? { optionIds: q.solution.correctOptionIds } : { answers: Object.fromEntries(q.payload.blanks.map((b) => [b.id, q.solution.acceptedAnswers[b.id][0]])) };
      expect(gradeObjective(q, correct)).toBe(true);
      expect(gradeObjective(q, {})).toBe(false);
    }
    const multi = normalizeStaticQuestion(pack.find((q) => q.type === 'multiple_choice'));
    expect(gradeObjective(multi, { optionIds: multi.solution.correctOptionIds.slice(1) })).toBe(false);
  });
  it('resolves the same ordered topic against cloud UUIDs and fails closed for unknown selectors', () => {
    expect(new Set(topicIds()).size).toBe(topicIds().length);
    const local = selectTopicQuestions(data.questions);
    expect(local).toHaveLength(topicIds().length);
    const cloud = data.questions.map((q, i) => ({ ...q, id: `uuid-${i}`, legacyId: q.id }));
    expect(selectTopicQuestions(cloud).map((q) => q.legacyId)).toEqual(local.map((q) => q.id));
    expect(selectTopicQuestions(cloud, { section: 'missing' })).toEqual([]);
    expect(selectTopicQuestions(cloud, { set: 'missing' })).toEqual([]);
    expect(selectTopicQuestions([], { set: 'paper' })).toEqual([]);
  });
  it('includes exactly 20 choices, 4 blanks and 2 algorithms in the training paper', () => {
    const paper = selectTopicQuestions(data.questions, { set: 'paper' });
    expect(paper).toHaveLength(26);
    expect(paper.filter((q) => q.type.endsWith('choice'))).toHaveLength(20);
    expect(paper.filter((q) => q.type === 'fill_blank')).toHaveLength(4);
    expect(paper.filter((q) => q.type === 'algorithm')).toHaveLength(2);
    expect(GBITS_TOPIC.startIds).toHaveLength(6);
  });
  it('matches the insert-only migration to reviewed content', () => {
    const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261013000000_gbits_study_pack.sql'), 'utf8');
    expect(JSON.parse(sql.split('$question_data$')[1])).toEqual(pack);
    expect(sql).toContain('on conflict (legacy_id) do nothing');
    expect(sql).not.toMatch(/update public\.(questions|question_solutions|attempts|review_states)/i);
    const fixtures = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/fixtures/gbits-reference-cases.json'), 'utf8'));
    for (const q of pack.filter((q) => q.type === 'algorithm')) expect(q.answer).toContain(fixtures.programs[q.id]);
  });
});
