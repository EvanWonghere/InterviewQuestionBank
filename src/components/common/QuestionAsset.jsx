import { useEffect, useState } from 'react';
import { getAssetUrl } from '@/data/assetRepository';

export default function QuestionAsset({ assetId, alt }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getAssetUrl(assetId).then((value) => active && setUrl(value)).catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [assetId]);
  if (error) return <span className="type-caption" style={{ color: 'var(--error-fg)' }}>图片不可用</span>;
  if (!url) return <span className="type-caption">图片加载中…</span>;
  return <img src={url} alt={alt ?? ''} loading="lazy" className="my-4 max-h-[32rem] rounded-xl object-contain" />;
}
