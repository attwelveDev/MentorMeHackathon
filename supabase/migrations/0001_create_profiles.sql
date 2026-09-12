create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  qualification text,
  specialisation text,
  education_sector text,
  study_stage text,
  graduation_year text,
  course_length_years integer,
  target_occupation text,
  state text,
  work_rights text,
  skills text,
  certifications text,
  experience text,
  employment_arrangement text,
  work_location_mode text,
  other_preferences text,
  licences text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);
