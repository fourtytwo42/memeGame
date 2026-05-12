"use client";

import { useActionState } from "react";
import { credentialsSignIn } from "@/app/signin/actions";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(credentialsSignIn, {});

  return (
    <form action={formAction} className="grid gap-4" data-testid="signin-form">
      <label className="grid gap-2 text-sm font-bold text-slate-200">
        Username or email
        <input
          autoComplete="username"
          className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
          name="identifier"
          required
          type="text"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-200">
        Password
        <input
          autoComplete="current-password"
          className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p
          className="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm font-semibold text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <button
        className="min-h-11 rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
