// Doc 12 Step 2 (Academic Setup) is the real next step in the onboarding
// flow and isn't built yet -- this page is an honest stopping point for
// what's implemented so far, not a placeholder dashboard pretending to be
// further along.
export default function RegisterSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">School registered</h1>
      <p className="text-slate-600">
        Your 31-day trial has started. Academic setup (sessions, terms, classes, subjects) is the
        next step and isn&rsquo;t built yet.
      </p>
    </main>
  );
}
