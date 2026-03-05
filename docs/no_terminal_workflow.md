# No-Terminal Workflow (GitHub + Vercel + Supabase)

Yes — you can do this almost entirely without terminal.

This workflow lets you:
- edit code in GitHub web UI,
- auto-deploy to Vercel,
- test changes at a live URL.

## What you need once
1. A GitHub repo with this project.
2. A Vercel account connected to that repo.
3. A Supabase project.

---

## One-time setup (browser only)

### 1) Import repo into Vercel
1. Go to https://vercel.com
2. Click **Add New...** -> **Project**
3. Select your GitHub repo.
4. Vercel should detect **Next.js** automatically.

### 2) Add environment variables in Vercel
In Vercel project:
1. Open **Settings** -> **Environment Variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
3. Save.

### 3) Run Supabase SQL once
1. Open file `supabase/migrations/0000_run_all.sql` in GitHub.
2. Copy all SQL text.
3. In Supabase, open **SQL Editor** -> **New query**.
4. Paste SQL and click **Run**.

### 4) Set auth URLs in Supabase
In Supabase -> **Authentication** -> **URL Configuration**:
- **Site URL** = your Vercel production URL
- **Redirect URL** = `https://YOUR-VERCEL-DOMAIN/auth/callback`

Save.

---

## Daily workflow (no terminal)

### Option A (safest): GitHub branch + PR
1. In GitHub repo, press `.` (dot) to open web editor.
2. Create a new branch, e.g. `feature/update-copy`.
3. Edit files.
4. Commit changes in the left Source Control panel.
5. Open a Pull Request in GitHub.
6. Merge PR.
7. Vercel auto-deploys merged code.

### Option B (faster): direct edit on main
1. Open a file in GitHub.
2. Click pencil icon (**Edit this file**).
3. Make change.
4. Click **Commit changes...**.
5. Commit directly to `main`.
6. Vercel auto-deploys.

---

## How to test each update
1. Open Vercel -> project -> **Deployments**.
2. Wait for latest deployment status = **Ready**.
3. Click deployment URL.
4. Test login and dashboard.

Tip: every PR can also get a preview URL before merge.

---

## If you want this even easier
- Keep all text/content changes in markdown/json files so you can edit directly in GitHub UI.
- Use PR previews in Vercel so you can review before going live.
- Use branch protection in GitHub so main only changes through PR.

