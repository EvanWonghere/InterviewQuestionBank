import { z } from 'zod';

export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'fill_blank',
  'short_answer',
  'algorithm',
  'engineering',
];

export const QUESTION_TYPE_LABELS = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  fill_blank: '填空题',
  short_answer: '简答题',
  algorithm: '算法题',
  engineering: '工程任务',
};

const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
const blankSchema = z.object({ id: z.string().min(1), label: z.string().min(1) });

export const questionSchema = z
  .object({
    id: z.string().optional(),
    legacyId: z.string().nullable().optional(),
    originKind: z.enum(['follow_up', 'weakness']).nullable().optional(),
    originEvaluationId: z.string().uuid().nullable().optional(),
    originWeaknessTag: z.string().trim().max(40).nullable().optional(),
    categoryId: z.string().min(1, '请选择分类'),
    type: z.enum(QUESTION_TYPES),
    title: z.string().trim().min(1, '标题不能为空'),
    promptMd: z.string().trim().min(1, '题干不能为空'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    sourceTitle: z.string().optional().default(''),
    sourceUrl: z.union([z.literal(''), z.string().url('来源链接格式不正确')]).optional().default(''),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    visibility: z.enum(['private', 'public']).default('private'),
    tags: z.array(z.string().trim().min(1)).default([]),
    payload: z.object({
      options: z.array(optionSchema).optional(),
      blanks: z.array(blankSchema).optional(),
      language: z.string().optional(),
      starterCode: z.string().optional(),
    }).default({}),
    solution: z.object({
      correctOptionIds: z.array(z.string()).optional(),
      acceptedAnswers: z.record(z.string(), z.array(z.string())).optional(),
      caseSensitive: z.boolean().optional().default(false),
      referenceAnswerMd: z.string().optional().default(''),
      rubricMd: z.string().optional().default(''),
      explanationMd: z.string().optional().default(''),
    }).default({}),
  })
  .superRefine((question, ctx) => {
    const optionIds = new Set((question.payload.options ?? []).map((option) => option.id));
    const correctIds = question.solution.correctOptionIds ?? [];
    if (['single_choice', 'multiple_choice'].includes(question.type)) {
      if ((question.payload.options ?? []).length < 2) {
        ctx.addIssue({ code: 'custom', path: ['payload', 'options'], message: '选择题至少需要两个选项' });
      }
      const expected = question.type === 'single_choice' ? 1 : 2;
      if (correctIds.length < expected || correctIds.some((id) => !optionIds.has(id))) {
        ctx.addIssue({ code: 'custom', path: ['solution', 'correctOptionIds'], message: '请设置有效的正确选项' });
      }
    }
    if (question.type === 'fill_blank') {
      const blanks = question.payload.blanks ?? [];
      if (!blanks.length) ctx.addIssue({ code: 'custom', path: ['payload', 'blanks'], message: '至少需要一个填空' });
      for (const blank of blanks) {
        if (!(question.solution.acceptedAnswers?.[blank.id] ?? []).some((answer) => answer.trim())) {
          ctx.addIssue({ code: 'custom', path: ['solution', 'acceptedAnswers', blank.id], message: `${blank.label} 缺少可接受答案` });
        }
      }
    }
    if (question.status === 'published' && !question.solution.referenceAnswerMd.trim() && !['single_choice', 'multiple_choice', 'fill_blank'].includes(question.type)) {
      ctx.addIssue({ code: 'custom', path: ['solution', 'referenceAnswerMd'], message: '发布主观题前必须填写参考答案' });
    }
  });

export function parseQuestion(input) {
  return questionSchema.parse(input);
}

export function defaultQuestion() {
  return {
    categoryId: '',
    type: 'short_answer',
    title: '',
    promptMd: '',
    difficulty: 'medium',
    sourceTitle: '',
    sourceUrl: '',
    status: 'draft',
    visibility: 'private',
    tags: [],
    payload: {},
    solution: { referenceAnswerMd: '', rubricMd: '', explanationMd: '', caseSensitive: false },
  };
}
