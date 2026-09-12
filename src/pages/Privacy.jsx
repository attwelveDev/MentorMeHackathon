// Privacy Policy — plain-language placeholder describing what data
// CareerCompass AU (a student hackathon project) stores and why.
export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: this is a student project prototype, not a finished legal document.</p>

      <div className="mt-6 space-y-5 text-sm text-slate-700">
        <section>
          <h2 className="font-semibold text-slate-900">What we store</h2>
          <p className="mt-1">
            When you create an account, we store your email address and the profile, plan, and
            diary information you choose to enter (course or qualification, target occupation,
            state, skills, and progress notes) in our database, provided by Supabase.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">How it's used</h2>
          <p className="mt-1">
            Your profile details are sent to Google's Gemini API solely to generate the
            personalised guidance and market-update summaries shown to you. We don't sell your
            data or share it with advertisers.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">Your control over your data</h2>
          <p className="mt-1">
            You can review and edit your profile at any time, and can request deletion of your
            account and its data.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">Changes</h2>
          <p className="mt-1">
            Because this is an evolving hackathon prototype, this policy may change as the
            product develops.
          </p>
        </section>
      </div>
    </div>
  )
}
