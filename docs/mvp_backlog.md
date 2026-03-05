# MVP Backlog (Execution-Ready)

## Epic 1 — Foundation
- [ ] Initialize Next.js web app on Vercel and basic CI checks.
- [ ] Configure environment and secrets management.
- [ ] Add Supabase Postgres schema, migrations, and Row Level Security (RLS).
- [ ] Add telemetry/logging baseline.

## Epic 2 — Accounts and privacy
- [ ] Supabase Auth: email magic-link sign in / sign out flows.
- [ ] Magic-link resend and expired-link recovery flow.
- [ ] Private user data scoping on all API endpoints.
- [ ] Privacy policy and consent copy on onboarding.

## Epic 3 — Onboarding and goal selection
- [ ] Onboarding screen explaining process.
- [ ] Detail goal selector (Brief, Standard, Detailed).
- [ ] Goal edit in settings.

## Epic 4 — Interview experience
- [ ] Interview session creation and resume.
- [ ] Stage-1 major life events form/voice prompts.
- [ ] Deeper follow-up prompts by category.
- [ ] Skip question / mark as sensitive controls.
- [ ] Autosave + progress indicator.

## Epic 5 — Voice and accessibility
- [ ] Speech-to-text input with transcript preview.
- [ ] Retry and correction tools for transcript errors.
- [ ] Text input fallback for every prompt.
- [ ] Accessibility toggles (font size, contrast).

## Epic 6 — Notes and timeline
- [ ] Notes data model with categories and tags.
- [ ] Timeline view grouped by life stage.
- [ ] Manual note edits before draft generation.

## Epic 7 — Draft generation and editing
- [ ] Add AI cost guardrails for $25/month target.
- [ ] Generate biography draft from approved notes.
- [ ] Section-level regeneration.
- [ ] Style selector (neutral bio / first-person memoir).
- [ ] Rich text editor with version history.

## Epic 8 — Export and QA
- [ ] Export biography to PDF and DOCX.
- [ ] Add end-to-end happy-path tests.
- [ ] Accessibility audit and fixes.
- [ ] Pilot feedback loop and bug triage.
