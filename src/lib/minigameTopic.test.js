import process from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MINIGAME_TOPIC, isMinigameQuestion, minigameTopicIds, selectMinigameQuestions } from '../data/minigameTopic';
import { normalizeStaticQuestion } from './staticQuestion';
import { parseQuestion } from './questionSchema';

const data = JSON.parse(readFileSync(resolve(process.cwd(), 'public/questions.json'), 'utf8'));
const pack = data.questions.filter((q) => q.id.startsWith('minigame-'));

describe('minigame topic and public question pack', () => {
  it('has 22 unique ordered IDs, 14 existing questions and 8 new reviewed questions', () => {
    const ids = minigameTopicIds();
    expect(MINIGAME_TOPIC.sections.map((s) => s.ids.length)).toEqual([10, 4, 4, 4]);
    expect(ids).toHaveLength(22);
    expect(new Set(ids).size).toBe(22);
    expect(pack.map((q) => q.id)).toEqual(Array.from({ length: 8 }, (_, i) => `minigame-${String(i + 1).padStart(3, '0')}`));
    expect(selectMinigameQuestions(data.questions).map((q) => q.id)).toEqual(ids);
  });

  it('validates the actual fields, rubrics and source boundaries for all eight', () => {
    expect(pack).toHaveLength(8);
    for (const q of pack) {
      expect(() => parseQuestion(normalizeStaticQuestion(q))).not.toThrow();
      expect(q.type).toBe('short_answer');
      expect(q.answer).toBe(q.solution.referenceAnswerMd);
      expect(q.question).toContain('不代表具体岗位或实际面试原题');
      expect(q.sourceUrl).toMatch(/^https:\/\//);
      for (const heading of ['参考回答', '评分点', '追问与易错点', '最小验证', '资料与适用范围']) expect(q.answer).toContain(heading);
      expect(q.solution.rubricMd.split('\n').filter((line) => line.startsWith('- ')).length).toBeGreaterThanOrEqual(3);
      expect(q.solution.rubricMd.split('\n').filter((line) => line.startsWith('- ')).length).toBeLessThanOrEqual(6);
    }
  });

  it('embeds exactly the reviewed questions in an insert-only migration', () => {
    const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261027000000_minigame_client_pack.sql'), 'utf8');
    expect(JSON.parse(sql.split('$question_data$')[1])).toEqual(pack);
    expect(sql).toContain('on conflict (legacy_id) do nothing');
    expect(sql).not.toMatch(/(?:update|delete from|truncate) public\.(questions|question_solutions|attempts|review_states)/i);
  });

  it('resolves static IDs and cloud UUID plus legacyId in the same order', () => {
    const local = selectMinigameQuestions(data.questions);
    const cloud = data.questions.map((q, i) => ({ ...q, id: `uuid-${i}`, legacyId: q.id, status: 'published', visibility: 'public' }));
    expect(selectMinigameQuestions(cloud).map((q) => q.legacyId)).toEqual(local.map((q) => q.id));
    expect(selectMinigameQuestions(cloud, { section: 'laya' }).map((q) => q.legacyId)).toEqual(minigameTopicIds({ section: 'laya' }));
  });

  it('rejects unknown selectors and does not include private or draft rows', () => {
    for (const selection of [{ section: 'missing' }, { set: 'missing' }, { scope: 'missing' }]) expect(selectMinigameQuestions(data.questions, selection)).toEqual([]);
    const id = minigameTopicIds({ section: 'laya' })[0];
    expect(isMinigameQuestion({ id, status: 'published', visibility: 'private' }, { section: 'laya' })).toBe(false);
    expect(isMinigameQuestion({ id, status: 'draft', visibility: 'public' }, { section: 'laya' })).toBe(false);
    expect(selectMinigameQuestions([{ id, status: 'published', visibility: 'private' }], { section: 'laya' })).toEqual([]);
    expect(isMinigameQuestion({ id: 'q-001' }, { section: 'laya' })).toBe(false);
  });

  it('keeps the expected ID list intact when the current source lacks a question', () => {
    const subset = data.questions.filter((q) => q.id !== 'minigame-004');
    expect(minigameTopicIds({ section: 'laya' })).toHaveLength(4);
    expect(selectMinigameQuestions(subset, { section: 'laya' })).toHaveLength(3);
  });
});
