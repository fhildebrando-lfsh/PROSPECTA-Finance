import Link from "next/link";

const TABS = [
  { key: "lista", href: "/compromissos", label: "Lista" },
  { key: "calendario", href: "/compromissos/calendario", label: "Calendário" },
  { key: "incidentes", href: "/compromissos/incidentes", label: "Incidentes" },
] as const;

export function CompromissosTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="flex gap-2 text-sm">
      {TABS.map((tab) =>
        tab.key === active ? (
          <span key={tab.key} className="rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-zinc-950">
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.key}
            href={tab.href}
            className="rounded-lg px-3 py-1.5 text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
          >
            {tab.label}
          </Link>
        ),
      )}
    </div>
  );
}
