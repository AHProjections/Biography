# Vercel Deploy Troubleshooting

## `next.config.ts` build error
This app must deploy with `next.config.mjs`. If Vercel reports:

```text
Configuring Next.js via 'next.config.ts' is not supported.
```

redeploy the newest `main` commit with the build cache disabled. The build also
runs a prebuild guard so this file cannot accidentally return unnoticed.

## Supabase environment variables
In Vercel project settings, confirm these are set for Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

After changing environment variables, trigger a fresh deployment.
