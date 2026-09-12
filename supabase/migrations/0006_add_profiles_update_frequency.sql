alter table public.profiles
  add column update_frequency text not null default 'weekly'
    check (update_frequency in ('daily', 'weekly', 'off'));
