import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
      <h1>Biography App Starter</h1>
      <p>Phase 1 foundation is ready: Next.js + Supabase magic-link auth.</p>
      {user ? (
        <>
          <p>Signed in as: {user.email}</p>
          <p>
            <Link href="/dashboard">Go to dashboard</Link>
          </p>
          <p>
            <Link href="/logout">Sign out</Link>
          </p>
        </>
      ) : (
        <p>
          <Link href="/auth">Sign in with magic link</Link>
        </p>
      )}
    </main>
  );
}
