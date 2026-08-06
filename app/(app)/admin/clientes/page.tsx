import Link from "next/link";
import { requireAdminProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import { isInviteExpired } from "@/lib/workspace/invite";
import { formatDateBR } from "@/lib/format";
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { createClient, cancelClient, resendInvite } from "./actions";

/**
 * Fase 2 Etapa 4 (ARQUITETURA-IDENTIDADE-PLANOS.md §12) — admin cria o
 * pré-cadastro de um cliente novo (workspace + assinatura + convite, com
 * consultor opcional já atribuído como ADVISOR). Só platform admin, mesmo
 * gate de `/admin/usuarios`. O convite é enviado por e-mail de verdade
 * (2026-08-05) — não é mais um link pra copiar manualmente.
 */
export default async function AdminClientesPage() {
  await requireAdminProfile();

  const supabase = createAdminClient();
  const [{ data: authData, error }, plans, profiles, pendingClients] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceCents: "asc" } }),
    prisma.profile.findMany({ orderBy: { fullName: "asc" } }),
    prisma.workspaceInvite.findMany({
      where: { role: "TITULAR", acceptedAt: null, workspace: { memberships: { none: { role: "TITULAR" } } } },
      include: {
        workspace: {
          include: {
            memberships: { where: { role: "ADVISOR" }, include: { profile: true } },
            subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-zinc-100">Clientes (pré-cadastro)</h1>
        <p className="text-sm text-red-400">Falha ao carregar usuários: {error.message}</p>
      </div>
    );
  }

  const emailByProfileId = new Map(authData.users.map((u) => [u.id, u.email ?? ""]));
  const advisorOptions = profiles.map((p) => ({
    id: p.id,
    label: `${p.fullName ?? "(sem nome)"} — ${emailByProfileId.get(p.id) ?? "?"}`,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Clientes (pré-cadastro)</h1>
          <p className="text-sm text-zinc-500">Cria o workspace, a assinatura e manda o convite por e-mail pro cliente.</p>
        </div>
        <Link href="/admin/usuarios" className="text-sm text-indigo-300 hover:text-white">
          Ver todos os usuários →
        </Link>
      </div>

      {pendingClients.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Pré-cadastros aguardando o cliente concluir</h2>
          <div className="flex flex-col gap-2">
            {pendingClients.map((inv) => {
              const plan = inv.workspace.subscriptions[0]?.plan;
              const advisor = inv.workspace.memberships[0]?.profile;
              const advisorLabel = advisor ? (advisor.fullName ?? emailByProfileId.get(advisor.id) ?? "(sem nome)") : null;
              const expired = isInviteExpired(inv);
              return (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-3"
                >
                  <div className="text-sm text-zinc-200">
                    <div>
                      {inv.workspace.name.replace(/ \(cliente\)$/, "")} <span className="text-xs text-zinc-500">· {inv.email}</span>
                      {expired && <span className="ml-2 rounded-full bg-red-950 px-2 py-0.5 text-xs text-red-400">expirado</span>}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Plano: {plan?.name ?? "—"} · Consultor: {advisorLabel ?? "nenhum atribuído"} · Criado em{" "}
                      {formatDateBR(inv.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={resendInvite}>
                      <input type="hidden" name="workspaceId" value={inv.workspaceId} />
                      <button type="submit" className={BTN_SECONDARY}>
                        Reenviar convite
                      </button>
                    </form>
                    <form action={cancelClient}>
                      <input type="hidden" name="workspaceId" value={inv.workspaceId} />
                      <button type="submit" className={BTN_DANGER}>
                        Cancelar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-1 text-sm font-medium text-zinc-300">Criar cliente</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Gera o workspace do cliente, a assinatura no plano escolhido (sem cobrança real ainda) e manda um e-mail de
          convite de verdade, com um link que já leva direto pra tela de definir senha. Se não chegar, use
          &ldquo;Reenviar convite&rdquo; na lista abaixo.
        </p>
        <form action={createClient} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome do cliente
            <input
              type="text"
              name="clientName"
              required
              className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            E-mail
            <input
              type="email"
              name="clientEmail"
              required
              className="w-64 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Plano
            <select name="planId" required className="w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Consultor responsável (opcional)
            <select
              name="advisorProfileId"
              defaultValue=""
              className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            >
              <option value="">— atribuir depois —</option>
              {advisorOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Criar pré-cadastro
          </button>
        </form>
      </div>
    </div>
  );
}
