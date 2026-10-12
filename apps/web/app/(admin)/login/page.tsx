import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <LoginForm />
    </main>
  );
}
