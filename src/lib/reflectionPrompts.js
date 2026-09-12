const PROMPTS = {
  'Work experience': 'What did you experience? What did you learn?',
  'Networking': 'Who did you meet? What insights did you gain?',
  'Technical skills': 'What did you learn? How will you apply it?',
  'Certifications': 'What did you learn? How will you apply it?',
}
const FALLBACK_PROMPT = "How did it go? What's your next step?"

export function getReflectionPrompt(category) {
  return PROMPTS[category] ?? FALLBACK_PROMPT
}
