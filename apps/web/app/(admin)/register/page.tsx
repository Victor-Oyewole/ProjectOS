import { RegisterForm } from "./register-form";

// Doc 12 Step 1: School Registration.
export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Register your school</h1>
        <p className="mt-1 text-sm text-slate-600">Starts a 31-day free trial, no charge yet.</p>
      </div>
      <RegisterForm />
    </main>
  );
}
