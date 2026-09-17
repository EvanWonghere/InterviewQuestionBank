import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
const EvaluationPanel = lazy(() => import('./EvaluationPanel'));

// Same gate as TutorEntry: nothing loads before the admin check. Non-admins fall back immediately.
export default function EvaluationEntry(props) {
  const { user, isAdmin, loading } = useAuth();
  const unavailable = !loading && (!user || !isAdmin);
  const { onUnavailable } = props;
  useEffect(() => { if (unavailable) onUnavailable?.(); }, [unavailable, onUnavailable]);
  if (loading || unavailable) return null;
  return <AuthorizedEntry key={`${user.id}:${props.question.id}`} {...props} />;
}

function AuthorizedEntry(props) {
  const [open, setOpen] = useState(props.mode === 'interview');
  if (!open) {
    return <button type="button" className="btn-blue-outline" onClick={() => setOpen(true)}>AI 评估我的回答</button>;
  }
  return (
    <Suspense fallback={<p role="status" className="type-caption">正在加载AI评估…</p>}>
      <EvaluationPanel {...props} />
    </Suspense>
  );
}
