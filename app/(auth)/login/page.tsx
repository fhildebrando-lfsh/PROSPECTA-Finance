"use client";

import { Suspense, useActionState, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { login, signup, requestPasswordReset, type AuthActionState } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";
import { InstallPrompt } from "@/components/InstallPrompt";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const initialState: AuthActionState = { error: null, info: null };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

/** Só existe pra isolar `useSearchParams()` — precisa de um Suspense boundary
 * pra não desabilitar a geração estática desta página (§ build Vercel). */
function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "";
  const [mode, setMode] = useState<"login" | "signup" | "recover">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);
  const [recoverState, recoverAction, recoverPending] = useActionState(requestPasswordReset, initialState);

  if (mode === "recover") {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <Image src="/logo-sidebar.png" alt="" width={48} height={48} className="mb-3" priority />
          <h1 className="mb-1 text-xl font-semibold text-zinc-50">Redefinir senha</h1>
          <p className="mb-6 text-sm text-zinc-400">Informe seu e-mail pra receber o link de redefinição.</p>

          <form action={recoverAction} className="flex flex-col gap-4">
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

            {recoverState.error && <p className="text-sm text-red-400">{recoverState.error}</p>}
            {recoverState.info && <p className="text-sm text-emerald-400">{recoverState.info}</p>}

            <button
              type="submit"
              disabled={recoverPending}
              className="mt-2 rounded-lg bg-amber-500 px-4 py-2 font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
            >
              {recoverPending ? "Aguarde…" : "Enviar link"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode("login")}
            className="mt-4 w-full text-center text-sm text-zinc-400 hover:text-zinc-200"
          >
            Voltar pro login
          </button>
        </div>
      </div>
    );
  }

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;
  const action = mode === "login" ? loginAction : signupAction;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <InstallPrompt />
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <Image src="/logo-sidebar.png" alt="" width={48} height={48} className="mb-3" priority />
        <h1 className="mb-1 text-xl font-semibold text-zinc-50">PROSPECTA Finance</h1>
        <p className="mb-6 text-sm text-zinc-400">
          {mode === "login" ? "Entre com sua conta." : "Crie sua conta."}
        </p>

        <GoogleSignInButton />

        <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
          <div className="h-px flex-1 bg-zinc-800" />
          ou
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form action={action} className="flex flex-col gap-4">
          {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
          {mode === "signup" && (
            <label className="flex flex-col gap-1 text-sm text-zinc-300">
              Nome completo
              <input
                type="text"
                name="fullName"
                required
                autoComplete="name"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-amber-500"
              />
            </label>
          )}
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
            <PasswordInput name="password" required autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>

          {mode === "signup" && (
            <label className="flex flex-col gap-1 text-sm text-zinc-300">
              Confirmar senha
              <PasswordInput name="confirmPassword" required autoComplete="new-password" />
            </label>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("recover")}
              className="-mt-2 self-end text-xs text-zinc-500 hover:text-zinc-300"
            >
              Esqueci minha senha
            </button>
          )}

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
