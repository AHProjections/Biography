import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NotesAutosave from '@/components/notes-autosave';

type NoteRow = {
  life_stage: string;
  note_text: string;
  category: string | null;
  event_year: number | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data } = await supabase
    .from('interview_notes')
    .select('life_stage,note_text,category,event_year')
    .eq('user_id', user.id);

  return (
    <main>
      <h1>Your private workspace</h1>
      <p>Welcome, {user.email}</p>
      <ul>
        <li>✅ Auth is configured with Supabase magic links.</li>
        <li>✅ Protected dashboard route is enabled.</li>
        <li>✅ Interview notes autosave is enabled.</li>
        <li>✅ Timeline preview + note categories are enabled.</li>
      </ul>

      <NotesAutosave initialNotes={(data ?? []) as NoteRow[]} />

      <p>
        <Link href="/">Back home</Link>
      </p>
      <p>
        <Link href="/logout">Sign out</Link>
      </p>
    </main>
  );
}
