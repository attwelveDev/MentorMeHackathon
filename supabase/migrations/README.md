# Applying these migrations

This repo has no Supabase CLI wiring, so these are plain `.sql` files applied
by hand. Apply them via the Supabase project's SQL editor:

1. Go to Dashboard → SQL Editor.
2. Paste the contents of `0001_create_profiles.sql`, click Run.
3. Paste `0002_create_plans.sql`, click Run.
4. Paste `0003_create_activities.sql`, click Run.
5. Paste `0004_create_diary_entries.sql`, click Run.

**Apply them in this exact numeric order.** Each file depends on the ones
before it: `0003` adds a foreign key to `plans` (from `0002`), and `0004`
adds a foreign key to `activities` (from `0003`).

If this project later adopts the Supabase CLI, these same files can be
dropped unchanged into a `supabase db push`-compatible `migrations/` layout.
