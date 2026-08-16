import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";

const TABS = [
  { href: "/patrimonio/bens", label: "Bens" },
  { href: "/patrimonio/metas", label: "Metas" },
  { href: "/patrimonio/dividas", label: "Dívidas" },
  { href: "/patrimonio/funcao", label: "Função do Patrimônio" },
];

export default async function PatrimonioLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Patrimônio</h1>
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
