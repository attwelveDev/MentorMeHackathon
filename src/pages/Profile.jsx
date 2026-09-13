import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EDUCATION_SECTORS,
  STUDY_STAGES,
  AU_STATES,
  EMPLOYMENT_ARRANGEMENTS,
  WORK_LOCATION_MODES,
  WORK_RIGHTS,
  NO_QUALIFICATION_YET,
  NO_SPECIALISATION,
} from '../lib/profileOptions'
import { useAuth } from '../lib/auth'
import { loadGuestPlan, saveGuestPlan } from '../lib/localPlan'
import { getProfile, saveProfile, getPlanWithActivities } from '../lib/db'
import { getCached, setCached } from '../lib/pageCache'
import NotebookFrame, { StickyNote, SquiggleIcon, DeskIllustration, ArrowRightIcon } from '../components/NotebookFrame'

// Screen 2: Student profile
const BASE_REQUIRED_FIELDS = ['qualification', 'educationSector', 'studyStage', 'graduationYear', 'targetOccupation', 'skills', 'experience', 'workRights']

function getRequiredFields(studyStage) {
  return studyStage === 'recently-completed'
    ? BASE_REQUIRED_FIELDS
    : [...BASE_REQUIRED_FIELDS, 'courseLengthYears']
}

function isValidCourseLength(value) {
  return /^[1-6]$/.test(value.trim())
}

function mapProfileRow(row) {
  return {
    qualification: row.qualification ?? '',
    specialisation: row.specialisation ?? '',
    educationSector: row.education_sector ?? '',
    studyStage: row.study_stage ?? '',
    graduationYear: row.graduation_year ?? '',
    courseLengthYears: row.course_length_years != null ? String(row.course_length_years) : '',
    targetOccupation: row.target_occupation ?? '',
    state: row.state ?? '',
    workRights: row.work_rights ?? '',
    skills: row.skills ?? '',
    certifications: row.certifications ?? '',
    experience: row.experience ?? '',
    employmentArrangement: row.employment_arrangement ?? '',
    workLocationMode: row.work_location_mode ?? '',
    otherPreferences: row.other_preferences ?? '',
    licences: row.licences ?? '',
  }
}

const BLANK_FORM = {
  qualification: '',
  specialisation: '',
  educationSector: '',
  studyStage: '',
  graduationYear: '',
  courseLengthYears: '',
  targetOccupation: '',
  skills: '',
  certifications: '',
  experience: '',
  employmentArrangement: '',
  workLocationMode: '',
  otherPreferences: '',
  licences: '',
  state: '',
  workRights: '',
}

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const cacheKey = user ? `profile:${user.id}` : 'profile:guest'
  const cached = getCached(cacheKey)
  const [form, setForm] = useState({ ...BLANK_FORM, ...(cached?.form ?? {}) })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(Boolean(user) && !cached)
  const [hasPlan, setHasPlan] = useState(cached?.hasPlan ?? false)

  // Once loaded, keep serving this cached copy on remount (e.g. navigating
  // away and back) instead of refetching and flashing the loading screen.
  useEffect(() => {
    if (cached) return
    let cancelled = false
    async function loadExisting() {
      if (user) {
        setLoadingProfile(true)
        try {
          const [existing, planData] = await Promise.all([
            getProfile(user.id),
            getPlanWithActivities(user.id),
          ])
          if (cancelled) return
          const nextForm = existing ? { ...form, ...mapProfileRow(existing) } : form
          const nextHasPlan = Boolean(planData?.plan)
          setForm(nextForm)
          setHasPlan(nextHasPlan)
          setCached(cacheKey, { form: nextForm, hasPlan: nextHasPlan })
        } catch {
          // best-effort prefill; leave the form blank if it fails
        } finally {
          if (!cancelled) setLoadingProfile(false)
        }
        return
      }
      setLoadingProfile(false)
      setHasPlan(false)
      const guest = loadGuestPlan()
      if (!cancelled && guest?.profile) {
        const nextForm = { ...form, ...guest.profile }
        setForm(nextForm)
        setCached(cacheKey, { form: nextForm, hasPlan: false })
      }
    }
    loadExisting()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Persist edits into the cache as the user types, so navigating away and
  // back (without submitting) restores exactly what they had.
  useEffect(() => {
    setCached(cacheKey, { form, hasPlan })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, form, hasPlan])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const missing = getRequiredFields(form.studyStage).filter((field) => !form[field]?.trim())
    const errors = Object.fromEntries(missing.map((f) => [f, 'This field is required.']))
    if (form.studyStage !== 'recently-completed' && form.courseLengthYears.trim() && !isValidCourseLength(form.courseLengthYears)) {
      errors.courseLengthYears = 'Enter a whole number between 1 and 6.'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('We could not create your plan. Please check the required information and try again.')
      return
    }
    setFieldErrors({})
    setFormError(null)

    if (user) {
      try {
        await saveProfile(user.id, form)
      } catch {
        setFormError('We could not save your profile. Please try again.')
        return
      }
    } else {
      const existing = loadGuestPlan()
      saveGuestPlan(form, existing?.activities ?? [])
    }

    navigate('/analysis', { state: { profile: form } })
  }

  if (loadingProfile) {
    return (
      <div className="diary-paper flex min-h-screen items-center justify-center px-4">
        <p className="font-diary-title text-2xl text-slate-700 dark:text-slate-200">Loading your profile…</p>
      </div>
    )
  }

  return (
    <NotebookFrame
      stickyNotes={['One step closer', "You've got this ⌣"]}
      leftPage={
        <>
          <div className="relative">
            <h1 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">Your profile</h1>
            <SquiggleIcon className="absolute -right-1 -top-2 h-4 w-6 text-slate-400" />
          </div>
          <p className="font-diary-body mt-3 text-sm text-slate-500 dark:text-slate-400">
            {hasPlan
              ? 'Keep this up to date so your existing plan stays on point as things change. Fields marked with * are required.'
              : 'Tell us about your qualification and goals so we can sketch out a plan that actually fits you. Fields marked with * are required.'}
          </p>

          <div className="relative mt-8">
            <div className="absolute -top-4 right-2 rotate-3">
              <StickyNote small>A career I love</StickyNote>
            </div>
            <DeskIllustration className="mx-auto h-auto w-full max-w-[260px]" />
          </div>

          <p className="font-diary-body mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Same girl…{' '}
            <span className="font-diary-title text-base text-teal-700 dark:text-teal-300">A brighter future ♥</span>
          </p>
        </>
      }
      rightPage={
        <>
          <h2 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">About you</h2>
          <p className="font-diary-body mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hasPlan
              ? 'Update any of these and re-create your plan to refresh your existing roadmap.'
              : 'This shapes the roadmap we build for you next.'}
          </p>

          {formError && (
            <p role="alert" className="font-diary-body mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{formError}</p>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field
          id="qualification"
          label="Course or qualification *"
          value={form.qualification}
          onChange={(v) => updateField('qualification', v)}
          error={fieldErrors.qualification}
          disabled={form.qualification === NO_QUALIFICATION_YET}
          placeholder="e.g. Bachelor of Nursing, Diploma of Early Childhood Education, Certificate III in Carpentry"
        />
        <label className="font-diary-body mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.qualification === NO_QUALIFICATION_YET}
            onChange={(e) => updateField('qualification', e.target.checked ? NO_QUALIFICATION_YET : '')}
          />
          I don't have a qualification yet
        </label>
        <Field
          id="specialisation"
          label="Major, specialisation or trade"
          value={form.specialisation}
          onChange={(v) => updateField('specialisation', v)}
          error={fieldErrors.specialisation}
          disabled={form.specialisation === NO_SPECIALISATION}
          placeholder="e.g. Paediatric nursing, Cabinetmaking, Financial accounting"
        />
        <label className="font-diary-body mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.specialisation === NO_SPECIALISATION}
            onChange={(e) => updateField('specialisation', e.target.checked ? NO_SPECIALISATION : '')}
          />
          I don't have a major, specialisation or trade yet
        </label>
        <Field
          id="educationSector"
          label="Education sector *"
          value={form.educationSector}
          onChange={(v) => updateField('educationSector', v)}
          type="select"
          options={EDUCATION_SECTORS}
          error={fieldErrors.educationSector}
        />
        <Field
          id="studyStage"
          label="Current study stage or apprenticeship stage *"
          value={form.studyStage}
          onChange={(v) => updateField('studyStage', v)}
          type="select"
          options={STUDY_STAGES}
          error={fieldErrors.studyStage}
        />
        <Field
          id="graduationYear"
          label="Expected graduation year *"
          value={form.graduationYear}
          onChange={(v) => updateField('graduationYear', v)}
          error={fieldErrors.graduationYear}
        />
        {form.studyStage !== 'recently-completed' && (
          <Field
            id="courseLengthYears"
            label="Course/program length in years *"
            value={form.courseLengthYears}
            onChange={(v) => updateField('courseLengthYears', v)}
            error={fieldErrors.courseLengthYears}
            placeholder="e.g. 3"
          />
        )}
        <Field
          id="targetOccupation"
          label="Target occupation or role *"
          value={form.targetOccupation}
          onChange={(v) => updateField('targetOccupation', v)}
          error={fieldErrors.targetOccupation}
          placeholder="e.g. Registered Nurse, Cabinetmaker, Financial Accountant, Early Childhood Educator"
        />
        <Field
          id="state"
          label="Australian state or territory"
          value={form.state}
          onChange={(v) => updateField('state', v)}
          type="select"
          options={AU_STATES}
          error={fieldErrors.state}
        />
        <Field
          id="workRights"
          label="Work rights *"
          value={form.workRights}
          onChange={(v) => updateField('workRights', v)}
          type="select"
          options={WORK_RIGHTS}
          error={fieldErrors.workRights}
        />
        <p className="font-diary-body mt-1 text-xs text-slate-500 dark:text-slate-400">
          Self-reported — Planery doesn't verify this or provide
          visa/migration advice.
        </p>
        <Field
          id="skills"
          label="Current skills *"
          value={form.skills}
          onChange={(v) => updateField('skills', v)}
          type="textarea"
          error={fieldErrors.skills}
          placeholder="e.g. Basic bookkeeping, MS Excel, customer service, First Aid certificate"
        />
        <Field
          id="certifications"
          label="Certifications"
          value={form.certifications}
          onChange={(v) => updateField('certifications', v)}
          error={fieldErrors.certifications}
          placeholder="e.g. White Card, Responsible Service of Alcohol (RSA), First Aid Certificate"
        />
        <Field
          id="experience"
          label="Employment or volunteer experience *"
          value={form.experience}
          onChange={(v) => updateField('experience', v)}
          type="textarea"
          error={fieldErrors.experience}
          placeholder="e.g. Part-time retail assistant (6 months), unpaid childcare placement (3 weeks)"
        />
        <Field
          id="employmentArrangement"
          label="Preferred employment arrangement"
          value={form.employmentArrangement}
          onChange={(v) => updateField('employmentArrangement', v)}
          type="select"
          options={EMPLOYMENT_ARRANGEMENTS}
          error={fieldErrors.employmentArrangement}
        />
        <Field
          id="workLocationMode"
          label="Preferred work location mode"
          value={form.workLocationMode}
          onChange={(v) => updateField('workLocationMode', v)}
          type="select"
          options={WORK_LOCATION_MODES}
          error={fieldErrors.workLocationMode}
        />
        <Field
          id="otherPreferences"
          label="Other work preferences (culture, sector type, etc.)"
          value={form.otherPreferences}
          onChange={(v) => updateField('otherPreferences', v)}
          error={fieldErrors.otherPreferences}
          placeholder="e.g. prefer a supportive team culture, interested in the not-for-profit sector"
        />
        <Field
          id="licences"
          label="Existing licences, registrations, checks, tickets or cards"
          value={form.licences}
          onChange={(v) => updateField('licences', v)}
          error={fieldErrors.licences}
          placeholder="e.g. Provisional driver's licence, Working with Children Check, White Card"
        />
            <button
              type="submit"
              className="font-diary-title flex w-full items-center justify-center gap-2 rounded-full bg-sky-300 px-4 py-3 text-lg text-slate-800 shadow-sm transition hover:bg-sky-400 dark:bg-sky-500 dark:text-slate-900 dark:hover:bg-sky-400"
            >
              Create my plan
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>
        </>
      }
    />
  )
}

function Field({ id, label, value, onChange, type = 'text', options = [], error, disabled = false, placeholder }) {
  const Component = type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input'
  return (
    <label htmlFor={id} className="block">
      <span className="font-diary-body text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className={`diary-field mt-1 rounded-xl border px-3 ${error ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'}`}>
        <Component
          id={id}
          value={value}
          maxLength={type === 'select' ? undefined : 500}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          placeholder={type === 'select' ? undefined : placeholder}
          className="font-diary-body block w-full bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          {...(type === 'textarea' ? { rows: 3 } : {})}
        >
          {type === 'select' ? (
            <>
              <option value="">Select…</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </>
          ) : null}
        </Component>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="font-diary-body mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </label>
  )
}
