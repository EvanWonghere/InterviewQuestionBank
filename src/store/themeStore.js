import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const THEME_STORAGE_KEY = 'iqb:theme';

/** @typedef {'auto' | 'light' | 'dark'} ThemeMode */

/**
 * Apply theme to <html> by setting / removing the data-theme attribute.
 * - 'auto': remove attribute → CSS falls back to prefers-color-scheme
 * - 'light' / 'dark': set attribute → CSS forces that theme
 * @param {ThemeMode} mode
 */
export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') {
    root.setAttribute('data-theme', mode);
  } else {
    root.removeAttribute('data-theme');
  }
}

export const useThemeStore = create(
  persist(
    (set) => ({
      /** @type {ThemeMode} */
      mode: 'auto',
      /** @param {ThemeMode} mode */
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode);
      },
    }
  )
);
