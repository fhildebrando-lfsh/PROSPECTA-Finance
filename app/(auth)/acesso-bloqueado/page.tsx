import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { ACTIVE_WORKSPACE_COOKIE, requireProfile, resolveActiveMembership } from "@/lib/auth/session";
import { setActiveWorkspace } from "@/lib/workspace/switch";
import { logout } from "@/app/(app)/actions";
import { BLOCK_REASON_MESSAGES } from "@/lib/workspace/block-reasons";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";

const ROLE_LABELS: Record<string, string> = {
  TITULAR: "Titular",
  MEMBRO: "Membro",
  LEITURA: "Leitura",
  ADVISOR: "Consultor",
};

/**
 * Trava de entrada pra quem acessa um workspace bloqueado (ver
 * `lib/workspace/block.ts` e `requireActiveMembership()`) — mesmo esqueleto de
 * `/aceitar-politica`. Resolve a MESMA membership que `requireActiveMembership()`
 * resolveu pra saber qual workspace está bloqueado e por quê.
 */
export default async function AcessoBloqueadoPage() {
  const profile = await requireProfile();

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const membership = resolveActiveMembership(profile.memberships, requested);

  // Guarda reversa — sem isso, dava pra acessar esta URL à toa mesmo sem estar
  // bloqueado (mesmo padrão de /aceitar-politica).
  if (!membership || !membership.workspace.blockedAt) redirect("/painel");

  const { workspace } = membership;
  const reason = workspace.blockedReason;
  const message =
    reason === "OUTRO"
      ? (workspace.blockedDetail ?? "Seu acesso foi pausado. Entre em contato com o administrador do sistema.")
      : reason
        ? BLOCK_REASON_MESSAGES[reason]
        : "Seu acesso foi pausado. Entre em contato com o administrador do sistema.";

  // Escape hatch — alguém com acesso a outros workspaces (ex.: um consultor com vários
  // clientes, só um deles bloqueado) não deve ficar preso aqui sem conseguir trocar.
  const otherOptions = profile.memberships
    .filter((m) => m.status === "ACTIVE" && m.workspaceId !== membership.workspaceId && !m.workspace.blockedAt)
    .map((m) => ({ workspaceId: m.workspaceId, label: `${m.workspace.name} (${ROLE_LABELS[m.role] ?? m.role})` }));

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <Image src="/logo-sidebar.png" alt="" width={48} height={48} className="mb-3" priority />
        <h1 className="mb-1 text-xl font-semibold text-zinc-50">Acesso pausado</h1>
        <p className="mb-6 text-sm text-zinc-400">{message}</p>

        {reason === "FATURA_EM_ABERTO" && (
          <div className="mb-6">
            <button type="button" disabled className={`${BTN_PRIMARY} w-full disabled:opacity-50`}>
              Atualizar pagamento
            </button>
            <p className="mt-1.5 text-xs text-zinc-500">Em breve — por enquanto, fale com a nossa equipe.</p>
          </div>
        )}

        <p className="mb-6 text-sm text-zinc-300">
          Prefere falar direto com a gente?{" "}
          <a href="mailto:admin@prospectafinance.com.br" className="text-indigo-300 underline hover:text-white">
            admin@prospectafinance.com.br
          </a>
        </p>

        {otherOptions.length > 0 && (
          <div className="mb-6 border-t border-zinc-800 pt-4">
            <p className="mb-2 text-xs text-zinc-500">Você também tem acesso a:</p>
            <div className="flex flex-col gap-1.5">
              {otherOptions.map((o) => (
                <form key={o.workspaceId} action={setActiveWorkspace}>
                  <input type="hidden" name="workspaceId" value={o.workspaceId} />
                  <button type="submit" className="text-sm text-indigo-300 underline hover:text-white">
                    {o.label} →
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        <form action={logout}>
          <button type="submit" className={BTN_GHOST}>
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
