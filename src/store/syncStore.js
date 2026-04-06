import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSyncStore = create(
  persist(
    (set) => ({
      token: '',
      gistId: '',
      /** @type {'idle'|'syncing'|'synced'|'error'} */
      syncStatus: 'idle',
      syncError: '',
      setToken: (token) => set({ token }),
      setGistId: (gistId) => set({ gistId }),
      setSyncStatus: (syncStatus, syncError = '') => set({ syncStatus, syncError }),
    }),
    {
      name: 'quiz-sync-config',
      // only persist credentials, not ephemeral status
      partialize: (state) => ({ token: state.token, gistId: state.gistId }),
    }
  )
);
