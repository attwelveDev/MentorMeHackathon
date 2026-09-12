create table public.activities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in (
    'Technical skills', 'Certifications', 'Work experience', 'Networking',
    'Extracurricular activities', 'Application preparation',
    'Commercial and industry awareness',
    'Licensing/registration/compliance',
    'Practical competencies/placements/portfolio evidence'
  )),
  period_label text not null,
  period_year integer,
  priority text not null check (priority in ('High', 'Medium', 'Low')),
  explanation text not null,
  status text not null default 'Not started'
    check (status in ('Not started', 'In progress', 'Completed')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "activities_select_own" on public.activities
  for select using (auth.uid() = user_id);
create policy "activities_insert_own" on public.activities
  for insert with check (auth.uid() = user_id);
create policy "activities_update_own" on public.activities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activities_delete_own" on public.activities
  for delete using (auth.uid() = user_id);
