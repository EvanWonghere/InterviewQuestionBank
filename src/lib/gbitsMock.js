import { z } from 'zod';
import { getMockPaper, MOCK_TYPES, mockQuestionIds } from '../data/gbitsMockPapers';

export const MOCK_STORAGE_KEY = 'iqb:gbits-written-mock-v1';
const submission = z.union([
  z.object({ optionId: z.string() }).strict(),
  z.object({ answers: z.record(z.string(), z.string()) }).strict(),
  z.object({ answerMd: z.string() }).strict(),
]);
const answerMap = z.record(z.string(), submission);
const attemptSchema = z.object({
  id: z.string().min(1), paperId: z.string(), revision: z.number().int(),
  duration: z.union([z.literal(90), z.literal(120)]), startedAt: z.number().nonnegative().nullable(),
  activeType: z.enum(MOCK_TYPES).nullable(), drafts: answerMap,
  submitted: z.partialRecord(z.enum(MOCK_TYPES), z.object({ at: z.number().nonnegative(), snapshot: answerMap }).strict()),
}).strict();
const storeSchema = z.object({ version: z.literal(1), current: z.record(z.string(), z.string()), attempts: z.record(z.string(), attemptSchema) }).strict();
const emptyStore = () => ({ version: 1, current: {}, attempts: {} });
export function isComplete(attempt) { return MOCK_TYPES.every((type) => attempt.submitted[type]); }
export function initialSubmission(type) {
  return type === 'single_choice' ? { optionId: '' } : type === 'fill_blank' ? { answers: {} } : { answerMd: '' };
}
export function hasAnswer(q, value) {
  if (!q) return false;
  if (q.type === 'single_choice') return Boolean(value?.optionId);
  if (q.type === 'fill_blank') return q.payload.blanks.every((blank) => value?.answers?.[blank.id]?.trim());
  return Boolean(value?.answerMd?.trim());
}
export function validateMockStore(record) {
  const parsed = storeSchema.parse(record);
  for (const [id, attempt] of Object.entries(parsed.attempts)) {
    const paper = getMockPaper(attempt.paperId);
    if (!paper || attempt.id !== id || attempt.revision !== paper.revision) throw new Error('试卷版本不同，请导出记录后保留原数据。');
    const allowed = new Set(mockQuestionIds(paper));
    if (Object.keys(attempt.drafts).some((key) => !allowed.has(key))) throw new Error('草稿含未知题目。');
    for (const type of MOCK_TYPES) {
      for (const key of paper.groups[type]) {
        const value = attempt.drafts[key];
        if (value && !(type === 'single_choice' ? 'optionId' in value : type === 'fill_blank' ? 'answers' in value : 'answerMd' in value)) throw new Error('草稿题型不匹配。');
      }
      const block = attempt.submitted[type];
      if (block) {
        if (!attempt.startedAt || Object.keys(block.snapshot).length !== paper.groups[type].length) throw new Error('提交快照不完整。');
        for (const key of paper.groups[type]) {
          if (!block.snapshot[key] || JSON.stringify(block.snapshot[key]) !== JSON.stringify(attempt.drafts[key])) throw new Error('已提交区块与草稿冲突。');
        }
      }
    }
    if (attempt.activeType && (!attempt.startedAt || attempt.submitted[attempt.activeType])) throw new Error('题型锁定记录冲突。');
  }
  for (const [paperId, id] of Object.entries(parsed.current)) {
    if (!parsed.attempts[id] || parsed.attempts[id].paperId !== paperId) throw new Error('练习索引损坏。');
  }
  return parsed;
}
export function loadMockStore(storage) {
  let raw = null;
  try {
    raw = storage.getItem(MOCK_STORAGE_KEY);
    return { raw, record: raw === null ? emptyStore() : validateMockStore(JSON.parse(raw)), error: '' };
  } catch (error) {
    return { raw, record: null, error: `无法恢复模拟记录，未覆盖原数据：${error.message}` };
  }
}
export function saveMockStore(storage, record, expectedRaw) {
  validateMockStore(record);
  if (storage.getItem(MOCK_STORAGE_KEY) !== expectedRaw) throw new Error('其他页面已更新记录，请先导出当前草稿，再恢复已保存进度。');
  const raw = JSON.stringify(record);
  storage.setItem(MOCK_STORAGE_KEY, raw);
  if (storage.getItem(MOCK_STORAGE_KEY) !== raw) throw new Error('保存未成功，请导出草稿并重试。');
  return raw;
}
export function startMock(record, paper, duration, id) {
  const old = record.attempts[record.current[paper.id]];
  if (old && !isComplete(old)) throw new Error('当前练习尚未完成，请继续原练习。');
  if (record.attempts[id]) throw new Error('练习 ID 重复。');
  return validateMockStore({ ...record, current: { ...record.current, [paper.id]: id }, attempts: { ...record.attempts, [id]: { id, paperId: paper.id, revision: paper.revision, duration, startedAt: null, activeType: null, drafts: {}, submitted: {} } } });
}
export function updateMock(record, id, event, now = Date.now()) {
  const old = record.attempts[id];
  if (!old) throw new Error('没有找到练习。');
  const paper = getMockPaper(old.paperId);
  let next = structuredClone(old);
  if (event.type === 'enter') {
    if (!MOCK_TYPES.includes(event.block) || old.activeType || old.submitted[event.block]) throw new Error('当前题型未提交，或该题型已锁定。');
    next.activeType = event.block;
    next.startedAt ??= now;
  } else if (event.type === 'edit') {
    if (!old.activeType || !paper.groups[old.activeType].includes(event.questionId) || old.submitted[old.activeType]) throw new Error('不能修改其他题型或已提交题型。');
    next.drafts[event.questionId] = event.submission;
  } else if (event.type === 'submit') {
    const type = old.activeType;
    if (!type || old.submitted[type]) throw new Error('没有可提交的题型。');
    const snapshot = Object.fromEntries(paper.groups[type].map((key) => [key, old.drafts[key] ?? initialSubmission(type)]));
    next = { ...next, activeType: null, drafts: { ...next.drafts, ...snapshot }, submitted: { ...next.submitted, [type]: { at: now, snapshot } } };
  } else throw new Error('未知操作。');
  return validateMockStore({ ...record, attempts: { ...record.attempts, [id]: next } });
}
