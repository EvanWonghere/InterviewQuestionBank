import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { THEME_STORAGE_KEY, applyTheme } from '@/store/themeStore'

// Apply persisted theme synchronously before React mounts to avoid a flash.
try {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    const mode = parsed?.state?.mode;
    if (mode === 'light' || mode === 'dark') applyTheme(mode);
  }
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
