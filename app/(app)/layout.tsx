import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { logout } from "./actions";

const NAV_ITEMS = [
  { href: "/painel", label: "Painel" },
  { href: "/lancamentos", label: "Lançamentos" },
  { href: "/cadastros", label: "Cadastros" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const primaryMembership = profile.memberships[0];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-medium text-zinc-100">
              {primaryMembership?.workspace.name ?? "Sem workspace"}
            </p>
            <p className="text-xs text-zinc-500">
              {profile.email}
              {primaryMembership ? ` · ${primaryMembership.role}` : ""}
              {profile.isPlatformAdmin ? " · admin" : ""}
            </p>
          </div>
          <nav className="flex gap-4">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-zinc-400 hover:text-zinc-100">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-200">
            Sair
          </button>
        </form>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>

      {/* §12 — botão flutuante "+", acesso de 1 toque ao lançamento rápido em qualquer tela. */}
      <Link
        href="/lancamentos/novo"
        aria-label="Novo lançamento"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-3xl font-light text-zinc-950 shadow-lg shadow-black/40 hover:bg-amber-400"
      >
        +
      </Link>
    </div>
  );
}
