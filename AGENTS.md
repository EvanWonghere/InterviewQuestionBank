# AGENTS.md

This repository contains the Interview Question Bank deployed at the Hugo blog's `/quiz/` subpath. It is a React 19 + Vite + Tailwind SPA with a Supabase-backed administrator workflow and a read-only static fallback.

This file is the shared instruction set for coding agents (Claude Code, Codex and others). `CLAUDE.md` imports it and only adds Claude-specific notes.

## Commands

```bash
npm run dev                # Vite development server
npm run build              # Production build in dist/
npm run lint               # ESLint
npm test                   # Vitest + React Testing Library
npm run test:e2e           # Playwright against a /quiz/ production preview
npm run preview:quiz       # Build and serve the real subpath on port 4173
npm run migrate:questions  # Idempotently seed categories and legacy questions
npm run test:ai-db         # AI tutor database checks (PGlite)
npm run test:ai-edge       # ai-tutor Edge Function handler tests (Deno)
npm run test:ai-e2e        # AI tutor browser tests against synthetic Supabase
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
- The administrator AI tutor is the `supabase/functions/ai-tutor` Edge Function. Model keys exist only as Edge Function secrets. See `docs/AI_TUTOR.md`.
- The blog's music practice room (`/study/music/`) uses the same function through `music-*` actions handled by `music.ts` (chat, history, clear), `musicArrange.ts` (`music-arrange` proposals) and `musicStrudel.ts` (`music-strudel` snippets), with its own `music_messages` table. It explains, assigns homework, comments on scores, proposes arrangement edits and writes Strudel code that the page runs only in a sandboxed iframe; it never grades or marks mastery. The same page also keeps the administrator's saved works and arrangements in the `music_works` table, read and written directly under owner/admin RLS with server-assigned revisions (no function involved). See `docs/AI_TUTOR.md`.
- AI members (`ai_members`, `ai_member_usage`, migration `20260928000000_ai_members.sql`) let a non-administrator use named AI features. Only the `music` scope exists: members may call `music-*` actions and nothing else, within a daily request limit counted in `ai_take_rate` (Beijing calendar day), with the cheapest routing capped at Luna (`maxSlot`). `ai_access()` tells pages and the function what the caller may use. Membership never grants question, answer, asset or `music_works` access. Adding a scope means widening the table check and the matching RPCs, the function's `MEMBER_SCOPE` and the page.
- The stage game (`#/map`, `#/stage/:category/:index`, `#/patrol` for due reviews) is a layer over practice data that never changes grading or SM-2 state. `gameRules.js` derives stages, stars, combo, XP, levels, the daily streak with freeze cards, achievements and the pet's growth form from questions, `reviewStates` and `attempts`; `gameStore.js` keeps only what cannot be derived (stage and patrol run records, best-star high-water marks, combo bonus XP, announced achievements, quiet mode) in local storage. Pet growth forms live in `petGrowth.js`, not in `pixelPetSprites.js`, which ConceptLab copies. Administrators sync that store through `game_progress` (migration `20260929000000_game_progress.sql`), written only by the order-independent `game_progress_merge` RPC from `useGameSync`. The chapter boss (`#/boss/:category`), hint cards, follow-up revive and the weak-point dungeon (`#/dungeon`) reuse the existing evaluate / interview-report / tutor actions; they add no Edge Function actions. It must not change grading, SM-2 scheduling or any cloud table besides `game_progress`. The third star needs a passing streak across two calendar days, and XP counts each question's best stars rather than attempts, because attempts keep only the latest 500. `AnswerPanel`'s `onRated(status, { quality, correct, assisted, aiScore })` feeds it, and its optional `onEvaluated`, `onAssistance` and `hintEnabled` props drive the boss, revive and hint cards. See `docs/GAMIFICATION.md`.
- `DESIGN.md` is the visual design reference for UI work.

## Data and security

Supabase is the source of truth after migration. The bundled 178-question JSON file is both the import source and offline/public fallback. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are browser variables. `SUPABASE_SERVICE_ROLE_KEY` is accepted only by the local migration script.

New questions default to `draft` and `private`. Publishing must pass `questionSchema` validation. Correct answers are stored in `question_solutions`, protected by RLS, and must not be joined into public list queries.

The old GitHub Gist reader remains only for the one-time migration wizard. Do not reintroduce Gist writes or token-based synchronization.

Production migrations, Edge Function deploys and Supabase Auth changes require explicit approval. Check `npx supabase migration list` and `npx supabase db push --dry-run` first and apply only the intended migration.

## ConceptLab (sibling repository)

ConceptLab (`EvanWonghere/ConceptLab`, served at `/labs/`) shares this repository's Supabase project and `ai-tutor` function. These files in this repository are generated by ConceptLab's `npm run sync:catalog` and must not be edited by hand:

- `supabase/functions/ai-tutor/labCatalog.json`
- `supabase/functions/ai-tutor/teachingCode.ts`
- `src/data/conceptLabLinks.generated.json`

Lab changes that touch these files belong in ConceptLab first; then regenerate them here. Lab writes must not change quiz attempts, grades or questions. The quiz links to labs through stable `legacyId` values and only when `VITE_CONCEPT_LAB_URL` is set.

## Music practice room (sibling repository)

`supabase/functions/ai-tutor/musicCatalog.json` and the files in `supabase/functions/ai-tutor/arrangement/` are generated by the blog repository (`EvanWonghere/EvanWonghere.github.io`) with `node tools/export-music-catalog.mjs <path to this repository>` and must not be edited by hand. The arrangement copies are the page's own document schema and operations, used by `musicArrange.ts` to validate and dry-run AI proposals. Regenerate them whenever lessons or the arrangement model change there; the blog commits the matching `static/music/catalog-versions.mjs`. Music writes must not change quiz or lab records.

## Deployment

Pushes to `main` run lint, unit tests and the Vite build, then copy `dist/` to the blog repository's `static/quiz/`. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_CONCEPT_LAB_URL`, `BLOG_REPO`, and `API_TOKEN_GITHUB` as GitHub Actions secrets/variables. GitHub OAuth must redirect to the public `/quiz/` URL; the callback code restores the HashRouter destination. ConceptLab login uses the same project and needs `https://yufenghuang.tech/labs/` on the Auth redirect allow list, and the music practice room needs `https://yufenghuang.tech/study/music/`.

## Cloud and non-macOS environments

- `playwright.config.js` uses Playwright's bundled Chromium unless `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` is set; run `npx playwright install chromium` first.
- `playwright.ai.config.js` uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, else the macOS Google Chrome when present, else the bundled Chromium, so `npm run test:ai-e2e` also runs after `npx playwright install chromium`. Say which browser the run used.
- `test:ai-edge` needs Deno. Supabase CLI actions need a linked project and credentials that cloud sessions do not have.
