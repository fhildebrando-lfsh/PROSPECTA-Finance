"use client";

import { useActionState, useState } from "react";
import { deleteMyAccount, type DeleteAccountState } from "./actions";
import { BTN_DANGER } from "@/components/ui/buttonStyles";

const initialState: DeleteAccountState = { error: null };

export function DeleteAccountForm({ ownedWorkspaceNames }: { ownedWorkspaceNames: string[] }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(deleteMyAccount, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={BTN_DANGER}>
        Excluir minha conta
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-900/60 bg-red-950/20 p-4">
      <p className="text-sm text-red-300">
        Isso apaga permanentemente sua conta e login.
        {ownedWorkspaceNames.length > 0 && (
          <>
            {" "}
            Como você é titular de <strong>{ownedWorkspaceNames.join(", ")}</strong>, todos os lançamentos, carteiras
            e dados desse(s) workspace(s) também serão apagados pra sempre — não tem como desfazer.
          </>
        )}
      </p>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Digite <strong>EXCLUIR</strong> pra confirmar
          <input
            name="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            className="w-48 rounded-lg border border-red-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-red-500"
          />
        </label>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={confirmation !== "EXCLUIR" || pending} className={`${BTN_DANGER} disabled:opacity-40`}>
            {pending ? "Excluindo…" : "Confirmar exclusão definitiva"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmation("");
            }}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
