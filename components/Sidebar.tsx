"use client";

import { useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  List,
  PlusCircle,
  ArrowLeftRight,
  Upload,
  CalendarClock,
  Settings2,
  Wallet,
  Users,
  Tag,
  Tags,
  ListTree,
  UserCog,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { logout } from "@/app/(app)/actions";

interface IconProps {
  className?: string;
}

interface NavLeaf {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
}
interface NavGroup {
  label: string;
  icon: ComponentType<IconProps>;
  items: NavLeaf[];
}
type NavEntry = NavLeaf | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const LANCAMENTOS_ITEMS: NavLeaf[] = [
  { href: "/lancamentos", label: "Ver lançamentos", icon: List },
  { href: "/lancamentos/novo", label: "Novo lançamento", icon: PlusCircle },
  { href: "/lancamentos/transferir", label: "Transferir", icon: ArrowLeftRight },
  { href: "/lancamentos/importar", label: "Importar", icon: Upload },
];

const CADASTROS_ITEMS: NavLeaf[] = [
  { href: "/cadastros/carteiras", label: "Carteiras", icon: Wallet },
  { href: "/cadastros/responsaveis", label: "Responsáveis", icon: Users },
  { href: "/cadastros/categorias", label: "Categorias", icon: Tag },
  { href: "/cadastros/subcategorias", label: "Subcategorias", icon: Tags },
  { href: "/cadastros/tipos", label: "Tipos", icon: ListTree },
  { href: "/cadastros/membros", label: "Membros", icon: UserCog },
];

export interface SidebarProps {
  workspaceName: string;
  email: string | null | undefined;
  role: string | null;
  isPlatformAdmin: boolean;
}

export function Sidebar({ workspaceName, email, role, isPlatformAdmin }: SidebarProps) {
  const pathname = usePathname();

  const entries: NavEntry[] = [
    { href: "/painel", label: "Painel", icon: LayoutDashboard },
    { label: "Lançamentos", icon: Receipt, items: LANCAMENTOS_ITEMS },
    { href: "/compromissos", label: "Compromissos", icon: CalendarClock },
    { label: "Cadastros", icon: Settings2, items: CADASTROS_ITEMS },
  ];
  if (isPlatformAdmin) {
    entries.push({ href: "/admin/usuarios", label: "Admin", icon: ShieldCheck });
  }

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:w-64 md:flex-col md:border-r md:border-indigo-900/50 md:bg-indigo-950">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image src="/logo-sidebar.png" alt="" width={28} height={28} className="shrink-0" priority />
        <span className="text-sm font-semibold tracking-wide text-white">PROSPECTA FINANCE</span>
      </div>

      <div className="mx-4 mb-4 rounded-lg bg-indigo-900/40 px-3 py-2">
        <p className="truncate text-sm font-medium text-white">{workspaceName}</p>
        <p className="truncate text-xs text-indigo-300">
          {email}
          {role ? ` · ${role}` : ""}
          {isPlatformAdmin ? " · admin" : ""}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {entries.map((entry) =>
          isGroup(entry) ? (
            <NavGroupItem key={entry.label} entry={entry} pathname={pathname} />
          ) : (
            <NavLeafItem key={entry.href} entry={entry} active={pathname === entry.href} />
          ),
        )}
      </nav>

      <div className="border-t border-indigo-900/50 px-3 py-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-indigo-200 transition-colors hover:bg-indigo-900/50 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavLeafItem({ entry, active }: { entry: NavLeaf; active: boolean }) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-amber-500 font-medium text-zinc-950" : "text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {entry.label}
    </Link>
  );
}

function NavGroupItem({ entry, pathname }: { entry: NavGroup; pathname: string }) {
  const groupActive = entry.items.some((item) => item.href === pathname);
  const [open, setOpen] = useState(groupActive);
  const Icon = entry.icon;

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
          groupActive ? "text-white" : "text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{entry.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-indigo-800/60 pl-3">
          {entry.items.map((item) => (
            <NavLeafItem key={item.href} entry={item} active={item.href === pathname} />
          ))}
        </div>
      )}
    </div>
  );
}
