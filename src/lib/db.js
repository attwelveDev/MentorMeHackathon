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

export async function deleteActivity(activityId) {
  const { error } = await supabase.from('activities').delete().eq('id', activityId)
  if (error) throw new Error(error.message)
}

export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  return data ?? null
}

export async function saveProfile(userId, profile) {
  const row = {
    user_id: userId,
    qualification: profile.qualification || null,
    specialisation: profile.specialisation || null,
    education_sector: profile.educationSector || null,
    study_stage: profile.studyStage || null,
    graduation_year: profile.graduationYear || null,
    course_length_years: profile.courseLengthYears ? Number(profile.courseLengthYears) : null,
    target_occupation: profile.targetOccupation || null,
    state: profile.state || null,
    work_rights: profile.workRights || null,
    skills: profile.skills || null,
    certifications: profile.certifications || null,
    experience: profile.experience || null,
    employment_arrangement: profile.employmentArrangement || null,
    work_location_mode: profile.workLocationMode || null,
    other_preferences: profile.otherPreferences || null,
    licences: profile.licences || null,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('profiles').upsert(row)
  if (error) throw new Error(error.message)
}

export async function getDiaryEntriesForActivity(activityId) {
  const { data, error } = await supabase
    .from('diary_entries').select('*').eq('activity_id', activityId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getDiaryEntries(userId, { limit } = {}) {
  let query = supabase
    .from('diary_entries').select('*, activity:activities(title)')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createDiaryEntry(activityId, userId, entryText) {
  const { data, error } = await supabase
    .from('diary_entries')
    .insert({ activity_id: activityId, user_id: userId, entry_text: entryText })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function setDiaryEntryFeedback(entryId, feedback) {
  const { error } = await supabase
    .from('diary_entries').update({ ai_feedback: feedback }).eq('id', entryId)
  if (error) throw new Error(error.message)
}
