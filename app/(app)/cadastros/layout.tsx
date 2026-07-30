import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";

const TABS = [
  { href: "/cadastros/carteiras", label: "Carteiras", adminOnly: false },
  { href: "/cadastros/responsaveis", label: "Responsáveis", adminOnly: false },
  { href: "/cadastros/categorias", label: "Categorias", adminOnly: true },
  { href: "/cadastros/subcategorias", label: "Subcategorias", adminOnly: true },
  { href: "/cadastros/tipos", label: "Tipos", adminOnly: true },
];

export default async function CadastrosLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const tabs = TABS.filter((tab) => !tab.adminOnly || profile.isPlatformAdmin);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Cadastros</h1>
      </div>
      <nav className="flex gap-1 border-b border-zinc-800">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-t-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
