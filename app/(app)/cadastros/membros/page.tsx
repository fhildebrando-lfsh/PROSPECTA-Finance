import { headers } from "next/headers";
import { requireProfile, requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateBR } from "@/lib/format";
import { isInviteExpired } from "@/lib/workspace/invite";
import { BTN_DANGER, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { inviteMember, deleteInvite } from "./actions";
import { InviteLink } from "./InviteLink";

const ROLE_LABELS: Record<string, string> = {
  TITULAR: "Titular",
  MEMBRO: "Membro",
  LEITURA: "Leitura",
  ADVISOR: "Consultor",
};

export default async function MembrosPage() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  const origin = `${protocol}://${headerList.get("host")}`;
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  const canInvite = profile.isPlatformAdmin || membership?.role === "TITULAR";

  const [members, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Membros do workspace</h2>
        <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
          <table className="w-full text-sm">
            <thead className="bg-black/20 text-left text-zinc-400">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Papel</th>
                <th className="px-3 py-2 font-medium">Desde</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-indigo-900/50 text-zinc-200">
                  <td className="px-3 py-2">{m.profile.fullName ?? "(sem nome)"}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{ROLE_LABELS[m.role] ?? m.role}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{formatDateBR(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!canInvite && (
        <p className="rounded-lg border border-indigo-900/50 bg-[#131A47] px-3 py-2 text-sm text-zinc-500">
          Só o titular do workspace (ou o administrador) pode convidar novos membros.
        </p>
      )}

      {canInvite && (
        <>
          {invites.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-zinc-300">Convites pendentes</h2>
              <div className="flex flex-col gap-2">
                {invites.map((inv) => {
                  const inviteUrl = `${origin}/convite/${inv.token}`;
                  const whatsappText = `Você foi convidado(a) para o PROSPECTA Finance! Acesse o link pra criar sua conta: ${inviteUrl}`;
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-3"
                    >
                      <div className="text-sm text-zinc-200">
                        {inv.email} <span className="text-xs text-zinc-500">· {ROLE_LABELS[inv.role] ?? inv.role}</span>
                        {isInviteExpired(inv) && (
                          <span className="ml-2 rounded-full bg-red-950 px-2 py-0.5 text-xs text-red-400">expirado</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.phone && (
                          <a
                            href={`https://wa.me/${inv.phone}?text=${encodeURIComponent(whatsappText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-emerald-800 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950"
                          >
                            Enviar por WhatsApp
                          </a>
                        )}
                        <InviteLink url={inviteUrl} />
                        <form action={deleteInvite}>
                          <input type="hidden" name="id" value={inv.id} />
                          <button type="submit" className={BTN_DANGER}>
                            Excluir
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
            <h2 className="mb-1 text-sm font-medium text-zinc-300">Convidar membro</h2>
            <p className="mb-3 text-xs text-zinc-500">
              O sistema <strong>não manda e-mail nem WhatsApp sozinho</strong> — gera um link (botão &ldquo;Copiar&rdquo;
              abaixo) e, se você informar o telefone, também um botão &ldquo;Enviar por WhatsApp&rdquo; que já abre a
              conversa com a mensagem pronta; o envio final é sempre um clique seu. Só funciona bem pra quem ainda
              não criou conta; se a pessoa já tem workspace próprio, ela continua vendo o dela por padrão (ainda não
              existe seletor de workspace).
            </p>
            <form action={inviteMember} className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                E-mail
                <input
                  type="email"
                  name="email"
                  required
                  className="w-64 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                Telefone (WhatsApp, opcional)
                <input
                  type="tel"
                  name="phone"
                  placeholder="(11) 91234-5678"
                  className="w-44 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                Papel
                <select
                  name="role"
                  defaultValue="MEMBRO"
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
                >
                  <option value="MEMBRO">Membro</option>
                  <option value="LEITURA">Leitura</option>
                  <option value="TITULAR">Titular</option>
                  <option value="ADVISOR">Consultor</option>
                </select>
              </label>
              <button type="submit" className={BTN_PRIMARY}>
                Gerar convite
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
