// Vercel serverless function: proxies Gemini calls so the API key never
// reaches the browser. Run locally with `vercel dev` (uses .env for
// GEMINI_API_KEY) or deploy to Vercel and set the env var in the dashboard.
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Tried in order; each free-tier model has its own separate daily quota, so
// if one is exhausted (or deprecated/unavailable) the next still has headroom.
const MODEL_FALLBACK_CHAIN = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { prompt, task } = req.body ?? {}

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'A string "prompt" field is required.' })
    return
  }

  let lastError
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      res.status(200).json({ task: task ?? null, text })
      return
    } catch (error) {
      console.error(`Gemini request failed (model: ${modelName}):`, error)
      lastError = error
    }
  }

  console.error('All Gemini models in the fallback chain failed:', lastError)
  res.status(502).json({ error: 'Failed to generate content from the AI model.' })
}
