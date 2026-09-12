const STORAGE_KEY = 'careercompass:guestPlan'

export function saveGuestPlan(profile, activities) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, activities, savedAt: new Date().toISOString() }))
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not save to this browser. Storage may be full or disabled.' }
  }
}

export function loadGuestPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearGuestPlan() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}
