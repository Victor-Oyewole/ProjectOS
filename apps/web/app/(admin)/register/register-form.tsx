"use client";

import { useActionState } from "react";
import { registerSchool } from "./actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await registerSchool(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="schoolName" className="text-sm font-medium">
          School name
        </label>
        <input
          id="schoolName"
          name="schoolName"
          required
          className="rounded-md border border-border px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="country" className="text-sm font-medium">
          Country
        </label>
        <input
          id="country"
          name="country"
          required
          defaultValue="Nigeria"
          className="rounded-md border border-border px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="adminName" className="text-sm font-medium">
          Your name
        </label>
        <input
          id="adminName"
          name="adminName"
          required
          className="rounded-md border border-border px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-md border border-border px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="rounded-md border border-border px-3 py-2"
        />
      </div>

      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {isPending ? "Registering…" : "Register school"}
      </button>
    </form>
  );
}
