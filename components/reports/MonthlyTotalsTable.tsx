import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";

export interface MonthlyTotalsRow {
  label: string;
  tone: "emerald" | "red" | "zinc" | "amber";
  values: Decimal[];
  total: Decimal;
}

const TONE_CLASS: Record<MonthlyTotalsRow["tone"], string> = {
  emerald: "text-emerald-400",
  red: "text-red-400",
  zinc: "text-zinc-100",
  amber: "text-amber-400",
};

/**
 * Tabela "12 meses + Total" reaproveitada pelo Analítico mês a mês e pelo bloco
 * sintético do Balanço anual (§13) — mesma linguagem visual das tabelas de
 * relatório do sistema. Server component (sem interatividade própria).
 */
export function MonthlyTotalsTable({ rows, firstColumnLabel = "Natureza" }: { rows: MonthlyTotalsRow[]; firstColumnLabel?: string }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
            <th className="sticky left-0 bg-[#131A47] px-3 py-2 font-medium">{firstColumnLabel}</th>
            {MONTH_LABELS.map((label) => (
              <th key={label} className="px-3 py-2 text-right font-medium">
                {label}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-indigo-900/30 last:border-0">
              <td className="sticky left-0 bg-[#131A47] px-3 py-2 text-indigo-100">{row.label}</td>
              {row.values.map((value, i) => (
                <td key={i} className={`px-3 py-2 text-right font-mono tabular-nums ${TONE_CLASS[row.tone]}`}>
                  {formatCurrencyBRL(value)}
                </td>
              ))}
              <td className={`px-3 py-2 text-right font-mono font-semibold tabular-nums ${TONE_CLASS[row.tone]}`}>
                {formatCurrencyBRL(row.total)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={14} className="px-3 py-4 text-center text-indigo-300">
                Sem lançamentos no período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
