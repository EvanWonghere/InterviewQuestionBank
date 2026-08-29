import { useEffect, useState } from 'react';
import AdminGate from '@/components/auth/AdminGate';
import { useAuth } from '@/context/AuthContext';
import { collectLegacyData, downloadLegacyBackup, importLegacyData } from '@/data/migrationRepository';
import { useReviewStore } from '@/store/reviewStore';
import { useNotesStore } from '@/store/notesStore';

export default function MigrationPage() {
  return <AdminGate><Migration /></AdminGate>;
}

function Migration() {
  const { user } = useAuth();
  const hydrateCloud = useReviewStore((state) => state.hydrateCloud);
  const setNotesBulk = useNotesStore((state) => state.setNotesBulk);
  const [legacy, setLegacy] = useState({ progress: {}, notes: {} });
  const [status, setStatus] = useState('collecting');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    collectLegacyData().then((data) => { setLegacy(data); setStatus('ready'); }).catch((err) => { setError(err.message); setStatus('error'); });
  }, []);

  const run = async () => {
    setStatus('importing');
    setError('');
    try {
      downloadLegacyBackup(legacy);
      const next = await importLegacyData(user.id, legacy);
      const cloud = await hydrateCloud(user.id);
      setNotesBulk(cloud.notes);
      setResult(next);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('ready');
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <p className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>一次性迁移</p>
      <h1 className="type-display-sm mt-2">把旧进度与笔记迁入云端</h1>
      <p className="type-body mt-3" style={{ color: 'var(--text-tertiary)' }}>迁移前会自动下载 JSON 备份；操作可重复执行，不会创建重复记录。成功后只移除浏览器里的 Gist Token，旧本地记录仍保留。</p>
      <div className="surface-card-elevated mt-7 p-7">
        <div className="grid grid-cols-2 gap-5"><Metric label="旧状态" value={Object.keys(legacy.progress).length} /><Metric label="旧笔记" value={Object.keys(legacy.notes).length} /></div>
        {error && <p className="type-caption mt-5" style={{ color: 'var(--error-fg)' }}>{error}</p>}
        {result ? <p className="type-body mt-6" style={{ color: 'var(--success-fg)' }}>迁移完成：{result.states} 条复习状态、{result.notes} 条笔记，{result.unmatched} 条未匹配。</p> : <button type="button" className="btn-blue mt-6" disabled={status !== 'ready'} onClick={run}>{status === 'collecting' ? '正在读取…' : status === 'importing' ? '正在迁移…' : '备份并开始迁移'}</button>}
      </div>
    </section>
  );
}

function Metric({ label, value }) { return <div><p className="type-display-md">{value}</p><p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>{label}</p></div>; }
