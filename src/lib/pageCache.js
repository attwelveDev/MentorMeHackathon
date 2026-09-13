// Module-scoped cache: survives React Router unmount/remount (navigating
// away and back) but resets on a real page reload, since it just lives in
// memory for as long as the app is running.
const cache = new Map()

export function getCached(key) {
  return cache.get(key)
}

export function setCached(key, value) {
  cache.set(key, value)
}

// Test-only: module state otherwise leaks between tests in the same file.
export function clearCache() {
  cache.clear()
}
