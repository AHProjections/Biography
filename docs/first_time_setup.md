# First-Time Setup Guide (No Experience Needed)

This guide walks you through every step to get the app working.

## 1) Install required software

### A. Install Node.js
1. Go to: https://nodejs.org
2. Download the **LTS** version.
3. Install it using default options.
4. Open a terminal and verify:
   ```bash
   node -v
   npm -v
   ```

You should see version numbers (for example `v20.x.x`).

---

## 2) Open the project on your computer

1. Open a terminal.
2. Go to the project folder:
   ```bash
   cd /workspace/Biography
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

---

## 3) Set up Supabase project settings

### A. Get project URL and anon key
1. Log into Supabase.
2. Open your project.
3. In the left menu, click **Project Settings** -> **API**.
4. Copy:
   - **Project URL**
   - **anon public key**

### B. Put keys into `.env.local`
1. In terminal, run:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and paste your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```

---

## 4) Run database SQL (important)

Do this exactly:

1. In this repo, open file: `supabase/migrations/0000_run_all.sql`
2. Copy **all** SQL text from that file.
3. In Supabase, click **SQL Editor**.
4. Click **New query**.
5. Paste the SQL text.
6. Click **Run**.

If successful, you should see no blocking errors and the query completes.

> Common mistake: pasting `supabase/migrations/0000_run_all.sql` into SQL editor.
> That is a file path, not SQL code.

---

## 5) Enable magic-link auth settings in Supabase

1. In Supabase, go to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to:
   - `http://localhost:3000`
3. Add this to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
4. Save changes.

---

## 6) Start the app locally

In terminal, from project folder:

```bash
npm run dev
```

Then open browser at:
- `http://localhost:3000`

---

## 7) Test the login flow

1. Click **Sign in with magic link**.
2. Enter your email.
3. Open your email inbox and click the magic link.
4. You should land in `/dashboard`.

---

## 8) Test notes autosave + timeline

1. On dashboard, choose a life stage.
2. Add note text.
3. Set optional category and event year.
4. Wait ~5 seconds.
5. Confirm status says **Saved ...**.
6. Confirm timeline preview updates.

---

## 9) If something goes wrong

### `npm install` fails
- Retry on your local machine (this hosted environment can block npm packages).
- Confirm internet and no corporate registry restrictions.

### Magic link sends but login fails
- Re-check Supabase **Site URL** and **Redirect URLs** exactly.
- Ensure callback URL includes `/auth/callback`.

### Notes fail to save
- Re-run `0000_run_all.sql` in Supabase SQL Editor.
- Confirm you are logged in (dashboard should show your email).

