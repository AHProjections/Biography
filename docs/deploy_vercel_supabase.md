# Deploy to a Real Website (Vercel + Supabase)

This is the easiest way to get a live URL you can open in a browser.

## What you will get
- A public app URL like: `https://your-app-name.vercel.app`
- Magic-link login powered by Supabase
- Your notes data stored in your Supabase database

---

## Step 1) Put your code on GitHub

1. Create a new GitHub repository (if you do not already have one).
2. Push this project to that repository.

If you need commands:
```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin work
```

---

## Step 2) Create a Vercel project from GitHub

1. Go to: https://vercel.com
2. Sign in.
3. Click **Add New...** -> **Project**.
4. Import your GitHub repository.
5. Framework should auto-detect as **Next.js**.
6. Do not deploy yet until env vars are added (next step).

---

## Step 3) Add environment variables in Vercel

In Vercel project setup (or Settings -> Environment Variables), add:

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon public key

Then click **Deploy**.

---

## Step 4) Run database setup in Supabase

1. In this repo, open file: `supabase/migrations/0000_run_all.sql`
2. Copy all SQL from that file.
3. In Supabase, open **SQL Editor** -> **New query**.
4. Paste SQL -> click **Run**.

Important: paste SQL text, not file path text.

---

## Step 5) Connect Supabase auth URLs to your live website

After deploy, Vercel gives a URL like `https://your-app-name.vercel.app`.

In Supabase:
1. Go to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your Vercel URL.
   - Example: `https://your-app-name.vercel.app`
3. Add this Redirect URL:
   - `https://your-app-name.vercel.app/auth/callback`
4. Save.

---

## Step 6) Redeploy once after auth URL changes

In Vercel:
1. Go to your project.
2. Open **Deployments**.
3. Click **Redeploy** on latest deployment.

---

## Step 7) Open and test your live app

1. Visit your Vercel URL in browser.
2. Click **Sign in with magic link**.
3. Enter your email.
4. Click magic-link email.
5. Confirm you land on dashboard and notes autosave works.

---

## Common issues

### Magic link sends but login fails
- Usually redirect URL mismatch.
- Re-check Supabase URL Configuration exactly:
  - Site URL = your exact Vercel URL
  - Redirect URL = `https://your-app-name.vercel.app/auth/callback`

### App loads but save fails
- Usually SQL migration not run.
- Re-run `0000_run_all.sql` in Supabase SQL Editor.

### Updated code not visible
- Trigger a new Vercel deployment from latest commit.

