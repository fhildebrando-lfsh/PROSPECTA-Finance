import { requireAdminProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import { formatDateBR } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = { TITULAR: "Titular", MEMBRO: "Membro", LEITURA: "Leitura" };

/**
 * §19.1 — visão de plataforma: todo usuário cadastrado, em qualquer
 * workspace, só pra quem é `isPlatformAdmin`. Junta `auth.users` (via
 * Admin API, service role) com `Profile`/`Membership`/`Workspace` (Prisma).
 */
export default async function AdminUsuariosPage() {
  await requireAdminProfile();

  const supabase = createAdminClient();
  const [{ data: authData, error }, profiles] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    prisma.profile.findMany({
      include: { memberships: { include: { workspace: true } } },
      orderBy: { createdAt: "asc" },
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
  const authUsers = authData.users;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Usuários (todos os workspaces)</h1>
        <p className="text-sm text-zinc-500">
          Visão de plataforma — só administradores veem isto. {authUsers.length} usuário(s) cadastrado(s).
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">E-mail</th>
              <th className="px-3 py-2 font-medium">Admin da plataforma</th>
              <th className="px-3 py-2 font-medium">Workspaces</th>
              <th className="px-3 py-2 font-medium">E-mail confirmado</th>
              <th className="px-3 py-2 font-medium">Cadastrado em</th>
              <th className="px-3 py-2 font-medium">Último login</th>
            </tr>
          </thead>
          <tbody>
            {authUsers.map((u) => {
              const profile = profileById.get(u.id);
              return (
                <tr key={u.id} className="border-t border-zinc-800 text-zinc-200">
                  <td className="px-3 py-2">{profile?.fullName ?? "(sem nome)"}</td>
                  <td className="px-3 py-2">{u.email ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {profile?.isPlatformAdmin ? (
                      <span className="text-amber-400">sim</span>
                    ) : (
                      <span className="text-zinc-500">não</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {profile && profile.memberships.length > 0
                      ? profile.memberships
                          .map((m) => `${m.workspace.name} (${ROLE_LABELS[m.role] ?? m.role})`)
                          .join(", ")
                      : "—"}
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
