"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null, info: null };

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;
  const action = mode === "login" ? loginAction : signupAction;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-1 text-xl font-semibold text-zinc-50">Sistema Financeiro</h1>
        <p className="mb-6 text-sm text-zinc-400">
          {mode === "login" ? "Entre com sua conta." : "Crie sua conta."}
        </p>

        <form action={action} className="flex flex-col gap-4">
          {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            E-mail
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            Senha
            <input
              type="password"
              name="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-amber-500"
            />
          </label>

          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
          {state.info && <p className="text-sm text-emerald-400">{state.info}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-amber-500 px-4 py-2 font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-zinc-400 hover:text-zinc-200"
        >
          {mode === "login" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
