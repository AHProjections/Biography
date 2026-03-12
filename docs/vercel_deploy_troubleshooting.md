# Vercel Deploy Troubleshooting (Biography App)

If your Vercel deploy failed, use this quick checklist.

## Most likely fix already applied in this repo
This repo now uses `next.config.mjs` (instead of `next.config.ts`) for better compatibility with Next.js 14 builds on Vercel.

---

## 1) Trigger a clean redeploy
1. Open Vercel -> your project -> **Deployments**.
2. Open the failed deployment.
3. Click **Redeploy** -> choose **Use existing Build Cache: OFF** (clean rebuild).
4. Wait for status.

---

## 2) Verify environment variables in Vercel
Project -> **Settings** -> **Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then redeploy.

---

## 3) Verify Supabase Auth URL settings
In Supabase -> **Authentication** -> **URL Configuration**:
- Site URL = your Vercel production URL
- Redirect URL = `https://YOUR-VERCEL-DOMAIN/auth/callback`

---

## 4) Verify DB setup was run
In Supabase SQL Editor, run the SQL in:
- `supabase/migrations/0000_run_all.sql`

---

## 5) If build still fails
Open Vercel deploy logs and check which section failed:
- **Install Command** failed -> usually dependency/network issue
- **Build Command** failed -> usually config or TypeScript error
- **Runtime error after deploy** -> usually env var or Supabase URL mismatch

If you share the exact first error line from logs, we can fix it quickly.
