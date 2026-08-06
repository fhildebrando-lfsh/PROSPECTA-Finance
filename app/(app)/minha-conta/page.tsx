import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { setActiveWorkspace } from "@/lib/workspace/switch";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { DeleteAccountForm } from "./DeleteAccountForm";

const ROLE_LABELS: Record<string, string> = {
  TITULAR: "Titular",
  MEMBRO: "Membro",
  LEITURA: "Leitura",
  ADVISOR: "Consultor",
};

export default async function MinhaContaPage() {
  const profile = await requireProfile();

  const ownedMemberships = profile.memberships.filter((m) => m.role === "TITULAR" && m.status === "ACTIVE");
  const soleOwnerWorkspaces: string[] = [];
  for (const m of ownedMemberships) {
    const otherOwner = await prisma.membership.findFirst({
      where: { workspaceId: m.workspaceId, role: "TITULAR", status: "ACTIVE", profileId: { not: profile.id } },
    });
    if (!otherOwner) soleOwnerWorkspaces.push(m.workspace.name);
  }

  const advisorMemberships = profile.memberships.filter((m) => m.role === "ADVISOR" && m.status === "ACTIVE");

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Minha conta</h1>
        <p className="text-sm text-zinc-500">{profile.email}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Seus workspaces</h2>
        <div className="flex flex-col gap-2">
          {profile.memberships.map((m) => (
            <div key={m.id} className="rounded-lg border border-indigo-900/50 bg-[#131A47] px-3 py-2 text-sm text-zinc-200">
              {m.workspace.name} <span className="text-xs text-zinc-500">· {ROLE_LABELS[m.role] ?? m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {advisorMemberships.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Meus clientes</h2>
          <p className="mb-3 text-xs text-zinc-500">
            Entrar num cliente troca seu workspace ativo — você passa a ver e editar os dados dele, igual se fosse a
            própria pessoa. O acesso fica registrado (auditoria).
          </p>
          <div className="flex flex-col gap-2">
            {advisorMemberships.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-indigo-900/50 bg-[#131A47] px-3 py-2"
              >
                <span className="text-sm text-zinc-200">{m.workspace.name.replace(/ \(cliente\)$/, "")}</span>
                <form action={setActiveWorkspace}>
                  <input type="hidden" name="workspaceId" value={m.workspaceId} />
                  <button type="submit" className={BTN_SECONDARY}>
                    Entrar como consultor
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Zona de risco</h2>
        <DeleteAccountForm ownedWorkspaceNames={soleOwnerWorkspaces} />
      </div>
    </div>
  );
}
