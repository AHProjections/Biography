import Link from 'next/link';

export default function AuthPage() {
  return (
    <main>
      <h1>No sign-in needed</h1>
      <p>This version saves biography notes in your browser.</p>
      <p>
        <Link href="/dashboard">Open workspace</Link>
      </p>
    </main>
  );
}
