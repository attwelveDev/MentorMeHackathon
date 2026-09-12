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
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const missing = REQUIRED_FIELDS.filter((field) => !form[field]?.trim())
    if (missing.length > 0) {
      const errors = Object.fromEntries(missing.map((f) => [f, 'This field is required.']))
      setFieldErrors(errors)
      setFormError('We could not create your plan. Please check the required information and try again.')
      return
    }
    setFieldErrors({})
    setFormError(null)
    // TODO: persist profile to Supabase, then call generateCareerPlan()
    navigate('/analysis', { state: { profile: form } })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
      <p className="mt-2 text-sm text-slate-500">
        Fields marked with * are required.
      </p>
      {formError && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field
          id="qualification"
          label="Course or qualification *"
          value={form.qualification}
          onChange={(v) => updateField('qualification', v)}
          error={fieldErrors.qualification}
        />
        <Field
          id="specialisation"
          label="Major, specialisation or trade"
          value={form.specialisation}
          onChange={(v) => updateField('specialisation', v)}
          error={fieldErrors.specialisation}
        />
        <Field
          id="studyStage"
          label="Current study stage or apprenticeship stage *"
          value={form.studyStage}
          onChange={(v) => updateField('studyStage', v)}
          error={fieldErrors.studyStage}
        />
        <Field
          id="graduationYear"
          label="Expected graduation year"
          value={form.graduationYear}
          onChange={(v) => updateField('graduationYear', v)}
          error={fieldErrors.graduationYear}
        />
        <Field
          id="targetOccupation"
          label="Target occupation or role *"
          value={form.targetOccupation}
          onChange={(v) => updateField('targetOccupation', v)}
          error={fieldErrors.targetOccupation}
        />
        <Field
          id="state"
          label="Australian state or territory"
          value={form.state}
          onChange={(v) => updateField('state', v)}
          error={fieldErrors.state}
        />
        <Field
          id="skills"
          label="Current skills"
          value={form.skills}
          onChange={(v) => updateField('skills', v)}
          type="textarea"
          error={fieldErrors.skills}
        />
        <Field
          id="certifications"
          label="Certifications"
          value={form.certifications}
          onChange={(v) => updateField('certifications', v)}
          error={fieldErrors.certifications}
        />
        <Field
          id="experience"
          label="Employment or volunteer experience"
          value={form.experience}
          onChange={(v) => updateField('experience', v)}
          type="textarea"
          error={fieldErrors.experience}
        />
        <Field
          id="preferredSetting"
          label="Preferred work setting"
          value={form.preferredSetting}
          onChange={(v) => updateField('preferredSetting', v)}
          error={fieldErrors.preferredSetting}
        />
        <Field
          id="licences"
          label="Existing licences, registrations, checks, tickets or cards"
          value={form.licences}
          onChange={(v) => updateField('licences', v)}
          error={fieldErrors.licences}
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

function Field({ id, label, value, onChange, type = 'text', options = [], error }) {
  const Component = type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input'
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Component
        id={id}
        value={value}
        maxLength={type === 'select' ? undefined : 500}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
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
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  )
}
