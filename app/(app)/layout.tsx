import Image from "next/image";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { logout } from "./actions";

const NAV_ITEMS = [
  { href: "/painel", label: "Painel" },
  { href: "/lancamentos", label: "Lançamentos" },
  { href: "/compromissos", label: "Compromissos" },
  { href: "/cadastros", label: "Cadastros" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const primaryMembership = profile.memberships[0];
  const mobileNavItems = profile.isPlatformAdmin
    ? [...NAV_ITEMS, { href: "/admin/usuarios", label: "Admin" }]
    : NAV_ITEMS;

  return (
    <div className="flex min-h-screen">
      {/* Navegação principal em desktop/tablet — no celular ela vira a barra inferior (§21). */}
      <Sidebar
        workspaceName={primaryMembership?.workspace.name ?? "Sem workspace"}
        email={profile.email}
        role={primaryMembership?.role ?? null}
        isPlatformAdmin={profile.isPlatformAdmin}
      />

      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <header className="flex items-center justify-between border-b border-indigo-900/50 bg-indigo-950 px-4 py-4 sm:px-6 md:hidden">
          <div className="flex items-center gap-2">
            <Image src="/logo-sidebar.png" alt="" width={28} height={28} className="shrink-0" priority />
            <div>
              <p className="text-sm font-medium text-white">
                {primaryMembership?.workspace.name ?? "Sem workspace"}
              </p>
              <p className="text-xs text-indigo-300">
                {profile.email}
                {primaryMembership ? ` · ${primaryMembership.role}` : ""}
                {profile.isPlatformAdmin ? " · admin" : ""}
              </p>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="text-sm text-indigo-200 hover:text-white">
              Sair
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">{children}</main>

        {/* §12 — botão flutuante "+", acesso de 1 toque ao lançamento rápido em qualquer tela. */}
        <Link
          href="/lancamentos/novo"
          aria-label="Novo lançamento"
          className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-3xl font-light text-zinc-950 shadow-lg shadow-black/40 hover:bg-amber-400 sm:right-6 md:bottom-6"
        >
          +
        </Link>

        {/* §21 — navegação inferior, só no celular (<768px), mesma linguagem visual do Sidebar. */}
        <MobileNav items={mobileNavItems} />
      </div>
    </div>
  );
}
