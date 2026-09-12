# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Problem and solution

Many international students begin career preparation too late, while existing platforms
often provide more support for corporate roles than vocational and trade pathways.
CareerCompass AU turns a student's qualification, career goal and Australian state or
territory into a structured career roadmap informed by entry-level job requirements.
Whether the student is pursuing finance, early childhood education, carpentry or another
pathway, the platform shows what they can do each stage to become more competitive and
provides relevant local job-market, occupation-demand and official migration information,
making career planning more personalised, inclusive and state-aware.

## Primary user

International tertiary students currently studying in Australia, including both higher
education and VET students.

## MVP capabilities

1. **Student profile** — the user enters course or qualification, education sector, study
   stage, target occupation, preferred work setting, current skills, licences or
   registrations, and experience.
2. **Personalised career planner and diary** — the application generates an editable
   year-by-year plan based on common entry-level job requirements. The user can review,
   edit, accept, and track progress of activities, and log diary entries under each
   activity to track progress and receive additional feedback.
3. **State-specialised job market and migration trend updates** — sourced, date-stamped
   updates on local occupation demand, workforce trends and official migration
   information relevant to the student's profile.

## Out of scope

- Migration, visa, legal, financial, licensing or registration advice.
- Guarantees of employment, sponsorship or migration eligibility.
- Automatic job applications or unauthorised data collection.

## Tech stack and conventions

- **Frontend:** React + Vite + Tailwind CSS. Pages live one-per-screen under `src/pages/`;
  shared logic goes in `src/lib/`. Routing via React Router (`src/App.jsx`).
- **Backend/DB:** Supabase (Postgres, Auth, Storage — free tier). Client at
  `src/lib/supabaseClient.js`, configured via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- **Generative AI:** Google Gemini (`gemini-3.6-flash`, free tier). The API key
  (`GEMINI_API_KEY`) is server-side only — never prefix it with `VITE_` or call the Gemini
  SDK from client code. All AI calls go through the `api/generate.js` serverless function;
  client code calls the typed helpers in `src/lib/ai.js`, not `fetch('/api/generate')`
  directly.
- **Hosting:** Vercel (frontend + serverless functions), free tier.
- **Local dev:** run `vercel dev`, not `npm run dev`, so `api/generate.js` is served
  alongside the Vite frontend — plain `npm run dev` will 404 on AI calls.
- **Env vars:** copy `.env.example` to `.env`; never commit `.env`.

## Sourcing rule

Any source, statistic, job-market figure, occupation-demand claim, or migration
information shown to users must be real and traceable to an actual source — never
fabricated or invented, including by the AI model. Every such item needs a source name,
publication date, and date retrieved, and must be clearly labelled as one of: confirmed
change, proposal, forecast, research, or commentary. If a claim cannot be backed by a real
source, do not display it — show an empty/insufficient-information state instead.

## Testing and commit workflow

- All tests must pass before pushing.
- Commit every feature, bug fix, documentation change, and other unit of work.
