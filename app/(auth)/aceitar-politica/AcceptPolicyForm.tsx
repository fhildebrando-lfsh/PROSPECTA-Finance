"use client";

import { useActionState } from "react";
import { acceptPrivacyPolicy, type AcceptPolicyState } from "./actions";

const initialState: AcceptPolicyState = { error: null };

export function AcceptPolicyForm() {
  const [state, action, pending] = useActionState(acceptPrivacyPolicy, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex items-start gap-2 text-sm text-zinc-300">
        <input type="checkbox" name="acceptPrivacyPolicy" required className="mt-0.5" />
        <span>Li e aceito a Política de Privacidade.</span>
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Aguarde…" : "Continuar"}
      </button>
    </form>
  );
}
