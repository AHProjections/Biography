import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Biography App Starter</h1>
      <p>Start drafting a private biography outline. Notes are saved in this browser.</p>
      <p>
        <Link href="/dashboard">Open workspace</Link>
      </p>
    </main>
  );
}
