import Link from "next/link";

// Doc 24 Section 2 step 1: "School owner lands on SchoolOS marketing site"
// before registering -- a placeholder landing page, not the marketing site
// itself (out of scope here), just enough to get into the registration flow.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold">SchoolOS</h1>
      <p className="text-slate-600">
        Run your school&rsquo;s attendance, assignments, fees, and family communication in one
        place.
      </p>
      <Link
        href="/register"
        className="rounded-md bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
      >
        Register your school
      </Link>
      <Link href="/login" className="text-sm text-slate-600 underline hover:text-slate-900">
        Already registered? Log in
      </Link>
    </main>
  );
}
