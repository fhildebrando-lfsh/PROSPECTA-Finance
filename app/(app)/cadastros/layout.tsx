import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";

const TABS = [
  { href: "/cadastros/carteiras", label: "Carteiras" },
  { href: "/cadastros/responsaveis", label: "Responsáveis" },
  { href: "/cadastros/categorias", label: "Categorias" },
  { href: "/cadastros/subcategorias", label: "Subcategorias" },
  { href: "/cadastros/tipos", label: "Tipos" },
  { href: "/cadastros/membros", label: "Membros" },
];

export default async function CadastrosLayout({ children }: { children: React.ReactNode }) {
  // §20 — as abas ficam visíveis a todo mundo; cada página decide o que
  // desabilitar para quem não é admin (campo travado aparece visível e
  // desabilitado, com o motivo ao lado — nunca escondido).
  await requireProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Cadastros</h1>
      </div>
      <nav className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
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
