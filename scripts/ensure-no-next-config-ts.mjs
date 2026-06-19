import { existsSync } from 'node:fs';

if (existsSync('next.config.ts')) {
  console.error(
    'Vercel cannot build this project with next.config.ts. Use next.config.mjs instead.',
  );
  process.exit(1);
}
