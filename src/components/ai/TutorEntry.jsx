import { lazy, Suspense, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
const TutorPanel = lazy(() => import('./TutorPanel'));
// No dynamic import or history request before both admin check and explicit open.
export default function TutorEntry(props) {
  const { user, isAdmin, loading } = useAuth();
  if (!props.enabled || loading || !user || !isAdmin) return null;
  return <AuthorizedEntry key={`${user.id}:${props.question.id}`} {...props} user={user} />;
}
function AuthorizedEntry(props) {
  const [open, setOpen] = useState(false);
  return <div className="mt-5">
    <button type="button" className="btn-blue-outline" onClick={() => setOpen(true)}>问学习助手</button>
    {open && <Suspense fallback={<p role="status">正在加载学习助手…</p>}>
      <TutorPanel {...props} onClose={() => setOpen(false)} />
    </Suspense>}
  </div>;
}
