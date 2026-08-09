import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";

const TABS = [
  { href: "/cartoes", label: "Meus Cartões" },
  { href: "/cartoes/analise", label: "Análise de Benefícios" },
];

export default async function CartoesLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Cartões de Crédito</h1>
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
