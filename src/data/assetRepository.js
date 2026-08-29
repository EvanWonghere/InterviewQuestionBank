import { requireSupabase } from '@/lib/supabase';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadQuestionAsset(questionId, file, userId) {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('仅支持 PNG、JPEG、WebP 或 GIF 图片');
  if (file.size > MAX_BYTES) throw new Error('图片不能超过 5 MB');
  const client = requireSupabase();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'image';
  const path = `${questionId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage.from('question-assets').upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;
  const { data, error } = await client.from('question_assets').insert({
    question_id: questionId,
    storage_path: path,
    mime_type: file.type,
    byte_size: file.size,
    created_by: userId,
  }).select('id').single();
  if (error) {
    await client.storage.from('question-assets').remove([path]);
    throw error;
  }
  return `asset://${data.id}`;
}

export async function getAssetUrl(assetId) {
  const client = requireSupabase();
  const { data: asset, error } = await client.from('question_assets').select('storage_path').eq('id', assetId).single();
  if (error) throw error;
  const { data, error: signedError } = await client.storage.from('question-assets').createSignedUrl(asset.storage_path, 3600);
  if (signedError) throw signedError;
  return data.signedUrl;
}
