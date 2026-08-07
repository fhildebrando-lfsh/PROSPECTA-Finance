import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { AcceptPolicyForm } from "./AcceptPolicyForm";

/**
 * Trava de entrada no app pra quem nunca aceitou a Política de Privacidade
 * — pega login com Google (não passa pelo checkbox do cadastro por e-mail) e
 * contas antigas de antes desse campo existir. Ver `requireActiveMembership()`.
 */
export default async function AceitarPoliticaPage() {
  const profile = await requireProfile();
  if (profile.privacyPolicyAcceptedAt) redirect("/painel");

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <Image src="/logo-sidebar.png" alt="" width={48} height={48} className="mb-3" priority />
        <h1 className="mb-1 text-xl font-semibold text-zinc-50">Antes de continuar</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Atualizamos como explicamos o tratamento dos seus dados pessoais, conforme a LGPD (Lei nº 13.709/2018).
          Precisamos que você confirme que leu e concorda antes de acessar sua conta.
        </p>

        <p className="mb-4 text-sm text-zinc-300">
          <Link href="/politica-privacidade" target="_blank" className="text-indigo-300 underline hover:text-white">
            Ler a Política de Privacidade completa →
          </Link>
        </p>

        <AcceptPolicyForm />
      </div>
    </div>
  );
}
