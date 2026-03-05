import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const LIFE_STAGES = new Set(['childhood', 'education', 'career', 'relationships', 'turning_points']);
const CATEGORIES = new Set(['milestone', 'challenge', 'achievement', 'reflection']);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    lifeStage?: string;
    noteText?: string;
    category?: string;
    eventYear?: number | null;
  };

  const lifeStage = (body.lifeStage ?? '').trim();
  const noteText = body.noteText ?? '';
  const category = (body.category ?? 'milestone').trim();
  const eventYear = body.eventYear ?? null;

  if (!LIFE_STAGES.has(lifeStage)) {
    return NextResponse.json({ error: 'Invalid lifeStage' }, { status: 400 });
  }

  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  if (eventYear !== null && (!Number.isInteger(eventYear) || eventYear < 1900 || eventYear > 2100)) {
    return NextResponse.json({ error: 'Invalid eventYear' }, { status: 400 });
  }

  const { error } = await supabase.from('interview_notes').upsert(
    {
      user_id: user.id,
      life_stage: lifeStage,
      note_text: noteText,
      category,
      event_year: eventYear,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,life_stage' },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
