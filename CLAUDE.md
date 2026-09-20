# CLAUDE.md

This repository contains the Interview Question Bank deployed at the Hugo blog's `/quiz/` subpath. It is a React 19 + Vite + Tailwind SPA with a Supabase-backed administrator workflow and a read-only static fallback.

## Commands

```bash
npm run dev                # Vite development server
npm run build              # Production build in dist/
npm run lint               # ESLint
npm test                   # Vitest + React Testing Library
npm run test:e2e           # Playwright against a /quiz/ production preview
npm run preview:quiz       # Build and serve the real subpath on port 4173
npm run migrate:questions  # Idempotently seed categories and legacy questions
```

## Architecture

- `HashRouter` is intentional because the build is copied into Hugo `static/quiz`.
- `AuthContext` owns GitHub OAuth state and the `app_admins` lookup.
- `QuestionsContext` reads published questions from Supabase when configured and otherwise loads `public/questions.json`.
- `questionRepository.js` is the question boundary. Public list results never contain solution data; objective grading goes through the `grade_question` RPC.
- `progressRepository.js` and `reviewStore.js` persist attempts, notes and SM-2 state. Anonymous practice remains local; administrator records sync to Supabase.
- `questionSchema.js` contains the runtime-validated discriminated question model. Keep all six types valid: `single_choice`, `multiple_choice`, `fill_blank`, `short_answer`, `algorithm`, and `engineering`.
- Markdown images use `asset://<question_assets UUID>` references. `QuestionAsset` resolves them to short-lived signed Storage URLs.
- SQL migrations and RLS policies live under `supabase/migrations/`; never expose a service-role key to Vite or the browser.

## Data and security

Supabase is the source of truth after migration. The bundled 178-question JSON file is both the import source and offline/public fallback. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are browser variables. `SUPABASE_SERVICE_ROLE_KEY` is accepted only by the local migration script.

New questions default to `draft` and `private`. Publishing must pass `questionSchema` validation. Correct answers are stored in `question_solutions`, protected by RLS, and must not be joined into public list queries.

The old GitHub Gist reader remains only for the one-time migration wizard. Do not reintroduce Gist writes or token-based synchronization.

## Deployment

Pushes to `main` run lint, unit tests and the Vite build, then copy `dist/` to the blog repository's `static/quiz/`. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_CONCEPT_LAB_URL`, `BLOG_REPO`, and `API_TOKEN_GITHUB` as GitHub Actions secrets/variables. GitHub OAuth must redirect to the public `/quiz/` URL; the callback code restores the HashRouter destination. ConceptLab login uses the same project and needs `https://yufenghuang.tech/labs/` on the Auth redirect allow list.
