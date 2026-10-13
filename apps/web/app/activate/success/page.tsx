// Doc 12 step 4: "Lands on Teacher/Family Dashboard" -- neither dashboard
// is built yet, so this is an honest stopping point, not a placeholder
// pretending to be a real dashboard.
export default function ActivateSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Account activated</h1>
      <p className="text-slate-600">
        Your account is set up. The teacher and family dashboards aren&rsquo;t built yet.
      </p>
    </main>
  );
}
