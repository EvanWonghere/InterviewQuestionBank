# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build (outputs to dist/)
npm run lint         # ESLint
npm run preview      # Preview production build
npm run preview:quiz # Build and serve at /quiz/ path (port 5000) — use this to test sub-directory deployment
```

There are no automated tests.

## Architecture

This is a static React SPA — a Unity/C# interview question bank and quiz platform. It has no backend; all data comes from `public/questions.json` (fetched at runtime).

**Routing**: `HashRouter` is used intentionally so the app works on static hosting. Routes:
- `/` — Dashboard (progress overview)
- `/quiz`, `/quiz/:categoryId` — Quiz interface filtered by category
- `/list/:status` — Smart lists (`wrong`, `review`, `mastered`)
- `/mock-interview` — Timed mock interview mode

**Data flow**:
1. `QuestionsContext` fetches `questions.json` via `fetch(import.meta.env.BASE_URL + 'questions.json')` on mount and provides `{ categories, questions, loading, error }` to all pages.
2. `progressStore.js` (Zustand + `persist` middleware) tracks per-question status (`mastered` | `review` | `wrong`) in localStorage under the key defined in `src/constants/storageKeys.js`.
3. Custom hooks in `src/hooks/useProgress.js` expose progress utilities (`useCategoryStats`, `useProgress`).

**Questions data schema** (`public/questions.json`):
```json
{
  "version": "1.0",
  "categories": [{ "id": "", "name": "", "order": 0 }],
  "questions": [{
    "id": "", "categoryId": "", "title": "", "question": "", "answer": "",
    "tags": [], "difficulty": "easy|medium|hard", "order": 0
  }]
}
```

**Key source files**:
- `src/App.jsx` — Route tree and `QuestionsProvider` wrapper
- `src/pages/QuizPage.jsx` — Main quiz with filtering, search, keyboard shortcuts
- `src/components/layout/Sidebar.jsx` — Category nav, search input, smart lists
- `src/components/quiz/QuestionCard.jsx` — Question/answer toggle with markdown rendering

## Deployment

The app is deployed as a sub-application under a Hugo blog at the `/quiz/` path. `vite.config.js` sets `base: '/quiz/'`. On push to `main`, GitHub Actions builds and pushes `dist/` to `static/quiz/` in the Hugo blog repository (`EvanWonghere/EvanWonghere.github.io`) using the `API_TOKEN_GITHUB` secret.

When adding new questions, edit `public/questions.json` directly — no build step is needed for data changes, but `npm run build` must be run before deploy picks them up via CI.
