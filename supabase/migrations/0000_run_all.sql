-- Biography app bootstrap migration (safe to run once on a fresh project)
-- If you already ran prior migrations, skip this file.

-- 0001_interview_notes.sql
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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'interview_notes' and policyname = 'Users can view their own notes'
  ) then
    create policy "Users can view their own notes"
    on public.interview_notes
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'interview_notes' and policyname = 'Users can insert their own notes'
  ) then
    create policy "Users can insert their own notes"
    on public.interview_notes
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'interview_notes' and policyname = 'Users can update their own notes'
  ) then
    create policy "Users can update their own notes"
    on public.interview_notes
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

-- 0002_note_metadata.sql
alter table public.interview_notes
  add column if not exists category text not null default 'milestone',
  add column if not exists event_year integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'interview_notes_event_year_check'
  ) then
    alter table public.interview_notes
      add constraint interview_notes_event_year_check
      check (event_year is null or (event_year >= 1900 and event_year <= 2100));
  end if;
end $$;
