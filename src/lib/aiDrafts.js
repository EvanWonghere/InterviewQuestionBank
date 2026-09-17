import { useState } from 'react';

const prefix = 'iqb:ai-draft:';
export function clearAIDrafts() {
  try {
    Object.keys(sessionStorage).filter(key => key.startsWith(prefix)).forEach(key => sessionStorage.removeItem(key));
  } catch { /* Private browsing may disable storage. */ }
}

// Tab-local, scoped to the signed-in owner and question. No key or model secrets.
export function useAIDraft(key) {
  const storageKey = prefix + key;
  const [draft, setDraft] = useState(() => {
    try { return sessionStorage.getItem(storageKey) ?? ''; } catch { return ''; }
  });
  const save = value => {
    setDraft(value);
    try {
      if (value) sessionStorage.setItem(storageKey, value);
      else sessionStorage.removeItem(storageKey);
    } catch { /* Keep the in-memory draft if storage is full. */ }
  };
  return [draft, save];
}
