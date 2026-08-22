import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { monthRange } from "@/lib/finance/dates";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { categoryDistribution } from "@/lib/finance/rankings";
import { type Regime } from "@/lib/finance/types";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";
import { BudgetTable, type BudgetRow } from "./BudgetTable";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";

interface SearchParams {
  year?: string;
  month?: string; // 1-12
  regime?: Regime;
}

function reportQuery(year: number, monthIndex0: number, regime: Regime) {
  return `?year=${year}&month=${monthIndex0 + 1}&regime=${regime}`;
}

export default async function OrcamentoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();
  // Registro Nº 108 — a feature existia no catálogo e nenhuma tela a
  // consultava: desmarcá-la em /admin/planos não tinha efeito nenhum.
  if (!(await hasFeature(workspaceId, "relatorio_orcamento"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O relatório de Orçamento está disponível a partir do plano Pro.</p>
        <p className="mt-2">Ele compara o que você planejou gastar em cada categoria com o que de fato gastou, mês a mês.</p>
      </div>
    );
  }
  const params = await searchParams;

  const today = new Date();
  const year = params.year ? Number(params.year) : today.getUTCFullYear();
  const monthIndex0 = params.month ? Number(params.month) - 1 : today.getUTCMonth();
  const regime: Regime = params.regime === "competencia" ? "competencia" : "caixa";
  const otherRegime: Regime = regime === "caixa" ? "competencia" : "caixa";

  const [categories, budgets, dbEntries] = await Promise.all([
    prisma.category.findMany({ where: { nature: "DESPESA" }, orderBy: { sortOrder: "asc" } }),
    prisma.budget.findMany({ where: { workspaceId, year, month: monthIndex0 + 1 } }),
    prisma.entry.findMany({ where: { workspaceId } }),
  ]);

  const entries = dbEntries.map(toFinanceEntry);
  const period = monthRange(year, monthIndex0);
  const realizedByCategory = new Map(categoryDistribution(entries, period, regime).map((r) => [r.categoryId, r.total.toNumber()]));
  const plannedByCategory = new Map(budgets.map((b) => [b.categoryId, b.plannedAmount.toNumber()]));

  const rows: BudgetRow[] = categories.map((c) => ({
    categoryId: c.id,
    categoryName: c.name,
    planned: plannedByCategory.get(c.id) ?? 0,
    realized: realizedByCategory.get(c.id) ?? 0,
  }));

  const totalPlanned = rows.reduce((sum, r) => sum + r.planned, 0);
  const totalRealized = rows.reduce((sum, r) => sum + r.realized, 0);

  const prevMonth = reportQuery(monthIndex0 === 0 ? year - 1 : year, monthIndex0 === 0 ? 11 : monthIndex0 - 1, regime);
  const nextMonth = reportQuery(monthIndex0 === 11 ? year + 1 : year, monthIndex0 === 11 ? 0 : monthIndex0 + 1, regime);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Orçado × realizado por categoria de despesa — {MONTH_LABELS[monthIndex0]}/{year}, regime{" "}
          {regime === "caixa" ? "caixa (Vence)" : "competência (Compra)"}. Clique em &ldquo;Editar&rdquo; para definir
          quanto planeja gastar em cada categoria.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={prevMonth} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
            ← mês anterior
          </Link>
          <Link href={nextMonth} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
            mês seguinte →
          </Link>
          <Link
            href={reportQuery(year, monthIndex0, otherRegime)}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            trocar p/ {otherRegime === "caixa" ? "caixa" : "competência"}
          </Link>
          <a
            href={`/api/relatorios/orcamento/pdf?year=${year}&month=${monthIndex0 + 1}&regime=${regime}`}
            className={BTN_PRIMARY}
          >
            Baixar PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Total orçado</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(totalPlanned)}</p>
        </div>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Total realizado</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(totalRealized)}</p>
        </div>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Diferença</p>
          <p
            className={`font-mono text-xl tabular-nums ${
              totalPlanned - totalRealized < 0 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {formatCurrencyBRL(totalPlanned - totalRealized)}
          </p>
        </div>
      </div>

      <BudgetTable rows={rows} year={year} month={monthIndex0 + 1} />
    </div>
  );
}
