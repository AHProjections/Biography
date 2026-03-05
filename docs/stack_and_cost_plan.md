# Supabase + Vercel Plan (Cheap and Easy to Run)

## Confirmed MVP decisions
- **Hosting/platform**: Next.js on Vercel + Supabase for Auth/Postgres/Storage.
- **Auth mode**: email magic link for simplest onboarding.
- **Collaboration**: off for MVP (single-user only).
- **Language**: English-only for v1.
- **Default narrative style**: third-person biography (memoir style remains optional later).
- **AI budget target**: optimize to stay around **$25/month**.

## Recommended MVP stack
- **Frontend + API**: Next.js on Vercel (hobby tier to start).
- **Auth + Database + Storage**: Supabase (managed Postgres + Auth + Storage + Row Level Security).
- **Voice input (v1)**: browser-native speech recognition first (no direct vendor cost).
- **AI writing (v1)**: one low-cost model, strict token budgets, and user-triggered generation only.

This keeps infrastructure minimal while still supporting private accounts, autosave, draft generation, and exports.

## Cost-first architecture choices
1. Use Supabase Auth instead of building custom auth.
2. Keep all biography data in Postgres JSON/text tables first; defer vector search until needed.
3. Generate drafts only when user clicks "Generate" (no automatic background generation).
4. Add hard limits for MVP:
   - max interview turns per session,
   - max generation length by selected detail level,
   - monthly generation cap per user.
5. Store exports in Supabase Storage with short-lived signed URLs.

## Suggested MVP hosting footprint
- **Vercel**: one project (web + server actions/API routes).
- **Supabase**: one project with:
  - Auth,
  - Postgres schema,
  - Storage bucket for exports,
  - RLS policies enabled on biography tables.

## Immediate implementation order
1. Create Next.js app and connect to Vercel project.
2. Connect Supabase project and configure env vars.
3. Implement magic-link auth + protected routes.
4. Implement interview notes tables + autosave.
5. Implement draft generation endpoint with budget guardrails for the $25/month target.
6. Implement export + signed URL download.
