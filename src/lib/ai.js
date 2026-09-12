// Client-side helper for calling the /api/generate serverless function
// (see api/generate.js). Keeps the Gemini API key server-side only.

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
  const prompt = `You are a career-guidance assistant for international students in Australia.
Given this student profile (JSON): ${JSON.stringify(profile)}

Generate a stage-by-stage career preparation plan grouped into these periods:
"Now", "This semester", "Next semester", "Next break", "Before final year", "Graduate application period".

Return a JSON array of activities, each with:
- title: string
- category: string (one of: Technical skills, Certifications, Work experience, Networking, Extracurricular activities, Application preparation, Commercial and industry awareness, Licensing/registration/compliance, Practical competencies/placements/portfolio evidence)
- period: string (one of the periods above)
- priority: "High" | "Medium" | "Low"
- explanation: string (why this activity was recommended)
- status: "Not started"
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
- whyItMatters: string (relevance to this student's career goal)
Do not include any text outside the JSON object.`
  const { text } = await callGenerate(prompt, 'market-update')
  return text
}
