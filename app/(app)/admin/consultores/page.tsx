import { requireAdminProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import { AdvisorControl } from "@/components/AdvisorControl";

/**
 * Visão em árvore: cada consultor (`ADVISOR`) com a lista de clientes que
 * ele atende logo abaixo. Mesma ação de atribuir/trocar consultor de
 * `/admin/usuarios` (`AdvisorControl`/`assignAdvisor`), só que organizada
 * por consultor em vez de por usuário — pra dar visão de carga de trabalho
 * ("quem atende quem") de um jeito que a tabela de usuários não mostra bem.
 */
export default async function AdminConsultoresPage() {
  await requireAdminProfile();

  const supabase = createAdminClient();
  const [{ data: authData, error }, profiles, workspaces] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    prisma.profile.findMany({ orderBy: { fullName: "asc" } }),
    prisma.workspace.findMany({
      include: { memberships: { where: { status: "ACTIVE" }, include: { profile: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-zinc-100">Consultores</h1>
        <p className="text-sm text-red-400">Falha ao carregar usuários: {error.message}</p>
      </div>
    );
  }

  const emailByProfileId = new Map(authData.users.map((u) => [u.id, u.email ?? ""]));
  const nameOf = (profileId: string) => {
    const p = profiles.find((pr) => pr.id === profileId);
    return p?.fullName ?? emailByProfileId.get(profileId) ?? "(sem nome)";
  };
  const advisorOptions = profiles.map((p) => ({ id: p.id, label: `${p.fullName ?? "(sem nome)"} — ${emailByProfileId.get(p.id) ?? "?"}` }));

  // Só workspaces com titular contam como "cliente" pra essa visão.
  const clientWorkspaces = workspaces.filter((w) => w.memberships.some((m) => m.role === "TITULAR"));

  const byAdvisor = new Map<string, typeof clientWorkspaces>();
  const withoutAdvisor: typeof clientWorkspaces = [];
  for (const w of clientWorkspaces) {
    const advisor = w.memberships.find((m) => m.role === "ADVISOR");
    if (!advisor) {
      withoutAdvisor.push(w);
      continue;
    }
    const list = byAdvisor.get(advisor.profileId) ?? [];
    list.push(w);
    byAdvisor.set(advisor.profileId, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Consultores</h1>
        <p className="text-sm text-zinc-500">Quem atende quem — clique em &ldquo;trocar&rdquo; pra mudar o consultor de um cliente.</p>
      </div>

      <div className="flex flex-col gap-4">
        {[...byAdvisor.entries()].map(([advisorId, clients]) => (
          <div key={advisorId} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <div className="mb-3 text-sm font-semibold text-amber-400">
              {nameOf(advisorId)} <span className="font-normal text-zinc-500">· {clients.length} cliente(s)</span>
            </div>
            <ul className="flex flex-col gap-2 border-l border-indigo-800/60 pl-4">
              {clients.map((w) => {
                const titular = w.memberships.find((m) => m.role === "TITULAR");
                const options = advisorOptions.filter((o) => o.id !== titular?.profileId);
                return (
                  <li key={w.id} className="flex flex-col gap-0.5 text-sm text-zinc-200">
                    <span>{w.name}</span>
                    <span className="text-xs text-zinc-500">
                      <AdvisorControl workspaceId={w.id} currentAdvisorLabel={nameOf(advisorId)} options={options} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {byAdvisor.size === 0 && (
          <p className="rounded-xl border border-indigo-900/50 bg-[#131A47] px-4 py-3 text-sm text-zinc-500">
            Nenhum consultor com cliente atribuído ainda.
          </p>
        )}
      </div>

      {withoutAdvisor.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 text-sm font-semibold text-zinc-300">
            Sem consultor atribuído <span className="font-normal text-zinc-500">· {withoutAdvisor.length} cliente(s)</span>
          </div>
          <ul className="flex flex-col gap-2 border-l border-zinc-700 pl-4">
            {withoutAdvisor.map((w) => {
              const titular = w.memberships.find((m) => m.role === "TITULAR");
              const options = advisorOptions.filter((o) => o.id !== titular?.profileId);
              return (
                <li key={w.id} className="flex flex-col gap-0.5 text-sm text-zinc-200">
                  <span>{w.name}</span>
                  <span className="text-xs text-zinc-500">
                    <AdvisorControl workspaceId={w.id} currentAdvisorLabel={null} options={options} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
