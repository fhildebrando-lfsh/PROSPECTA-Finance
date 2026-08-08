import Link from "next/link";
import { requireAdminProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import { formatClientCode, formatDateBR } from "@/lib/format";
import { DeleteUserButton } from "./DeleteUserButton";
import { AdvisorControl } from "@/components/AdvisorControl";
import { PlatformAdminToggle } from "./PlatformAdminToggle";

const ROLE_LABELS: Record<string, string> = {
  TITULAR: "Titular",
  MEMBRO: "Membro",
  LEITURA: "Leitura",
  ADVISOR: "Consultor",
};

/**
 * §19.1 — visão de plataforma: todo usuário cadastrado, em qualquer
 * workspace, só para quem é `isPlatformAdmin`. Junta `auth.users` (via
 * Admin API, service role) com `Profile`/`Membership`/`Workspace` (Prisma).
 *
 * Também é daqui que o admin atribui/troca o consultor de qualquer
 * workspace com titular (não só os criados via `/admin/clientes` — um
 * workspace pessoal comum pode virar cliente de consultoria a qualquer
 * momento) e promove/remove outros administradores da plataforma.
 */
export default async function AdminUsuariosPage() {
  const admin = await requireAdminProfile();

  const supabase = createAdminClient();
  const [{ data: authData, error }, profiles, workspaces] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    prisma.profile.findMany({
      include: { memberships: { include: { workspace: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspace.findMany({
      include: { memberships: { where: { status: "ACTIVE" }, include: { profile: true } } },
    }),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-zinc-100">Usuários (todos os workspaces)</h1>
        <p className="text-sm text-red-400">Falha ao listar usuários: {error.message}</p>
      </div>
    );
  }

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const emailByProfileId = new Map(authData.users.map((u) => [u.id, u.email ?? ""]));
  const authUsers = authData.users;

  const workspaceById = new Map(workspaces.map((w) => [w.id, w]));
  const advisorOptions = profiles.map((p) => ({
    id: p.id,
    label: `${p.fullName ?? "(sem nome)"} — ${emailByProfileId.get(p.id) ?? "?"}`,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Usuários (todos os workspaces)</h1>
          <p className="text-sm text-zinc-500">
            Visão de plataforma — só administradores veem isto. {authUsers.length} usuário(s) cadastrado(s).
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/consultores" className="text-sm text-indigo-300 hover:text-white">
            Ver por consultor →
          </Link>
          <Link href="/admin/clientes" className="text-sm text-indigo-300 hover:text-white">
            Criar cliente (pré-cadastro) →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">E-mail</th>
              <th className="px-3 py-2 font-medium">Admin da plataforma</th>
              <th className="px-3 py-2 font-medium">Workspaces</th>
              <th className="px-3 py-2 font-medium">E-mail confirmado</th>
              <th className="px-3 py-2 font-medium">Cadastrado em</th>
              <th className="px-3 py-2 font-medium">Último login</th>
              <th className="px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {authUsers.map((u) => {
              const profile = profileById.get(u.id);
              const label = u.email ?? profile?.fullName ?? "usuário";
              // Código do próprio workspace (o que a pessoa é TITULAR) — todo
              // profile real tem exatamente um, criado junto com o cadastro.
              const ownWorkspaceCode = profile?.memberships.find((m) => m.role === "TITULAR")?.workspace.clientCode;
              return (
                <tr key={u.id} className="border-t border-zinc-800 text-zinc-200">
                  <td className="px-3 py-2 font-mono text-xs text-zinc-400">
                    {ownWorkspaceCode != null ? formatClientCode(ownWorkspaceCode) : "—"}
                  </td>
                  <td className="px-3 py-2">{profile?.fullName ?? "(sem nome)"}</td>
                  <td className="px-3 py-2">{u.email ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {profile?.isPlatformAdmin ? (
                      <span className="text-amber-400">sim</span>
                    ) : (
                      <span className="text-zinc-500">não</span>
                    )}
                    {profile && u.id !== admin.id && (
                      <div className="mt-1">
                        <PlatformAdminToggle profileId={profile.id} isAdmin={profile.isPlatformAdmin} label={label} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {profile && profile.memberships.length > 0 ? (
                      <ul className="flex flex-col gap-1.5">
                        {profile.memberships.map((m) => {
                          if (m.role !== "TITULAR") {
                            return (
                              <li key={m.id}>
                                {m.workspace.name} ({ROLE_LABELS[m.role] ?? m.role})
                              </li>
                            );
                          }
                          const workspace = workspaceById.get(m.workspaceId);
                          const currentAdvisor = workspace?.memberships.find((wm) => wm.role === "ADVISOR");
                          const currentAdvisorLabel = currentAdvisor
                            ? (currentAdvisor.profile.fullName ?? emailByProfileId.get(currentAdvisor.profileId) ?? "(sem nome)")
                            : null;
                          const options = advisorOptions.filter((o) => o.id !== m.profileId);
                          return (
                            <li key={m.id} className="flex flex-col gap-0.5">
                              <span>
                                {m.workspace.name} ({ROLE_LABELS[m.role] ?? m.role})
                              </span>
                              <AdvisorControl
                                workspaceId={m.workspaceId}
                                currentAdvisorLabel={currentAdvisorLabel}
                                options={options}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {u.email_confirmed_at ? (
                      <span className="text-emerald-400">sim</span>
                    ) : (
                      <span className="text-red-400">não</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {u.created_at ? formatDateBR(new Date(u.created_at)) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {u.last_sign_in_at ? formatDateBR(new Date(u.last_sign_in_at)) : "nunca"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/usuarios/${u.id}`} className="text-xs text-indigo-300 hover:text-white">
                        Editar dados
                      </Link>
                      {u.id !== admin.id && <DeleteUserButton profileId={u.id} label={label} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {authUsers.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhum usuário cadastrado.</p>}
      </div>
    </div>
  );
}
