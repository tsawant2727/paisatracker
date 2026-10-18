"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-center font-semibold text-[#06281a] transition active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          required
          className="input-text"
          placeholder="your username"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input-text"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-xl border border-[var(--expense-soft)] bg-[var(--expense-soft)] px-3 py-2 text-sm text-[var(--expense)]">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
