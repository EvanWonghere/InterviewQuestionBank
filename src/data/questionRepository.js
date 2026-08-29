import { loadQuestions as loadStaticQuestions } from '@/data/loadQuestions';
import { isSupabaseConfigured, requireSupabase } from '@/lib/supabase';
import { defaultQuestion } from '@/lib/questionSchema';

function mapCloudQuestion(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id,
    categoryId: row.category_id,
    type: row.type,
    title: row.title,
    question: row.prompt_md,
    promptMd: row.prompt_md,
    tags: (row.question_tags ?? []).map((entry) => entry.tags?.name).filter(Boolean),
    difficulty: row.difficulty,
    order: row.sort_order,
    payload: row.payload ?? {},
    sourceTitle: row.source_title ?? '',
    sourceUrl: row.source_url ?? '',
    status: row.status,
    visibility: row.visibility,
  };
}

export async function listQuestions() {
  if (!isSupabaseConfigured) {
    const data = await loadStaticQuestions();
    return {
      ...data,
      questions: data.questions.map((question) => ({
        ...question,
        legacyId: question.id,
        type: 'short_answer',
        promptMd: question.question,
        solution: { referenceAnswerMd: question.answer },
        status: 'published',
        visibility: 'public',
      })),
      source: 'static',
    };
  }
  const client = requireSupabase();
  const [{ data: categories, error: categoriesError }, { data: questions, error: questionsError }] = await Promise.all([
    client.from('categories').select('id,slug,name,sort_order').order('sort_order'),
    client
      .from('questions')
      .select('id,legacy_id,category_id,type,title,prompt_md,difficulty,sort_order,payload,source_title,source_url,status,visibility,question_tags(tags(name))')
      .order('sort_order'),
  ]);
  if (categoriesError) throw categoriesError;
  if (questionsError) throw questionsError;
  return {
    categories: categories.map((row) => ({ id: row.id, slug: row.slug, name: row.name, order: row.sort_order })),
    questions: questions.map(mapCloudQuestion),
    source: 'supabase',
  };
}

export async function getQuestionForEdit(id) {
  const client = requireSupabase();
  const [{ data: question, error }, { data: solution, error: solutionError }] = await Promise.all([
    client
      .from('questions')
      .select('*,question_tags(tags(name))')
      .eq('id', id)
      .single(),
    client.from('question_solutions').select('*').eq('question_id', id).single(),
  ]);
  if (error) throw error;
  if (solutionError) throw solutionError;
  return {
    ...defaultQuestion(),
    ...mapCloudQuestion(question),
    solution: solution.solution ?? {},
  };
}

export async function saveQuestion(input) {
  const client = requireSupabase();
  const row = {
    category_id: input.categoryId,
    type: input.type,
    title: input.title,
    prompt_md: input.promptMd,
    difficulty: input.difficulty,
    payload: input.payload ?? {},
    source_title: input.sourceTitle || null,
    source_url: input.sourceUrl || null,
    status: input.status,
    visibility: input.visibility,
  };
  const { data: question, error } = input.id
    ? await client.from('questions').update(row).eq('id', input.id).select().single()
    : await client.from('questions').insert(row).select().single();
  if (error) throw error;

  const { error: solutionError } = await client
    .from('question_solutions')
    .upsert({ question_id: question.id, solution: input.solution ?? {} });
  if (solutionError) throw solutionError;

  const tags = [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  const { error: replaceError } = await client.rpc('replace_question_tags', {
    p_question_id: question.id,
    p_tag_names: tags,
  });
  if (replaceError) throw replaceError;
  return question.id;
}

export async function archiveQuestion(id) {
  const { error } = await requireSupabase().from('questions').update({ status: 'archived' }).eq('id', id);
  if (error) throw error;
}

export async function duplicateQuestion(id) {
  const source = await getQuestionForEdit(id);
  return saveQuestion({ ...source, id: undefined, legacyId: undefined, title: `${source.title}（副本）`, status: 'draft', visibility: 'private' });
}

export async function gradeCloudQuestion(questionId, submission) {
  const { data, error } = await requireSupabase().rpc('grade_question', {
    p_question_id: questionId,
    p_submission: submission ?? {},
  });
  if (error) throw error;
  return data;
}
