// Terms of Service — plain-language placeholder covering how CareerCompass AU
// (a student hackathon project) may be used, pending a full legal review.
export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: this is a student project prototype, not a finished legal document.</p>

      <div className="mt-6 space-y-5 text-sm text-slate-700">
        <p>
          CareerCompass AU is a career-planning tool for international students studying in
          Australia. By creating an account, you agree to use it for its intended purpose:
          building and tracking a personal career plan.
        </p>
        <section>
          <h2 className="font-semibold text-slate-900">What the platform does not provide</h2>
          <p className="mt-1">
            CareerCompass AU does not provide migration, visa, legal, financial, or licensing
            advice, and does not guarantee employment, sponsorship, or migration outcomes.
            Guidance shown in the app, including AI-generated content, is general information
            only — always verify anything important with official sources or a qualified
            professional.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">Your account and content</h2>
          <p className="mt-1">
            You are responsible for the accuracy of the profile and diary information you enter.
            You can edit or remove your data at any time from your profile.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">Changes</h2>
          <p className="mt-1">
            Because this is an evolving hackathon prototype, these terms may change as the
            product develops.
          </p>
        </section>
      </div>
    </div>
  )
}
