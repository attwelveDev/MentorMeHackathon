// Client-side helper for calling the /api/generate serverless function
// (see api/generate.js). Keeps the Gemini API key server-side only.
import { getExpectedPeriodLabels } from './roadmap'
import { TOPICS } from './marketUpdates'

async function callGenerate(prompt, task) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, task }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `AI request failed with status ${response.status}`)
  }

  return response.json()
}

// Screen 3: compares a student profile against common entry-level
// requirements for their target occupation.
export async function getCareerReadinessAnalysis(profile) {
  const prompt = `You are a career-guidance assistant for international students in Australia.
Given this student profile (JSON): ${JSON.stringify(profile)}

Do not comment on, assess, or list visa subclass, sponsorship pathways, or migration eligibility anywhere in your response, including insufficientInformation — CareerCompass AU does not provide migration or visa advice.

Return a JSON object with these fields only:
- strengths: string[]
- skillGaps: string[]
- experienceGaps: string[]
- licencesToInvestigate: string[]
- insufficientInformation: string[] (fields you could not assess and why)
Each array item should be a short string that includes a brief "why" explanation.
Do not include any text outside the JSON object.`
  const { text } = await callGenerate(prompt, 'readiness-analysis')
  return text
}

// Screen 4: generates a stage-by-stage career plan.
export async function generateCareerPlan(profile) {
  const periodLabels = getExpectedPeriodLabels(profile)
  const prompt = `You are a career-guidance assistant for international students in Australia.
Given this student profile (JSON): ${JSON.stringify(profile)}

Generate a stage-by-stage career preparation plan grouped into these exact period labels, in this order, and using ONLY these labels: ${JSON.stringify(periodLabels)}.
${profile.studyStage === 'recently-completed'
    ? 'This student has already graduated. Use "Before graduating" for exactly one summary activity representing what they already completed during their studies, with status "Completed". Use the "Year N after graduating" labels for future activities.'
    : 'This student is still studying. Distribute activities across the Year labels according to when they would realistically be done during a course of this length.'}

Return a JSON array of activities, each with:
- title: string
- category: string (one of: Technical skills, Certifications, Work experience, Networking, Extracurricular activities, Application preparation, Commercial and industry awareness, Licensing/registration/compliance, Practical competencies/placements/portfolio evidence)
- period: string (one of the exact period labels above)
- priority: "High" | "Medium" | "Low"
- explanation: string (why this activity was recommended)
- status: "Not started" (or "Completed", only for the single "Before graduating" activity if used)
Do not include any text outside the JSON array.`
  const { text } = await callGenerate(prompt, 'career-plan')
  return text
}

// Screen 6: summarises and labels a job-market/migration update for a
// given state and occupation. Feed it a pre-curated source item; this only
// generates the relevance explanation and label, it does not fetch news.
export async function summariseMarketUpdate({ sourceText, occupation, state }) {
  const prompt = `You are a career-guidance assistant. Summarise this sourced item for an
international student targeting the occupation "${occupation}" in ${state}, Australia.

Source text: ${sourceText}

Return a JSON object with:
- headline: string
- summary: string (2-3 sentences, factual)
- statusLabel: "Confirmed change" | "Proposal" | "Forecast" | "Research" | "Commentary"
- topic: one of exactly these values: ${JSON.stringify(TOPICS)}
- whyItMatters: string (relevance to this student's career goal)
Do not include any text outside the JSON object.`
  const { text } = await callGenerate(prompt, 'market-update')
  return text
}

// Diary: on-request-only feedback on a single diary entry (never called automatically).
export async function getDiaryFeedback(activity, entryText) {
  const prompt = `You are a supportive career-guidance assistant for an international student in Australia.
The student is working on this career-plan activity: "${activity.title}" (category: ${activity.category}).
Here is their diary entry about their progress: "${entryText}"

Write short (2-4 sentence), encouraging, specific feedback on their progress and a concrete next step they could try.
Do not comment on, assess, or provide visa, migration, legal, financial, or licensing advice, and do not guarantee any employment or migration outcome.
Return only the feedback text — no JSON, headers, or additional commentary.`
  const { text } = await callGenerate(prompt, 'diary-feedback')
  return text
}
