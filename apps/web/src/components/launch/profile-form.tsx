"use client";

import { useActionState } from "react";
import { saveFounderProfile } from "@/app/profile/actions";
import { Button, FormField } from "@meme-foundry/ui";

export function ProfileForm({
  defaultDisplayName,
  defaultBio
}: {
  defaultDisplayName: string;
  defaultBio: string;
}) {
  const [state, action, pending] = useActionState(saveFounderProfile, {});
  return (
    <form
      action={action}
      className="grid gap-4"
      data-testid="founder-profile-form"
    >
      <FormField
        label="Founder display name"
        hint="Use a fictional founder name other players can recognize."
      >
        <input
          className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
          defaultValue={defaultDisplayName}
          name="displayName"
          required
        />
      </FormField>
      <FormField
        label="Founder bio"
        hint="One short line is enough. You can change it later."
      >
        <textarea
          className="min-h-24 rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-base text-white outline-none focus:border-emerald-300"
          defaultValue={defaultBio}
          maxLength={240}
          name="bio"
        />
      </FormField>
      {state.error ? (
        <p
          className="rounded-md border border-rose-300/30 bg-rose-400/10 p-3 text-sm font-semibold text-rose-100"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "Saving" : "Save founder profile"}
      </Button>
    </form>
  );
}
