import Link from 'next/link';
import NotesAutosave from '@/components/notes-autosave';

export default function DashboardPage() {
  return (
    <main>
      <h1>Your biography workspace</h1>
      <p>Notes are saved privately in this browser.</p>
      <ul>
        <li>No account setup required.</li>
        <li>Autosave runs on this device.</li>
        <li>Timeline preview and note categories are enabled.</li>
      </ul>

      <NotesAutosave />

      <p>
        <Link href="/">Back home</Link>
      </p>
    </main>
  );
}
