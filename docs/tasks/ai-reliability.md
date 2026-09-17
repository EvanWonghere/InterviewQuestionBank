# AI reliability

Goal: preserve chat and evaluation state across focus/token events and make model failures actionable.
Scope: auth revalidation, per-user drafts, request recovery, model errors, deterministic history ordering. Preserve existing evaluation/interview/insight features.
Acceptance: same-user auth events do not unmount child state; logout/account switch/revocation do; drafts survive reopen; retries retain unsettled request IDs; distinguish timeout/auth/rate/config errors; regression tests and production build pass.
Failure next action: retain drafts and previous messages, report precise failure; never silently repeat billable generation or mark learning complete. Deploy only after checks.

Validation (2026-09-17, this repository): lint, Vitest tests, production build, Deno type check and 6 authentication-boundary tests passed. All 8 synthetic Playwright flows passed, including real SDK same-user auth notifications and draft recovery. An existing heatmap assertion initially raced the cloud request; it now waits for that request before inspecting its timezone. These checks do not prove live provider availability or operating-system tab suspension recovery.
