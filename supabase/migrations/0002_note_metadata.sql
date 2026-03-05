-- Add note metadata to support timeline and category tagging
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
