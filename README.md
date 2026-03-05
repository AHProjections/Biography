# Biography App (Implementation Starter)

This is the first implementation step for the biography app using the confirmed stack:
- Next.js on Vercel
- Supabase Auth/Postgres/Storage
- Magic-link login
- English-only MVP
- Cost-first architecture

## New: Beginner-friendly setup walkthrough
If you want a click-by-click guide, start here:
- `docs/first_time_setup.md`

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env.local
   ```
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.
4. In Supabase Auth settings, set the site URL to your app URL and allow redirect URL:
   - `http://localhost:3000/auth/callback`
5. Run:
   ```bash
   npm run dev
   ```

## Current implemented scope
- Magic-link sign-in page
- Auth callback route
- Protected dashboard route
- Sign-out route
- Supabase browser/server/middleware client wiring
- Interview notes schema + RLS migration
- Dashboard notes editor with autosave every 5 seconds
- `/api/notes` authenticated autosave endpoint
- Timeline preview sorted by event year
- Note categories + year metadata

## Database setup (new)
**Important:** In Supabase SQL Editor, paste the SQL *contents* and run them.
Do **not** paste a file path like `supabase/migrations/0001_interview_notes.sql` into the query box.

Option A (easiest): run one bootstrap script:
- `supabase/migrations/0000_run_all.sql`

Option B: run files one-by-one in order:
- `supabase/migrations/0001_interview_notes.sql`
- `supabase/migrations/0002_note_metadata.sql`

## Next step
Build interview prompt flow and structured question sets.


## What you need to do on your end
1. Open `supabase/migrations/0000_run_all.sql`, copy all SQL text, and paste it into Supabase SQL Editor, then click **Run**.
2. Ensure your Supabase project has magic-link auth enabled and callback URL set to `http://localhost:3000/auth/callback`.
3. Put your Supabase URL and anon key into `.env.local`.
