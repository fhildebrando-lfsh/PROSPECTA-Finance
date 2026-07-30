import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { entryUrgency } from "@/lib/finance/derived";
import type { EntryStatus } from "@/lib/finance/types";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { recurrenceLabel } from "@/lib/entries/recurrence-label";

interface SearchParams {
  from?: string;
  to?: string;
  walletId?: string;
  nature?: string;
  q?: string;
}

// liquidado/isento = problema resolvido, fica discreto; a vencer = tem uma
// indicação (amarelo) mas sem chamar muita atenção; atrasado = precisa de
// atenção real — fundo rosa forte, texto preto pro contraste (modelo Meu Vista).
// Barra lateral usa as mesmas cores da legenda (rosa/âmbar/cinza).
const URGENCY_ROW_CLASS: Record<string, string> = {
  overdue: "border-l-4 border-l-rose-400 bg-rose-200 text-zinc-900",
  upcoming: "border-l-4 border-l-amber-500 bg-transparent text-zinc-900",
  settled: "border-l-4 border-l-zinc-500 bg-transparent text-zinc-400",
};

const SITUACAO_CLASS: Record<string, string> = {
  overdue: "font-medium text-rose-800",
  upcoming: "font-medium text-amber-600",
  settled: "text-zinc-400",
};

function situacaoLabel(urgency: string, statusLabel: string): string {
  return urgency === "overdue" ? "Atrasado" : statusLabel;
}

const AMOUNT_CLASS = (amount: { isNegative(): boolean; isZero(): boolean }) => {
  if (amount.isZero()) return "text-amber-600";
  return amount.isNegative() ? "text-red-600" : "text-emerald-600";
};

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const workspaceId = await requireWorkspaceId();
  const params = await searchParams;

  const where: Prisma.EntryWhereInput = { workspaceId };
  if (params.from || params.to) {
    where.dueDate = {
      ...(params.from ? { gte: new Date(`${params.from}T00:00:00Z`) } : {}),
      ...(params.to ? { lte: new Date(`${params.to}T00:00:00Z`) } : {}),
    };
  }
  if (params.walletId) where.walletId = params.walletId;
  if (params.nature) where.nature = params.nature as Prisma.EnumEntryNatureFilter["equals"];
  if (params.q) where.description = { contains: params.q, mode: "insensitive" };

  const [entries, wallets, natureLabels] = await Promise.all([
    prisma.entry.findMany({
      where,
      include: {
        wallet: true,
        category: true,
        subcategory: true,
        responsible: true,
        status: true,
        recurrence: true,
      },
      orderBy: { dueDate: "desc" },
      take: 200,
    }),
    prisma.wallet.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.natureLabel.findMany(),
  ]);

  const natureLabelByCode = new Map(natureLabels.map((n) => [n.code, n.labelPt]));
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const exportQuery = (format: "csv" | "xlsx") => {
    const qs = new URLSearchParams({ format });
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.walletId) qs.set("walletId", params.walletId);
    if (params.nature) qs.set("nature", params.nature);
    if (params.q) qs.set("q", params.q);
    return `/api/entries/export?${qs.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Lançamentos</h1>
          <p className="text-sm text-zinc-500">Mostrando até 200 lançamentos mais recentes por vencimento.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportQuery("csv")}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Exportar CSV
          </a>
          <a
            href={exportQuery("xlsx")}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Exportar XLSX
          </a>
          <Link
            href="/lancamentos/importar"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
          >
            Importar planilha
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-3 text-sm">
        <input
          type="date"
          name="from"
          defaultValue={params.from}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
        />
        <input
          type="date"
          name="to"
          defaultValue={params.to}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
        />
        <select
          name="walletId"
          defaultValue={params.walletId ?? ""}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
        >
          <option value="">Todas as carteiras</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select
          name="nature"
          defaultValue={params.nature ?? ""}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
        >
          <option value="">Todos os tipos</option>
          {[...natureLabelByCode.entries()].map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="q"
          placeholder="Buscar descrição…"
          defaultValue={params.q}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
        />
        <button type="submit" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800">
          Filtrar
        </button>
      </form>

      <div className="flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> atrasado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> a vencer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /> liquidado
        </span>
      </div>

      {/* §21 — abaixo de 768px a tabela densa vira cards; acima, tabela normal. */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-300 bg-zinc-50 md:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-600">
            <tr>
              <th className="px-3 py-2 font-medium">Compra</th>
              <th className="px-3 py-2 font-medium">Vence</th>
              <th className="px-3 py-2 font-medium">Carteira</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Subcategoria</th>
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2 font-medium">Responsável</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
              <th className="px-3 py-2 font-medium">Recorrência</th>
              <th className="px-3 py-2 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const urgency = entryUrgency(
                { status: entry.statusCode as EntryStatus, dueDate: entry.dueDate },
                today,
              );
              return (
                <tr key={entry.id} className={`border-t border-zinc-200 ${URGENCY_ROW_CLASS[urgency]}`}>
                  <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums">
                    {formatDateBR(entry.transactionDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums">{formatDateBR(entry.dueDate)}</td>
                  <td className="px-3 py-2">{entry.wallet.name}</td>
                  <td className="px-3 py-2">{natureLabelByCode.get(entry.nature) ?? entry.nature}</td>
                  <td className="px-3 py-2">{entry.category.name}</td>
                  <td className="px-3 py-2">{entry.subcategory?.name ?? "—"}</td>
                  <td className="px-3 py-2">{entry.description}</td>
                  <td className="px-3 py-2">{entry.responsible.name}</td>
                  <td className={`whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums ${AMOUNT_CLASS(entry.amount)}`}>
                    {formatCurrencyBRL(entry.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{recurrenceLabel(entry)}</td>
                  <td className={`whitespace-nowrap px-3 py-2 ${SITUACAO_CLASS[urgency]}`}>
                    {situacaoLabel(urgency, entry.status.labelPt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entries.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhum lançamento encontrado.</p>}
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {entries.map((entry) => {
          const urgency = entryUrgency({ status: entry.statusCode as EntryStatus, dueDate: entry.dueDate }, today);
          return (
            <div key={entry.id} className={`rounded-xl border border-zinc-300 p-3 ${URGENCY_ROW_CLASS[urgency]}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{entry.description}</span>
                <span className={`shrink-0 font-mono tabular-nums ${AMOUNT_CLASS(entry.amount)}`}>
                  {formatCurrencyBRL(entry.amount)}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {entry.wallet.name} · {entry.category.name}
                {entry.subcategory ? ` / ${entry.subcategory.name}` : ""}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-mono tabular-nums opacity-80">Vence {formatDateBR(entry.dueDate)}</span>
                <span className={SITUACAO_CLASS[urgency]}>{situacaoLabel(urgency, entry.status.labelPt)}</span>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-500">Nenhum lançamento encontrado.</p>
        )}
      </div>
    </div>
  );
}
