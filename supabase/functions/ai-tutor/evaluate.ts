import { aggregateWeaknesses, MAX_ROUNDS, parseEvaluation, parseInterviewReport, parseWeaknessReport, validateEvaluateInput, validateReportInput, weaknessTags } from './evaluation.js';
import { buildEvaluationMessages, buildInterviewReportMessages, buildWeaknessReportMessages } from './evaluationPrompts.js';
import { modelFailure } from './modelErrors.js';
import { parseGeneratedQuestion, parseGeneratedQuestionSet, validateDraftInput, validateWeaknessDraftInput } from './questionDraft.js';
import { buildQuestionDraftMessages, buildWeaknessQuestionsMessages } from './evaluationPrompts.js';

type Row = Record<string, any>;
const likeLiteral = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);
type Must = <T>(r: { data: T; error: { message: string } | null }) => T;
export type EvaluationContext = {
  uid: string;
  client: any; // user JWT client: grade_question enforces the caller's own visibility
  db: any; // service-role client
  model: string;
  callModel: (messages: unknown[], options?: { budgetScale?: number }) => Promise<string>; // JSON Output, configured thinking mode and budget
  json: (data: unknown, status?: number) => Response;
  must: Must;
};

export async function handleEvaluate(input: Row, ctx: EvaluationContext) {
  const { uid, client, db, must, json } = ctx;
  validateEvaluateInput(input);
  const q = must(await db.from('questions').select('id,title,prompt_md,type,payload,updated_at').eq('id', input.questionId).single()) as Row;
  if (!q) return json({ error: '题目不存在' }, 404);
  let correct: boolean | null = null;
  if (!input.parentId) {
    const graded = must(await client.rpc('grade_question', { p_question_id: q.id, p_submission: input.submission ?? {} })) as Row;
    correct = typeof graded?.correct === 'boolean' ? graded.correct : null;
  }
  const submission = input.parentId ? { answerMd: input.answerMd } : (input.submission ?? {});
  const begin = must(await db.rpc('ai_begin_evaluation', {
    p_user: uid, p_question: q.id, p_version: q.updated_at, p_request: input.requestId, p_mode: input.mode,
    p_session: input.sessionId ?? null, p_parent: input.parentId ?? null, p_submission: submission, p_correct: correct, p_model: ctx.model,
  })) as Row;
  const row = begin.evaluation as Row;
  if (begin.duplicate) {
    // Safe retry after a lost response: return the stored result instead of calling the model again.
    if (row.status === 'complete') return json({ evaluation: row });
    return json({ error: row.status === 'running' ? '评估仍在进行，请稍后重试' : '此次评估已失败，请重新发起', duplicate: true, settled: row.status !== 'running' }, 409);
  }
  try {
    const chain = row.root_id
      ? (must(await db.from('ai_evaluations').select('round,follow_up_question,submission,score,result,status').eq('user_id', uid)
        .or(`id.eq.${row.root_id},root_id.eq.${row.root_id}`).eq('status', 'complete').lt('round', row.round).order('round')) as Row[])
      : [];
    const solution = must(await db.from('question_solutions').select('solution').eq('question_id', q.id).maybeSingle()) as Row | null;
    const messages = buildEvaluationMessages({
      question: q, solution: solution?.solution, correct: row.is_correct, mode: row.mode, chain,
      current: { followUpQuestion: row.follow_up_question, answer: submission },
    });
    const result = parseEvaluation(await ctx.callModel(messages), { correct: row.is_correct, allowFollowUp: row.round < MAX_ROUNDS[row.mode as 'practice' | 'interview'], isFollowUp: row.round > 1 });
    const saved = must(await db.from('ai_evaluations').update({
      status: 'complete', result, score: result.score, suggested_rating: result.suggestedRating, weakness_tags: weaknessTags(result),
    }).eq('id', row.id).eq('status', 'running').select('*')) as Row[];
    if (!saved?.length) return json({ error: '评估状态已变化，请重试以核对保存结果' }, 409);
    return json({ evaluation: saved[0] });
  } catch (error) {
    const failed = await db.from('ai_evaluations').update({ status: 'failed' }).eq('id', row.id).eq('status', 'running').select('id');
    const settled = !failed.error && Boolean(failed.data?.length);
    if (error instanceof Error && error.message.startsWith('题目与作答')) return json({ error: error.message, settled }, 400);
    const failure = modelFailure(error);
    return json({ ...failure, settled }, failure.status);
  }
}

async function runReport(ctx: EvaluationContext, input: Row, kind: 'interview' | 'weakness', produce: () => Promise<unknown>) {
  const { uid, db, must, json } = ctx;
  const begin = must(await db.rpc('ai_begin_report', { p_user: uid, p_kind: kind, p_session: input.sessionId ?? null, p_request: input.requestId, p_model: ctx.model })) as Row;
  const row = begin.report as Row;
  if (begin.duplicate) {
    if (row.status === 'complete') return json({ report: row });
    return json({ error: row.status === 'running' ? '报告仍在生成，请稍后重试' : '此次生成已失败，请重新发起', duplicate: true, settled: row.status !== 'running' }, 409);
  }
  try {
    const result = await produce();
    const saved = must(await db.from('ai_reports').update({ status: 'complete', result }).eq('id', row.id).eq('status', 'running').select('*')) as Row[];
    if (!saved?.length) return json({ error: '报告状态已变化，请重试以核对保存结果' }, 409);
    return json({ report: saved[0] });
  } catch (error) {
    const failed = await db.from('ai_reports').update({ status: 'failed' }).eq('id', row.id).eq('status', 'running').select('id');
    const failure = modelFailure(error);
    return json({ ...failure, settled: !failed.error && Boolean(failed.data?.length) }, failure.status);
  }
}

export async function handleInterviewReport(input: Row, ctx: EvaluationContext) {
  const { uid, db, must, json } = ctx;
  validateReportInput(input);
  const rows = must(await db.from('ai_evaluations').select('question_id,round,follow_up_question,score,result,created_at')
    .eq('user_id', uid).eq('session_id', input.sessionId).eq('status', 'complete').order('created_at')) as Row[];
  if (!rows?.length) return json({ error: '本场还没有完成的AI评估，无法生成报告' }, 400);
  const ids = [...new Set(rows.map((r) => r.question_id))];
  const questions = must(await db.from('questions').select('id,title,type').in('id', ids)) as Row[];
  const byId = new Map(questions.map((x) => [x.id, x]));
  const items = ids.map((id) => {
    const rounds = rows.filter((r) => r.question_id === id);
    return {
      questionId: id, title: byId.get(id)?.title ?? '', type: byId.get(id)?.type ?? '',
      finalScore: rounds.at(-1)?.score,
      rounds: rounds.map((r) => ({ round: r.round, followUp: r.follow_up_question, score: r.score, verdict: r.result?.verdict, weaknesses: r.result?.weaknesses })),
    };
  });
  return runReport(ctx, input, 'interview', async () => {
    const report = parseInterviewReport(await ctx.callModel(buildInterviewReportMessages(items)), ids);
    return { ...report, questionScores: items.map((i) => ({ questionId: i.questionId, title: i.title, score: i.finalScore, rounds: i.rounds.length })) };
  });
}

export async function handleWeaknessReport(input: Row, ctx: EvaluationContext) {
  const { uid, db, must, json } = ctx;
  validateReportInput(input);
  const rows = must(await db.from('ai_evaluations').select('question_id,score,result,status,created_at')
    .eq('user_id', uid).eq('status', 'complete').order('created_at', { ascending: false }).limit(200)) as Row[];
  const weaknesses = aggregateWeaknesses(rows ?? []);
  if (!weaknesses.length) return json({ error: '暂无包含薄弱点的AI评估记录' }, 400);
  const ids = [...new Set(weaknesses.flatMap((w) => w.questionIds))].slice(0, 40);
  const questions = must(await db.from('questions').select('id,title').in('id', ids)) as Row[];
  const lowest = new Map<string, number>();
  for (const r of rows) if (typeof r.score === 'number' && (lowest.get(r.question_id) ?? 101) > r.score) lowest.set(r.question_id, r.score);
  const candidates = questions.map((x) => ({ id: x.id, title: x.title, lowestScore: lowest.get(x.id) ?? null }));
  return runReport(ctx, input, 'weakness', async () => {
    const report = parseWeaknessReport(await ctx.callModel(buildWeaknessReportMessages({ weaknesses, candidates })), candidates.map((c) => c.id));
    return { ...report, basedOn: rows.length };
  });
}

/**
 * Generates a standalone question from an answered follow-up. Nothing is written here:
 * the admin reviews the draft and saves it through the normal question editor path (RLS + questionSchema).
 */
export async function handleDraftQuestion(input: Row, ctx: EvaluationContext) {
  const { uid, db, must, json } = ctx;
  validateDraftInput(input);
  const evaluation = must(await db.from('ai_evaluations').select('id,question_id,round,follow_up_question,submission,score,result,status')
    .eq('user_id', uid).eq('id', input.evaluationId).maybeSingle()) as Row | null;
  if (!evaluation || evaluation.status !== 'complete' || evaluation.round < 2 || !evaluation.follow_up_question) {
    return json({ error: '只能把已回答并完成评估的追问加入题库' }, 400);
  }
  const source = must(await db.from('questions').select('title,type,prompt_md,difficulty,question_tags(tags(name))').eq('id', evaluation.question_id).single()) as Row;
  const solution = must(await db.from('question_solutions').select('solution').eq('question_id', evaluation.question_id).maybeSingle()) as Row | null;
  const messages = buildQuestionDraftMessages({
    requestedType: input.type,
    source: {
      title: source.title, type: source.type, prompt: source.prompt_md, difficulty: source.difficulty,
      tags: (source.question_tags ?? []).map((t: Row) => t.tags?.name).filter(Boolean), reference: solution?.solution ?? null,
    },
    followUp: evaluation.follow_up_question,
    answer: evaluation.submission?.answerMd ?? '',
    evaluation: { score: evaluation.result?.followUpAnswerScore ?? evaluation.score, verdict: evaluation.result?.verdict, weaknesses: evaluation.result?.weaknesses },
  });
  // Generation is billable, so it shares the per-minute limit with chat and evaluation.
  must(await db.rpc('ai_take_rate', { p_user: uid }));
  try {
    const question = parseGeneratedQuestion(await ctx.callModel(messages), { requestedType: input.type });
    return json({ question: { ...question, sourceTitle: `AI 追问 · ${source.title}`.slice(0, 200), originKind: 'follow_up', originEvaluationId: evaluation.id } });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('题目与作答')) return json({ error: error.message }, 400);
    const failure = modelFailure(error);
    return json(failure, failure.status);
  }
}

/**
 * Drafts a small set of questions aimed at one aggregated weakness. The weakness is re-derived from the
 * caller's own evaluations (client text is only a lookup key); nothing is written here.
 */
export async function handleWeaknessQuestions(input: Row, ctx: EvaluationContext) {
  const { uid, db, must, json } = ctx;
  validateWeaknessDraftInput(input);
  const rows = must(await db.from('ai_evaluations').select('question_id,score,result,status,created_at')
    .eq('user_id', uid).eq('status', 'complete').order('created_at', { ascending: false }).limit(200)) as Row[];
  const key = input.tag.trim().toLowerCase();
  const group = aggregateWeaknesses(rows ?? [], { limit: 1000 }).find((g) => g.tag.toLowerCase() === key);
  if (!group) return json({ error: '没有找到这个薄弱点对应的AI评估记录，请刷新后重试' }, 400);

  const relatedIds = group.questionIds.slice(0, 5);
  const related = relatedIds.length
    ? must(await db.from('questions').select('id,title,type,prompt_md,question_solutions(solution)').in('id', relatedIds)) as Row[]
    : [];
  // Titles to avoid: questions already drafted for this weakness, related ones, and ones tagged with it.
  // Escape LIKE wildcards so ilike acts as a case-insensitive equality on the tag.
  const drafted = must(await db.from('questions').select('title').ilike('origin_weakness_tag', likeLiteral(group.tag)).limit(40)) as Row[];
  const tagged = must(await db.from('tags').select('question_tags(questions(title))').ilike('name', likeLiteral(group.tag)).limit(1)) as Row[];
  const existingTitles = [...new Set([
    ...drafted.map((q) => q.title),
    ...related.map((q) => q.title),
    ...(tagged?.[0]?.question_tags ?? []).map((t: Row) => t.questions?.title),
  ].filter(Boolean))].slice(0, 60);

  const messages = buildWeaknessQuestionsMessages({
    count: input.count,
    types: input.types,
    weakness: { tag: group.tag, points: group.points, affectedQuestions: group.count, avgScore: group.avgScore },
    relatedQuestions: related.map((q) => ({
      title: q.title, type: q.type, prompt: String(q.prompt_md ?? '').slice(0, 2000),
      reference: String(q.question_solutions?.solution?.referenceAnswerMd ?? q.question_solutions?.[0]?.solution?.referenceAnswerMd ?? '').slice(0, 2000),
    })),
    existingTitles,
  });
  must(await db.rpc('ai_take_rate', { p_user: uid }));
  try {
    const questions = parseGeneratedQuestionSet(await ctx.callModel(messages, { budgetScale: input.count > 1 ? 2 : 1 }), { count: input.count, types: input.types });
    return json({
      tag: group.tag,
      questions: questions.map((q) => ({ ...q, sourceTitle: `AI 针对薄弱点 · ${group.tag}`, originKind: 'weakness', originWeaknessTag: group.tag })),
    });
  } catch (error) {
    const failure = modelFailure(error);
    return json(failure, failure.status);
  }
}
