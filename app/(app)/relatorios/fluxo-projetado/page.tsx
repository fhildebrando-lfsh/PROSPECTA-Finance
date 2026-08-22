import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry, toFinanceWallet } from "@/lib/finance/from-db";
import { projectedBalance } from "@/lib/finance/period";
import { type Regime } from "@/lib/finance/types";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";
import { MonthlyChart, type MonthlyChartPoint } from "@/components/charts/MonthlyChart";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";

interface SearchParams {
  months?: string;
  regime?: Regime;
}

const MONTH_OPTIONS = [6, 12, 24] as const;

function reportQuery(months: number, regime: Regime) {
  return `?months=${months}&regime=${regime}`;
}

export default async function FluxoProjetadoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();
  // Registro Nº 108 — a feature existia no catálogo e nenhuma tela a
  // consultava: desmarcá-la em /admin/planos não tinha efeito nenhum.
  if (!(await hasFeature(workspaceId, "relatorio_fluxo_projetado"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O relatório de Fluxo projetado está disponível a partir do plano Pro.</p>
        <p className="mt-2">Ele projeta os próximos meses a partir do que já está lançado como a pagar e a receber.</p>
      </div>
    );
  }
  const params = await searchParams;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const regime: Regime = params.regime === "competencia" ? "competencia" : "caixa";
  const otherRegime: Regime = regime === "caixa" ? "competencia" : "caixa";
  const monthsAhead = MONTH_OPTIONS.includes(Number(params.months) as (typeof MONTH_OPTIONS)[number])
    ? Number(params.months)
    : 12;

  const [wallets, dbEntries] = await Promise.all([
    prisma.wallet.findMany({ where: { workspaceId }, include: { kind: true } }),
    prisma.entry.findMany({ where: { workspaceId } }),
  ]);
  const entries = dbEntries.map(toFinanceEntry);
  const financeWallets = wallets.map(toFinanceWallet);

  const { current, points } = projectedBalance(entries, financeWallets, today, monthsAhead, regime);

  const chartData: MonthlyChartPoint[] = [
    { label: "Hoje", receita: 0, despesa: 0, saldo: current.toNumber() },
    ...points.map((p) => ({
      label: `${MONTH_LABELS[p.period.start.getUTCMonth()]}/${String(p.period.start.getUTCFullYear()).slice(2)}`,
      receita: 0,
      despesa: 0,
      saldo: p.balance.toNumber(),
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Saldo líquido acumulado, partindo de hoje e projetando os próximos meses com base no que já está lançado
          (parcelas, recorrências materializadas e compromissos agendados) — regime{" "}
          {regime === "caixa" ? "caixa (Vence)" : "competência (Compra)"}.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {MONTH_OPTIONS.map((m) => (
              <Link
                key={m}
                href={reportQuery(m, regime)}
                className={`px-3 py-1 ${
                  monthsAhead === m ? "bg-amber-500 text-zinc-950" : "bg-transparent text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {m} meses
              </Link>
            ))}
          </div>
          <Link
            href={reportQuery(monthsAhead, otherRegime)}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            trocar p/ {otherRegime === "caixa" ? "caixa" : "competência"}
          </Link>
          <a href={`/api/relatorios/fluxo-projetado/pdf?months=${monthsAhead}&regime=${regime}`} className={BTN_PRIMARY}>
            Baixar PDF
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <p className="text-xs text-indigo-300">Saldo hoje</p>
        <p className={`font-mono text-xl tabular-nums ${current.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
          {formatCurrencyBRL(current)}
        </p>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <MonthlyChart data={chartData} />
      </div>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
              <th className="px-3 py-2 font-medium">Mês</th>
              <th className="px-3 py-2 text-right font-medium">Saldo projetado</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-indigo-900/30">
              <td className="px-3 py-2 text-indigo-100">Hoje</td>
              <td
                className={`px-3 py-2 text-right font-mono font-semibold tabular-nums ${
                  current.isNegative() ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {formatCurrencyBRL(current)}
              </td>
            </tr>
            {points.map((p) => (
              <tr key={p.period.start.toISOString()} className="border-b border-indigo-900/30 last:border-0">
                <td className="px-3 py-2 text-indigo-100">
                  {MONTH_LABELS[p.period.start.getUTCMonth()]}/{p.period.start.getUTCFullYear()}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono tabular-nums ${
                    p.balance.isNegative() ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {formatCurrencyBRL(p.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
