import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useReviewStore } from '@/store/reviewStore';
import { useNotesStore } from '@/store/notesStore';
import { useProgressStore } from '@/store/progressStore';

export function useCloudLearning() {
  const { user, isAdmin } = useAuth();
  const hydrateCloud = useReviewStore((state) => state.hydrateCloud);
  const hydratedUserId = useReviewStore((state) => state.hydratedUserId);
  const setNotesBulk = useNotesStore((state) => state.setNotesBulk);
  const setProgressBulk = useProgressStore((state) => state.setProgressBulk);

  useEffect(() => {
    if (!user || !isAdmin || hydratedUserId === user.id) return;
    hydrateCloud(user.id).then((data) => {
      setNotesBulk(data.notes);
      setProgressBulk(Object.fromEntries(Object.entries(data.reviewStates).map(([questionId, state]) => [
        questionId,
        state.lastQuality < 3 ? 'wrong' : state.intervalDays >= 30 && state.lastQuality >= 4 ? 'mastered' : 'review',
      ])));
    }).catch(() => {});
  }, [user, isAdmin, hydratedUserId, hydrateCloud, setNotesBulk, setProgressBulk]);
}
