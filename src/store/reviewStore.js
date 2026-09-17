import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nextSm2State } from '@/lib/sm2';
import { loadCloudLearningData, saveCloudAttempt } from '@/data/progressRepository';

export const useReviewStore = create(
  persist(
    (set, get) => ({
      reviewStates: {},
      attempts: [],
      hydratedUserId: null,
      setReviewStates: (reviewStates) => set({ reviewStates }),
      hydrateCloud: async (userId) => {
        const data = await loadCloudLearningData(userId);
        set({ reviewStates: data.reviewStates, attempts: data.attempts, hydratedUserId: userId });
        return data;
      },
      recordAttempt: async ({ userId, questionId, submission, correct, quality, errorReasons, customErrorReason, assistanceUsed = null }) => {
        const previous = get().reviewStates[questionId] ?? {};
        const next = userId
          ? await saveCloudAttempt({ userId, questionId, submission, correct, quality, errorReasons, customErrorReason, assistanceUsed }, previous)
          : nextSm2State(previous, quality);
        const attempt = {
          id: crypto.randomUUID(),
          question_id: questionId,
          submission,
          is_correct: correct,
          assistance_used: assistanceUsed,
          quality,
          error_reasons: errorReasons ?? [],
          custom_error_reason: customErrorReason ?? '',
          answered_at: new Date().toISOString(),
        };
        set((state) => ({
          reviewStates: { ...state.reviewStates, [questionId]: next },
          attempts: [attempt, ...state.attempts].slice(0, 500),
        }));
        return next;
      },
    }),
    {
      name: 'iqb:review-v2',
      partialize: ({ reviewStates, attempts }) => ({ reviewStates, attempts }),
    }
  )
);
