import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";

const TABS = [
  { href: "/relatorios/balanco-anual", label: "Balanço anual" },
  { href: "/relatorios/fluxo-projetado", label: "Fluxo projetado" },
  { href: "/relatorios/parceladas", label: "Despesas parceladas" },
  { href: "/relatorios/orcamento", label: "Orçamento" },
];

export default async function RelatoriosLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Relatórios</h1>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-zinc-800">
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
