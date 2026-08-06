"use client";

import { useActionState, useState } from "react";
import { deleteUser, type DeleteUserState } from "./actions";
import { BTN_DANGER } from "@/components/ui/buttonStyles";

const initialState: DeleteUserState = { error: null };

export function DeleteUserButton({ profileId, label }: { profileId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(deleteUser, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-red-400 hover:text-red-300">
        Excluir
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="profileId" value={profileId} />
      <input
        name="confirmation"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder={`Digite EXCLUIR (${label})`}
        autoComplete="off"
        className="w-40 rounded border border-red-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-red-500"
      />
      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex gap-1">
        <button type="submit" disabled={confirmation !== "EXCLUIR" || pending} className={`${BTN_DANGER} px-2 py-1 text-xs disabled:opacity-40`}>
          {pending ? "Excluindo…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmation("");
          }}
          className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
