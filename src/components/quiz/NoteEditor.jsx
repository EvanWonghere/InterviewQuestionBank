import { useNotesStore } from '@/store/notesStore';

/**
 * Personal note editor for a single question.
 * Plain-text textarea; writes are persisted instantly via Zustand persist
 * and pushed to the Gist by the global useGistSync debouncer.
 *
 * @param {{ questionId: string }} props
 */
export default function NoteEditor({ questionId }) {
  const note = useNotesStore((s) => s.notes[questionId] ?? '');
  const setNote = useNotesStore((s) => s.setNote);

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
