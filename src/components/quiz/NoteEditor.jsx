import { useEffect, useRef, useState } from 'react';
import { useNotesStore } from '@/store/notesStore';
import { useAuth } from '@/context/AuthContext';
import { saveCloudNote } from '@/data/progressRepository';

/**
 * Personal note editor for a single question.
 * Plain-text textarea; writes are persisted instantly via Zustand and, for
 * the administrator, debounced to Supabase for cross-device synchronization.
 *
 * @param {{ questionId: string }} props
 */
export default function NoteEditor({ questionId }) {
  const note = useNotesStore((s) => s.notes[questionId] ?? '');
  const setNote = useNotesStore((s) => s.setNote);
  const { user, isAdmin } = useAuth();
  const [syncState, setSyncState] = useState('idle');
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return undefined;
    }
    if (!user || !isAdmin) return undefined;
    setSyncState('saving');
    const timer = setTimeout(() => {
      saveCloudNote(user.id, questionId, note).then(() => setSyncState('saved')).catch(() => setSyncState('error'));
    }, 800);
    return () => clearTimeout(timer);
  }, [note, questionId, user, isAdmin]);

  if (!questionId) return null;

  return (
    <div
      className="mt-5 rounded-2xl p-6"
      style={{
        background: 'var(--filter-bg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <p
        className="type-eyebrow mb-3"
        style={{ color: 'var(--apple-blue)' }}
      >
        我的笔记
      </p>
      {user && <p className="type-micro mb-2" style={{ color: syncState === 'error' ? 'var(--error-fg)' : 'var(--text-quaternary)' }}>{syncState === 'saving' ? '正在保存到云端…' : syncState === 'saved' ? '已保存到云端' : syncState === 'error' ? '云端保存失败，本地副本仍在' : '跨设备同步'}</p>}
      <textarea
        value={note}
        onChange={(e) => setNote(questionId, e.target.value)}
        placeholder="记录你的理解、补充或反例…"
        rows={4}
        className="w-full resize-y rounded-xl px-4 py-3 type-body focus:outline-none"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}
