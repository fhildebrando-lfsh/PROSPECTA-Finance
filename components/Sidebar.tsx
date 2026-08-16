"use client";

import { useEffect, useState, type ComponentType } from "react";
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
  Calendar,
  Settings2,
  Wallet,
  Users,
  Tag,
  Tags,
  ListTree,
  UserCog,
  ShieldCheck,
  UserPlus,
  UserCircle,
  Network,
  LogOut,
  ChevronDown,
  X,
  BarChart3,
  TrendingUp,
  Layers,
  PiggyBank,
  Landmark,
  Boxes,
  Target,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  LineChart,
  Ruler,
  HeartPulse,
  CandlestickChart,
  PieChart,
  Sparkles,
  Compass,
  ShieldAlert,
  IdCard,
  Umbrella,
  HandCoins,
  SlidersHorizontal,
} from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { WorkspaceSwitcher, type WorkspaceOption } from "@/components/WorkspaceSwitcher";
import { useSidebar } from "@/components/SidebarContext";

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

const COMPROMISSOS_ITEMS: NavLeaf[] = [
  { href: "/compromissos", label: "Lista", icon: List },
  { href: "/compromissos/calendario", label: "Calendário", icon: Calendar },
  { href: "/compromissos/incidentes", label: "Incidentes", icon: AlertTriangle },
];

const ADMIN_ITEMS: NavLeaf[] = [
  { href: "/admin/usuarios", label: "Usuários", icon: ShieldCheck },
  { href: "/admin/clientes", label: "Clientes", icon: UserPlus },
  { href: "/admin/consultores", label: "Consultores", icon: Network },
  { href: "/admin/planos", label: "Planos", icon: Tags },
  { href: "/admin/metodologia", label: "Metodologia", icon: SlidersHorizontal },
];

const CARTOES_ITEMS: NavLeaf[] = [
  { href: "/cartoes", label: "Meus Cartões", icon: CreditCard },
  { href: "/cartoes/analise", label: "Análise de Benefícios", icon: LineChart },
];

const RELATORIOS_ITEMS: NavLeaf[] = [
  { href: "/relatorios/balanco-anual", label: "Balanço anual", icon: BarChart3 },
  { href: "/relatorios/fluxo-projetado", label: "Fluxo projetado", icon: TrendingUp },
  { href: "/relatorios/parceladas", label: "Despesas parceladas", icon: Layers },
  { href: "/relatorios/orcamento", label: "Orçamento", icon: PiggyBank },
  { href: "/relatorios/regua", label: "Régua de Alocação", icon: Ruler },
];

const PATRIMONIO_ITEMS: NavLeaf[] = [
  { href: "/patrimonio/bens", label: "Bens", icon: Boxes },
  { href: "/patrimonio/metas", label: "Metas", icon: Target },
  { href: "/patrimonio/dividas", label: "Dívidas", icon: TrendingDown },
  { href: "/patrimonio/funcao", label: "Função do Patrimônio", icon: Compass },
];

const PROTECAO_ITEMS: NavLeaf[] = [
  { href: "/protecao/reserva", label: "Reserva de Emergência", icon: ShieldAlert },
  { href: "/protecao/perfil", label: "Perfil de Risco", icon: IdCard },
  { href: "/protecao/seguros", label: "Seguros", icon: Umbrella },
  { href: "/protecao/beneficios", label: "Proteções e Benefícios", icon: HandCoins },
];

const INVESTIMENTOS_ITEMS: NavLeaf[] = [
  { href: "/investimentos", label: "Carteira", icon: Wallet },
  { href: "/investimentos/analise", label: "Análise", icon: PieChart },
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
  memberships: WorkspaceOption[];
  currentWorkspaceId: string;
  email: string | null | undefined;
  isPlatformAdmin: boolean;
}

export function Sidebar({ memberships, currentWorkspaceId, email, isPlatformAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();

  // Fecha o drawer sozinho ao navegar — cobre qualquer forma de sair da
  // página (link, botão do navegador), não só o clique num item do menu.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const entries: NavEntry[] = [
    { href: "/painel", label: "Painel", icon: LayoutDashboard },
    { href: "/painel/saude-financeira", label: "Saúde Financeira", icon: HeartPulse },
    { href: "/painel/assistente", label: "Assistente", icon: Sparkles },
    { label: "Lançamentos", icon: Receipt, items: LANCAMENTOS_ITEMS },
    { label: "Compromissos", icon: CalendarClock, items: COMPROMISSOS_ITEMS },
    { label: "Cartões de Crédito", icon: CreditCard, items: CARTOES_ITEMS },
    { label: "Relatórios", icon: BarChart3, items: RELATORIOS_ITEMS },
    { label: "Patrimônio", icon: Landmark, items: PATRIMONIO_ITEMS },
    { label: "Investimentos", icon: CandlestickChart, items: INVESTIMENTOS_ITEMS },
    { label: "Proteção e Segurança", icon: ShieldAlert, items: PROTECAO_ITEMS },
    { label: "Cadastros", icon: Settings2, items: CADASTROS_ITEMS },
  ];
  if (isPlatformAdmin) {
    entries.push({ label: "Admin", icon: ShieldCheck, items: ADMIN_ITEMS });
  }
  entries.push({ href: "/minha-conta", label: "Minha conta", icon: UserCircle });

  return (
    <>
      {/* Fundo escurecido atrás do drawer, só no mobile e só quando aberto. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mesmo menu em todo tamanho de tela — fixo e sempre visível no
          desktop (md:translate-x-0), e um drawer deslizante no mobile
          (translate-x conforme `mobileOpen`), igual o pedido do usuário de
          ter "o mesmo menu da versão web" também no celular. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-indigo-900/50 bg-[#131A47] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <Image src="/logo-sidebar.png" alt="" width={28} height={28} className="shrink-0" priority />
          <span className="flex-1 text-sm font-semibold tracking-wide text-white">PROSPECTA FINANCE</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="shrink-0 rounded-lg p-1 text-indigo-200 hover:bg-indigo-900/50 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mb-4 rounded-lg bg-indigo-900/40 px-3 py-2">
          <WorkspaceSwitcher
            memberships={memberships}
            currentWorkspaceId={currentWorkspaceId}
            email={email}
            isPlatformAdmin={isPlatformAdmin}
          />
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
    </>
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
