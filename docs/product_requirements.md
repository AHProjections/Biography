# Biography App — Product Requirements (Phase 0 to MVP)

## 1) Product goal
Build a voice-first web application that helps people (especially older adults) create a personal biography, starting from a lightweight life outline and progressively expanding to richer detail.

## 2) Core user outcomes
- A user can create an account and securely save private biography data.
- A user can choose a detail target (Brief, Standard, Detailed) and change it later.
- A user can complete a guided interview that starts with major life milestones.
- A user can review/edit interview notes before draft generation.
- A user can generate an AI-written biography draft, edit it, and regenerate sections.

## 3) User personas (MVP)
- Primary: older adult with low technical comfort, prefers voice.
- Secondary: any adult user, may prefer typing.
- Optional collaborator (post-MVP): trusted family member/editor.

## 4) Scope
### In scope for MVP
- Account creation, magic-link login/logout, expired-link recovery.
- Secure personal workspace.
- Profile setup and detail goal selection.
- Guided interview flow:
  - Life stages/milestones first.
  - Follow-up prompts based on missing detail.
- Voice input (speech-to-text) with manual edit.
- Text input fallback everywhere.
- Structured notes/timeline view.
- Draft generation from notes.
- Draft editor with save history.
- Export to PDF/Docx (basic formatting acceptable in MVP).

### Out of scope for MVP
- Native mobile apps.
- Multi-language support beyond one launch language.
- Real-time multi-user collaboration.
- Photo scanning/OCR imports.

## 5) Functional requirements
1. Authentication
   - Email magic-link auth (Supabase).
   - Session timeout and secure cookie handling.
2. Detail depth controls
   - User selects Brief/Standard/Detailed at onboarding.
   - User can change this setting anytime from profile.
3. Interview engine
   - Stage 1: collect major life events (birthplace, family, education, work, relationships, major turning points).
   - Stage 2+: ask progressively deeper prompts for each event.
   - Allow skip, pause, resume.
4. Note organization
   - Store answers as structured notes linked to life-stage categories.
   - Show “source notes” behind each generated section.
5. Draft generation
   - Generate full draft from approved notes.
   - Regenerate selected sections only.
   - Support at least two narrative tones: neutral biographical and first-person memoir.
6. Editing workflow
   - In-browser rich text editing.
   - Version history for draft saves.
7. Accessibility
   - Large text mode, high contrast mode, keyboard navigation, clear progress indicators.
8. Security/privacy
   - Encryption in transit and at rest.
   - User-only private data by default.

## 6) Non-functional requirements
- Reliability: autosave interview responses every 5–10 seconds.
- Performance: first page load < 3s on average broadband.
- Availability target: 99.5% for MVP.
- Observability: error logging, API latency tracking, funnel analytics.

## 7) Suggested technical architecture (starting point)
- Frontend: Next.js web app.
- Backend: Next.js API routes or separate Node service.
- Database: PostgreSQL.
- Auth: managed provider (e.g., Auth0/Supabase/Auth.js).
- Storage: encrypted DB records + object storage for exports.
- AI orchestration:
  - Prompt layer grounded strictly on user notes.
  - Section-by-section generation pipeline.
- Speech:
  - Start with browser speech-to-text (MVP/low cost), abstract provider to swap later.

## 8) Success metrics (MVP)
- 60%+ of new users complete “bones of life” interview.
- 40%+ generate at least one draft.
- Median user rating ≥ 4/5 for “biography reflects me.”
- < 2% severe generation errors requiring full restart.

## 9) Risks and mitigations
- Transcription errors -> mandatory transcript review step.
- User fatigue -> short sessions, progress saves, “continue later.”
- AI hallucination -> generation only from approved notes + source trace.
- Sensitive content -> skip controls and topic boundaries.

## 10) Implementation sequence
1. Build Supabase magic-link auth + profile + detail goal.
2. Build interview + notes model + autosave.
3. Add draft generation + editor + versioning with $25/month guardrails.
4. Add accessibility pass and export.
5. Pilot test with 5–10 users and iterate.
