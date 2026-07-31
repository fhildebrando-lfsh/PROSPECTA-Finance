"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, CalendarClock, Settings2, ShieldCheck } from "lucide-react";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/painel": LayoutDashboard,
  "/lancamentos": Receipt,
  "/compromissos": CalendarClock,
  "/cadastros": Settings2,
  "/admin/usuarios": ShieldCheck,
};

export interface MobileNavItem {
  href: string;
  label: string;
}

export function MobileNav({ items }: { items: MobileNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-indigo-900/50 bg-indigo-950/95 backdrop-blur md:hidden">
      {items.map((item) => {
        const Icon = ICONS[item.href] ?? LayoutDashboard;
        const active = pathname === item.href || (item.href !== "/painel" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
              active ? "text-amber-400" : "text-indigo-300 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
