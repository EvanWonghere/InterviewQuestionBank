import { readFileSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseQuestion } from './questionSchema';

const data = JSON.parse(readFileSync(resolve(process.cwd(), 'public/questions.json'), 'utf8'));
const pack = data.questions.filter((q) => Number(q.id.slice(2)) >= 149);

describe('published static question content', () => {
  it('keeps stable unique IDs, valid categories and readable answers', () => {
    expect(new Set(data.questions.map((q) => q.id)).size).toBe(data.questions.length);
    const categories = new Set(data.categories.map((c) => c.id));
    for (const q of data.questions) {
      expect(categories.has(q.categoryId)).toBe(true);
      expect(() => parseQuestion({ ...q, type: 'short_answer', promptMd: q.question,
        status: 'published', visibility: 'public', solution: { referenceAnswerMd: q.answer } })).not.toThrow();
    }
  });
  it('has the requested topic groups and engine principles with assessable answers', () => {
    expect(pack).toHaveLength(30);
    for (const q of pack) {
      for (const section of ['参考回答', '评分点', '追问与易错点', '最小验证', '资料与适用范围']) expect(q.answer).toContain(section);
      expect(q.sourceUrl).toMatch(/^https:\/\//);
    }
    expect(pack.find((q) => q.id === 'q-151').answer).toContain('不代表位于矩形内');
    expect(pack.find((q) => q.id === 'q-158').answer).toContain('不能把AAB文件直接当APK安装');
    expect(pack.find((q) => q.id === 'q-162').answer).toContain('资源管理');
    expect(pack.filter((q) => q.tags.includes('引擎原理'))).toHaveLength(12);
    expect(pack.find((q) => q.id === 'q-169').answer).toContain('ReferenceEquals');
    expect(pack.find((q) => q.id === 'q-172').answer).toContain('0.9');
  });
  it('keeps the additive cloud pack identical to the reviewed static questions', () => {
    const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260906000000_quality_question_pack.sql'), 'utf8');
    expect(JSON.parse(sql.split('$question_data$')[1])).toEqual(pack);
    expect(sql).toContain("'published', 'public'");
    expect(sql).toContain('on conflict (legacy_id) do nothing');
  });
});
