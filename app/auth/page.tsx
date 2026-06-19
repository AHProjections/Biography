'use client';

import { FormEvent, useState } from 'react';
import { createClient, getSupabaseBrowserConfigError } from '@/lib/supabase/browser';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    const configError = getSupabaseBrowserConfigError();
    if (configError) {
      setMessage(configError);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setMessage(
        error ? `Unable to send magic link: ${error.message}` : 'Magic link sent. Check your inbox.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Unable to send magic link: ${error.message}`
          : 'Unable to send magic link. Check the Supabase settings in Vercel and Supabase Auth URL Configuration.',
      );
    }
  };

  return (
    <main>
      <h1>Sign in</h1>
      <p>Use your email and we&apos;ll send a magic link.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <br />
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <br />
        <button type="submit">Send magic link</button>
      </form>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
