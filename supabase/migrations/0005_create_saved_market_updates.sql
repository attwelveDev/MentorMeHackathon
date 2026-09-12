create table public.saved_market_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  status text not null check (status in ('saved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_id)
);

alter table public.saved_market_updates enable row level security;

create policy "saved_market_updates_select_own" on public.saved_market_updates
  for select using (auth.uid() = user_id);
create policy "saved_market_updates_insert_own" on public.saved_market_updates
  for insert with check (auth.uid() = user_id);
create policy "saved_market_updates_update_own" on public.saved_market_updates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_market_updates_delete_own" on public.saved_market_updates
  for delete using (auth.uid() = user_id);
