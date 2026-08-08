import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { dashboardBalanceBlocks, walletBalance } from "@/lib/finance/balance";
import { cardCoverage } from "@/lib/finance/card";
import { monthRange } from "@/lib/finance/dates";
import { toFinanceEntry, toFinanceWallet } from "@/lib/finance/from-db";
import { periodTotals } from "@/lib/finance/period";
import { goalProgress } from "@/lib/finance/goal";
import { categoryDistribution, topEntries } from "@/lib/finance/rankings";
import { Decimal, type Regime } from "@/lib/finance/types";
import { formatCurrencyBRL } from "@/lib/format";
import { MonthlyChart, type MonthlyChartPoint } from "@/components/charts/MonthlyChart";
import { CategoryRings } from "@/components/charts/CategoryRings";
import { ReserveGauge } from "@/components/charts/ReserveGauge";

type View = "mensal" | "anual" | "geral";

interface SearchParams {
  year?: string;
  month?: string; // 1-12
  regime?: Regime;
  view?: View;
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function painelQuery(view: View, year: number, monthIndex0: number, regime: Regime) {
  return `?view=${view}&year=${year}&month=${monthIndex0 + 1}&regime=${regime}`;
}

/** Intervalo "geral" — cobre qualquer data real de lançamento sem precisar de query extra. */
const ALL_TIME_PERIOD = { start: new Date(Date.UTC(1970, 0, 1)), end: new Date(Date.UTC(2100, 11, 31)) };

export default async function PainelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();
  const params = await searchParams;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const year = params.year ? Number(params.year) : today.getUTCFullYear();
  const monthIndex0 = params.month ? Number(params.month) - 1 : today.getUTCMonth();
  const regime: Regime = params.regime === "competencia" ? "competencia" : "caixa";
  const view: View = params.view === "anual" || params.view === "geral" ? params.view : "mensal";

  const [wallets, dbEntries, goals] = await Promise.all([
    prisma.wallet.findMany({ where: { workspaceId }, include: { kind: true } }),
    prisma.entry.findMany({
      where: { workspaceId },
      include: { category: true, wallet: true },
    }),
    prisma.goal.findMany({
      where: { workspaceId, isActive: true, pinnedToPainel: true },
      include: { wallet: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const entries = dbEntries.map(toFinanceEntry);
  const financeWallets = wallets.map(toFinanceWallet);

  const yearPeriod = { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
  const period = view === "anual" ? yearPeriod : view === "geral" ? ALL_TIME_PERIOD : monthRange(year, monthIndex0);
  const totals = periodTotals(entries, period, regime);
  const balanceBlocks = dashboardBalanceBlocks(entries, financeWallets, today);

  const monthlyChartData: MonthlyChartPoint[] = Array.from({ length: 6 }, (_, i) => {
    const offset = -5 + i; // 5 meses atrás até o mês selecionado
    const targetPeriod = monthRange(year, monthIndex0 + offset);
    const t = periodTotals(entries, targetPeriod, regime);
    return {
      label: `${MONTH_LABELS[targetPeriod.start.getUTCMonth()]}/${String(targetPeriod.start.getUTCFullYear()).slice(2)}`,
      receita: t.receita.toNumber(),
      despesa: t.despesa.toNumber(),
      saldo: t.balanco.toNumber(),
    };
  });

  // Provisão futura — sempre a partir de hoje (não do mês/view selecionado no filtro),
  // pega o que já está lançado com data futura (parcelas, recorrências materializadas,
  // compromissos A_PAGAR/A_RECEBER agendados).
  const forecastChartData: MonthlyChartPoint[] = Array.from({ length: 6 }, (_, i) => {
    const targetPeriod = monthRange(today.getUTCFullYear(), today.getUTCMonth() + i);
    const t = periodTotals(entries, targetPeriod, regime);
    return {
      label: `${MONTH_LABELS[targetPeriod.start.getUTCMonth()]}/${String(targetPeriod.start.getUTCFullYear()).slice(2)}`,
      receita: t.receita.toNumber(),
      despesa: t.despesa.toNumber(),
      saldo: t.balanco.toNumber(),
    };
  });

  const topReceitas = topEntries(entries, "RECEITA", period, regime, 5);
  const topDespesas = topEntries(entries, "DESPESA", period, regime, 5);
  const categoryNameById = new Map(dbEntries.map((e) => [e.categoryId, e.category.name]));
  const distribution = categoryDistribution(entries, period, regime)
    .sort((a, b) => b.total.comparedTo(a.total))
    .slice(0, 8);
  const categoryRingItems = distribution.map((row) => ({
    categoryId: row.categoryId,
    name: categoryNameById.get(row.categoryId) ?? "—",
    percentage: row.percentage.toNumber(),
    totalFormatted: formatCurrencyBRL(row.total),
  }));

  const entryDisplay = new Map(dbEntries.map((e) => [e.id, { description: e.description, walletName: e.wallet.name }]));

  // §11.5 — cobertura de fatura de cada cartão que tem caixinha vinculada.
  const cardWallets = wallets.filter((w) => w.kindCode === "CARTAO_CREDITO" && w.linkedWalletId);
  const coverages = cardWallets.map((card) => {
    const caixinhaSaldo = walletBalance(entries, card.linkedWalletId!, today);
    const coverage = cardCoverage(caixinhaSaldo, entries, card.id);
    return { card, coverage };
  });

  // Seção "Metas" — só as metas que o usuário marcou "Mostrar no Painel" em
  // Patrimônio → Metas (`Goal.pinnedToPainel`). Nenhum cálculo próprio aqui:
  // mesmo saldo/meta/percentual que já aparecem em Patrimônio → Metas, via
  // `walletBalance`/`goalProgress` — nunca um número paralelo (era a causa
  // raiz do bug relatado: o Painel calculava sua própria meta de reserva por
  // despesa média × 6 meses, ignorando a Goal real que o usuário criou).
  const pinnedGoals = goals.map((g) => {
    const balance = walletBalance(entries, g.walletId, today);
    return { ...g, balance, progress: goalProgress(balance, g.targetAmount) };
  });

  const prevMonth = painelQuery("mensal", monthIndex0 === 0 ? year - 1 : year, monthIndex0 === 0 ? 11 : monthIndex0 - 1, regime);
  const nextMonth = painelQuery("mensal", monthIndex0 === 11 ? year + 1 : year, monthIndex0 === 11 ? 0 : monthIndex0 + 1, regime);
  const prevYear = painelQuery("anual", year - 1, monthIndex0, regime);
  const nextYear = painelQuery("anual", year + 1, monthIndex0, regime);
  const otherRegime: Regime = regime === "caixa" ? "competencia" : "caixa";

  const periodLabel =
    view === "anual"
      ? `Ano ${year}`
      : view === "geral"
        ? "Todo o período"
        : `${MONTH_LABELS[monthIndex0]}/${year}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Painel</h1>
          <p className="text-sm text-zinc-500">
            {periodLabel} · regime {regime === "caixa" ? "caixa (Vence)" : "competência (Compra)"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {(["mensal", "anual", "geral"] as const).map((v) => (
              <Link
                key={v}
                href={painelQuery(v, year, monthIndex0, regime)}
                className={`px-3 py-1 capitalize ${
                  view === v ? "bg-amber-500 text-zinc-950" : "bg-transparent text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {v}
              </Link>
            ))}
          </div>

          {view === "mensal" && (
            <>
              <Link href={prevMonth} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
                ← mês anterior
              </Link>
              <Link href={nextMonth} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
                mês seguinte →
              </Link>
            </>
          )}

          {view === "anual" && (
            <>
              <Link href={prevYear} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
                ← ano anterior
              </Link>
              <Link href={nextYear} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
                ano seguinte →
              </Link>
            </>
          )}

          <Link
            href={painelQuery(view, year, monthIndex0, otherRegime)}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            trocar p/ {otherRegime === "caixa" ? "caixa" : "competência"}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Receita" value={formatCurrencyBRL(totals.receita)} tone="emerald" />
        <StatCard label="Despesa" value={formatCurrencyBRL(totals.despesa)} tone="red" />
        <StatCard label="Investimento" value={formatCurrencyBRL(totals.investimento)} tone="zinc" />
        <StatCard label="Balanço" value={formatCurrencyBRL(totals.balanco)} tone={totals.balanco.isNegative() ? "red" : "emerald"} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Saldos por carteira</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Contas" value={formatCurrencyBRL(balanceBlocks.contas)} tone="zinc" />
          <StatCard label="Investimentos" value={formatCurrencyBRL(balanceBlocks.investimentos)} tone="zinc" />
          <StatCard label="Vouchers" value={formatCurrencyBRL(balanceBlocks.vouchers)} tone="zinc" />
          <StatCard label="Saldo líquido total" value={formatCurrencyBRL(balanceBlocks.total)} tone="amber" />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Últimos 6 meses</h2>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <MonthlyChart data={monthlyChartData} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Provisão (próximos 6 meses)</h2>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <MonthlyChart data={forecastChartData} />
        </div>
      </div>

      <div className="grid min-w-0 gap-6 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-indigo-300">Top 5 receitas</h2>
          <RankingList entries={topReceitas} entryDisplay={entryDisplay} tone="emerald" />
        </div>
        <div className="min-w-0 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-indigo-300">Top 5 despesas</h2>
          <RankingList entries={topDespesas} entryDisplay={entryDisplay} tone="red" />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Distribuição por categoria</h2>
        <CategoryRings items={categoryRingItems} />
      </div>

      {coverages.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Cobertura de fatura</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {coverages.map(({ card, coverage }) => (
              <div key={card.id} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
                <p className="text-sm text-indigo-300">{card.name}</p>
                <p className={`font-mono text-xl tabular-nums ${coverage.saldo.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
                  {formatCurrencyBRL(coverage.saldo)}
                </p>
                <p className="text-xs text-indigo-300">
                  caixinha {formatCurrencyBRL(coverage.caixinhaBalance)} − dívida {formatCurrencyBRL(coverage.divida)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pinnedGoals.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Metas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedGoals.map((g) => (
              <div key={g.id} className="flex flex-col items-center gap-2 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
                <ReserveGauge percentage={g.progress.toNumber()} label={g.name.toUpperCase()} />
                <p className="font-mono text-sm tabular-nums text-indigo-300">
                  {formatCurrencyBRL(g.balance)} de {formatCurrencyBRL(g.targetAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "red" | "amber" | "zinc" }) {
  const color = { emerald: "text-emerald-400", red: "text-red-400", amber: "text-amber-400", zinc: "text-zinc-50" }[tone];
  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <p className="text-xs text-indigo-300">{label}</p>
      <p className={`font-mono text-xl tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function RankingList({
  entries,
  entryDisplay,
  tone,
}: {
  entries: { id: string; amount: Decimal; description?: string }[];
  entryDisplay: Map<string, { description: string; walletName: string }>;
  tone: "emerald" | "red";
}) {
  return (
    <ul className="flex flex-col divide-y divide-indigo-900/50">
      {entries.map((e) => {
        const display = entryDisplay.get(e.id);
        return (
          <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
            <span className="min-w-0 flex-1 truncate text-indigo-100">{display?.description ?? "—"}</span>
            <span
              className={`shrink-0 font-mono tabular-nums ${tone === "emerald" ? "text-emerald-400" : "text-red-400"}`}
            >
              {formatCurrencyBRL(e.amount)}
            </span>
          </li>
        );
      })}
      {entries.length === 0 && <p className="text-sm text-indigo-300">Nenhum lançamento no período.</p>}
    </ul>
  );
}
