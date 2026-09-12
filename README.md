# CareerCompass AU

Personalised, stage-by-stage career planning for international students and skilled migrants in Australia.

## Stack

- **Frontend:** React + Vite + Tailwind CSS, deployed free on Vercel
- **Backend/DB:** Supabase (Postgres, Auth, Storage — free tier)
- **Generative AI:** Google Gemini (`gemini-2.0-flash`, free tier), called only from the
  `api/generate.js` serverless function so the API key stays server-side
- **Routing:** React Router

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from your Supabase project settings
   - `GEMINI_API_KEY` — from https://aistudio.google.com/apikey (no VITE_ prefix — server-side only)
3. Install the Vercel CLI once (`npm i -g vercel`) so serverless functions run locally.
4. Run `vercel dev` (not `npm run dev`) so both the Vite frontend and `api/generate.js`
   are served together. Plain `npm run dev` works for UI-only work but AI calls will 404.

## Project structure

- `src/pages/` — one file per screen (Welcome, Profile, Analysis, Plan, Dashboard, MarketUpdates)
- `src/lib/supabaseClient.js` — Supabase client
- `src/lib/ai.js` — client-side helpers that call `/api/generate`
- `api/generate.js` — serverless function that calls Gemini
- `src/data/marketSources.js` — curated, sourced items for the Screen 6 update feed;
  populate ahead of the demo and pass through `summariseMarketUpdate()`

## Supabase schema (to create in the Supabase SQL editor)

Not yet created — suggested starting tables once you're ready:

- `profiles` (id, user_id, qualification, study_stage, target_occupation, state, ...)
- `plan_activities` (id, profile_id, title, category, period, priority, explanation, status)
- `diary_entries` (id, activity_id, note, created_at)

## Out of scope (per problem brief)

No migration/visa/legal/financial/licensing advice, no employment guarantees, no automatic
job applications or unauthorised data collection. All AI outputs should be labelled as
general career guidance.
