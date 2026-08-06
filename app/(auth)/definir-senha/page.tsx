"use client";

import { useActionState } from "react";
import Image from "next/image";
import { setInvitePassword, type SetPasswordState } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: SetPasswordState = { error: null };

/** Tela final do convite de cliente — chega aqui já autenticado (sessão
 * estabelecida por `/auth/confirm` antes do redirect), só falta escolher a
 * senha da conta que o admin já preparou. */
export default function DefinirSenhaPage() {
  const [state, action, pending] = useActionState(setInvitePassword, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <Image src="/logo-sidebar.png" alt="" width={48} height={48} className="mb-3" priority />
        <h1 className="mb-1 text-xl font-semibold text-zinc-50">Bem-vindo(a) ao PROSPECTA Finance</h1>
        <p className="mb-6 text-sm text-zinc-400">Escolha uma senha pra concluir seu cadastro.</p>

        <form action={action} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            Senha
            <PasswordInput name="password" required autoComplete="new-password" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            Confirmar senha
            <PasswordInput name="confirmPassword" required autoComplete="new-password" />
          </label>

          {state.error && <p className="text-sm text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-amber-500 px-4 py-2 font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Concluir cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
