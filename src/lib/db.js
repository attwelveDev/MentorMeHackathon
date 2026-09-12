import { supabase } from './supabaseClient'

export async function getPlanWithActivities(userId) {
  const { data: plan } = await supabase
    .from('plans').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!plan) return null
  const { data: activities } = await supabase
    .from('activities').select('*').eq('plan_id', plan.id)
    .order('sort_order', { ascending: true })
  return { plan, activities: activities ?? [] }
}

export async function createPlanWithActivities(userId, targetOccupation, activities) {
  const { data: plan, error: planError } = await supabase
    .from('plans').insert({ user_id: userId, target_occupation: targetOccupation }).select().single()
  if (planError) throw new Error(planError.message)
  const rows = activities.map((a, i) => ({
    plan_id: plan.id,
    user_id: userId,
    title: a.title,
    category: a.category,
    period_label: a.period,
    period_year: a.periodYear,
    priority: a.priority,
    explanation: a.explanation,
    status: a.status,
    sort_order: i,
  }))
  const { data: inserted, error: activitiesError } = await supabase.from('activities').insert(rows).select()
  if (activitiesError) throw new Error(activitiesError.message)
  return { plan, activities: inserted }
}

export async function updateActivityStatus(activityId, status) {
  const { error } = await supabase.from('activities')
    .update({ status, updated_at: new Date().toISOString() }).eq('id', activityId)
  if (error) throw new Error(error.message)
}

export async function setPlanAccepted(planId, accepted) {
  const { error } = await supabase.from('plans')
    .update({ accepted, updated_at: new Date().toISOString() }).eq('id', planId)
  if (error) throw new Error(error.message)
}
