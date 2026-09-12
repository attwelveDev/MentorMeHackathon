import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadGuestPlan, clearGuestPlan } from '../lib/localPlan'
import { getPlanWithActivities, createPlanWithActivities, saveProfile } from '../lib/db'

// Runs once a session appears: if this browser has a guest plan saved
// locally, moves it into the new/existing account's Supabase plan instead
// of leaving it stranded, so signing up doesn't lose the student's roadmap.
export default function GuestPlanMigrator() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const guest = loadGuestPlan()
    if (!guest) return

    let cancelled = false
    async function migrate() {
      try {
        const existing = await getPlanWithActivities(user.id)
        if (cancelled) return
        if (existing) {
          // already has a real saved plan - the local one is stale, drop it
          clearGuestPlan()
          return
        }
        if (guest.profile) {
          await saveProfile(user.id, guest.profile)
        }
        await createPlanWithActivities(user.id, guest.profile?.targetOccupation, guest.activities)
        if (cancelled) return
        clearGuestPlan()
        navigate('/plan')
      } catch {
        // best-effort; leave the guest plan in place so it can be retried
      }
    }

    migrate()
    return () => { cancelled = true }
  }, [user, navigate])

  return null
}
