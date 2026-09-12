import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Screen 2: Student profile
const REQUIRED_FIELDS = ['qualification', 'studyStage', 'targetOccupation']

export default function Profile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    qualification: '',
    specialisation: '',
    studyStage: '',
    graduationYear: '',
    targetOccupation: '',
    skills: '',
    certifications: '',
    experience: '',
    preferredSetting: '',
    licences: '',
    state: '',
  })
  const [error, setError] = useState(null)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const missing = REQUIRED_FIELDS.filter((field) => !form[field]?.trim())
    if (missing.length > 0) {
      setError('We could not create your plan. Please check the required information and try again.')
      return
    }
    setError(null)
    // TODO: persist profile to Supabase, then call generateCareerPlan()
    navigate('/analysis', { state: { profile: form } })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
      <p className="mt-2 text-sm text-slate-500">
        Fields marked with * are required.
      </p>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field
          label="Course or qualification *"
          value={form.qualification}
          onChange={(v) => updateField('qualification', v)}
        />
        <Field
          label="Major, specialisation or trade"
          value={form.specialisation}
          onChange={(v) => updateField('specialisation', v)}
        />
        <Field
          label="Current study stage or apprenticeship stage *"
          value={form.studyStage}
          onChange={(v) => updateField('studyStage', v)}
        />
        <Field
          label="Expected graduation year"
          value={form.graduationYear}
          onChange={(v) => updateField('graduationYear', v)}
        />
        <Field
          label="Target occupation or role *"
          value={form.targetOccupation}
          onChange={(v) => updateField('targetOccupation', v)}
        />
        <Field
          label="Australian state or territory"
          value={form.state}
          onChange={(v) => updateField('state', v)}
        />
        <Field
          label="Current skills"
          value={form.skills}
          onChange={(v) => updateField('skills', v)}
          textarea
        />
        <Field
          label="Certifications"
          value={form.certifications}
          onChange={(v) => updateField('certifications', v)}
        />
        <Field
          label="Employment or volunteer experience"
          value={form.experience}
          onChange={(v) => updateField('experience', v)}
          textarea
        />
        <Field
          label="Preferred work setting"
          value={form.preferredSetting}
          onChange={(v) => updateField('preferredSetting', v)}
        />
        <Field
          label="Existing licences, registrations, checks, tickets or cards"
          value={form.licences}
          onChange={(v) => updateField('licences', v)}
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
        >
          Create my plan
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, textarea = false }) {
  const Component = textarea ? 'textarea' : 'input'
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Component
        value={value}
        maxLength={500}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        {...(textarea ? { rows: 3 } : {})}
      />
    </label>
  )
}
