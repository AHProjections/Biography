-- Interview notes table for autosave MVP
create table if not exists public.interview_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  life_stage text not null,
  note_text text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, life_stage)
);

alter table public.interview_notes enable row level security;

create policy "Users can view their own notes"
on public.interview_notes
for select
using (auth.uid() = user_id);

create policy "Users can insert their own notes"
on public.interview_notes
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own notes"
on public.interview_notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
