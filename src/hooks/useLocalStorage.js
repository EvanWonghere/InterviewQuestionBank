import { useState, useCallback } from 'react';

/**
 * Persist state to localStorage. Generic hook for future use (e.g. theme, settings).
 * Progress is handled by Zustand persist; this is for other keys.
 * @param {string} key
 * @param {unknown} initialValue
 * @returns {[unknown, (value: unknown) => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item != null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      setStored(value);
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    },
    [key]
  );

  return [stored, setValue];
}
