import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error('需要 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY；密钥只用于本地一次性迁移，禁止写入 VITE_ 环境变量。');
  process.exit(1);
}

const legacy = JSON.parse(await readFile(new URL('../public/questions.json', import.meta.url), 'utf8'));
const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const categoryRows = legacy.categories.map((category) => ({
  slug: category.id,
  name: category.name,
  sort_order: category.order,
}));
const { data: categories, error: categoryError } = await client.from('categories').upsert(categoryRows, { onConflict: 'slug' }).select('id,slug');
if (categoryError) throw categoryError;
const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));

for (const question of legacy.questions) {
  const { data: saved, error } = await client.from('questions').upsert({
    legacy_id: question.id,
    category_id: categoryIds.get(question.categoryId),
    type: 'short_answer',
    title: question.title,
    prompt_md: question.question,
    difficulty: question.difficulty,
    payload: {},
    status: 'published',
    visibility: 'public',
    sort_order: question.order ?? 0,
  }, { onConflict: 'legacy_id' }).select('id').single();
  if (error) throw error;
  const { error: solutionError } = await client.from('question_solutions').upsert({
    question_id: saved.id,
    solution: { referenceAnswerMd: question.answer, rubricMd: '', explanationMd: '' },
  });
  if (solutionError) throw solutionError;
  const { error: clearTagsError } = await client.from('question_tags').delete().eq('question_id', saved.id);
  if (clearTagsError) throw clearTagsError;
  for (const name of question.tags ?? []) {
    const { data: tag, error: tagError } = await client.from('tags').upsert({ name }, { onConflict: 'name' }).select('id').single();
    if (tagError) throw tagError;
    const { error: joinError } = await client.from('question_tags').upsert({ question_id: saved.id, tag_id: tag.id });
    if (joinError) throw joinError;
  }
}

console.log(`迁移完成：${legacy.categories.length} 个分类，${legacy.questions.length} 道题。`);
