// Doc 12 step 4: "Lands on Teacher/Family Dashboard." The teacher dashboard
// now exists (Milestone 2) and activation redirects there directly -- this
// page is only reached by family activation now, whose dashboard is still
// Milestone 3, so it stays an honest stopping point rather than a
// placeholder pretending to be a real one.
export default function ActivateSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Account activated</h1>
      <p className="text-slate-600">Your account is set up. The family dashboard isn&rsquo;t built yet.</p>
    </main>
  );
}
