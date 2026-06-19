import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Biography App Starter</h1>
      <p>A voice-first interview studio for gathering life stories and shaping a draft.</p>
      <p>
        <Link href="/dashboard">Begin interview</Link>
      </p>
    </main>
  );
}
