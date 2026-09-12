// Vercel serverless function: proxies Gemini calls so the API key never
// reaches the browser. Run locally with `vercel dev` (uses .env for
// GEMINI_API_KEY) or deploy to Vercel and set the env var in the dashboard.
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

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

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    res.status(200).json({ task: task ?? null, text })
  } catch (error) {
    console.error('Gemini request failed:', error)
    res.status(502).json({ error: 'Failed to generate content from the AI model.' })
  }
}
