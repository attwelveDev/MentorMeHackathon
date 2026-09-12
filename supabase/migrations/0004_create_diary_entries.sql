create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_text text not null,
  ai_feedback text,
  created_at timestamptz not null default now()
);

alter table public.diary_entries enable row level security;

create policy "diary_entries_select_own" on public.diary_entries
  for select using (auth.uid() = user_id);
create policy "diary_entries_insert_own" on public.diary_entries
  for insert with check (auth.uid() = user_id);
create policy "diary_entries_update_own" on public.diary_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diary_entries_delete_own" on public.diary_entries
  for delete using (auth.uid() = user_id);
