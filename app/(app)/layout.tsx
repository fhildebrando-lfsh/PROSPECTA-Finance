import Image from "next/image";
import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatClientCode, firstTwoNames } from "@/lib/format";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, membership: activeMembership } = await requireActiveMembership();
  // Só memberships ACTIVE são exibidas — uma REVOKED (ex.: consultor trocado, ver
  // lib/workspace/advisor.ts::assignAdvisor) nunca deve aparecer como opção
  // selecionável no seletor de workspace; escolhê-la seria rejeitado do mesmo jeito
  // por setActiveWorkspace(), só que como um erro genérico em vez de nem aparecer.
  const activeMemberships = profile.memberships.filter((m) => m.status === "ACTIVE");

  // Para as memberships ADVISOR (workspace de cliente), o seletor identifica o
  // cliente pelo código do workspace + nome do titular, não pelo nome do
  // workspace em si — mais preciso para o consultor diferenciar clientes com
  // nomes parecidos, ex.: "0001, Fulano de Tal (cliente)".
  const advisorWorkspaceIds = activeMemberships.filter((m) => m.role === "ADVISOR").map((m) => m.workspaceId);
  const titularMemberships =
    advisorWorkspaceIds.length > 0
      ? await prisma.membership.findMany({
          where: { workspaceId: { in: advisorWorkspaceIds }, role: "TITULAR", status: "ACTIVE" },
          include: { profile: true },
        })
      : [];
  const titularNameByWorkspaceId = new Map(titularMemberships.map((t) => [t.workspaceId, t.profile.fullName]));

  const membershipOptions = activeMemberships.map((m) => {
    if (m.role === "ADVISOR") {
      const shortName = firstTwoNames(titularNameByWorkspaceId.get(m.workspaceId) ?? null) ?? m.workspace.name;
      return {
        workspaceId: m.workspaceId,
        workspaceName: `${formatClientCode(m.workspace.clientCode)}, ${shortName} (cliente)`,
        role: m.role,
      };
    }
    return { workspaceId: m.workspaceId, workspaceName: m.workspace.name, role: m.role };
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Mesmo menu em desktop e mobile — no celular vira um drawer aberto pelo botão hambúrguer do header. */}
        <Sidebar
          memberships={membershipOptions}
          currentWorkspaceId={activeMembership.workspaceId}
          email={profile.email}
          isPlatformAdmin={profile.isPlatformAdmin}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64">
          <header className="flex items-center justify-between border-b border-indigo-900/50 bg-[#131A47] px-4 py-4 sm:px-6 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <MobileMenuButton />
              <Image src="/logo-sidebar.png" alt="" width={28} height={28} className="shrink-0" priority />
              <WorkspaceSwitcher
                memberships={membershipOptions}
                currentWorkspaceId={activeMembership.workspaceId}
                email={profile.email}
                isPlatformAdmin={profile.isPlatformAdmin}
              />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link href="/minha-conta" className="text-sm text-indigo-200 hover:text-white">
                Minha conta
              </Link>
              <form action={logout}>
                <button type="submit" className="text-sm text-indigo-200 hover:text-white">
                  Sair
                </button>
              </form>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 pb-8 sm:px-6 sm:py-8">{children}</main>

          {/* §12 — botão flutuante "+", acesso de 1 toque ao lançamento rápido em qualquer tela. */}
          <Link
            href="/lancamentos/novo"
            aria-label="Novo lançamento"
            className="fixed bottom-6 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-3xl font-light text-zinc-950 shadow-lg shadow-black/40 hover:bg-amber-400 sm:right-6"
          >
            +
          </Link>
        </div>
      </div>
    </SidebarProvider>
  );
}
