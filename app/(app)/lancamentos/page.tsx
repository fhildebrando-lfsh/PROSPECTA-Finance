import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { entryUrgency } from "@/lib/finance/derived";
import type { EntryStatus } from "@/lib/finance/types";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { recurrenceLabel } from "@/lib/entries/recurrence-label";
import { EntriesTable, type EntryRow } from "./EntriesTable";

interface SearchParams {
  from?: string;
  to?: string;
  walletId?: string;
  nature?: string;
  q?: string;
}

// liquidado/isento = problema resolvido, fica discreto; a vencer = tem uma
// indicação (amarelo) mas sem chamar muita atenção; atrasado = precisa de
// atenção real — fundo rosa forte, texto preto para o contraste (modelo Meu Vista).
// Barra lateral usa as mesmas cores da legenda (rosa/âmbar/cinza).
// Só para a tabela densa (desktop, EntriesTable) — ela vive dentro de um
// wrapper claro (`bg-zinc-50`), então "bg-transparent" com texto escuro
// funciona ali. Nunca usar isto no fundo escuro do resto do app (ver
// MOBILE_URGENCY_CARD_CLASS abaixo).
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

// Bug real corrigido: os cards do celular (abaixo de 768px) reaproveitavam
// URGENCY_ROW_CLASS/SITUACAO_CLASS/AMOUNT_CLASS acima, pensados pro fundo
// claro da tabela — "bg-transparent" com texto quase preto (upcoming) ou
// cinza médio (settled) ficava quase invisível no fundo escuro do resto do
// app. Paleta própria, no mesmo padrão de cor já usado em Compromissos
// (rosa/âmbar/cinza sobre fundo escuro).
const MOBILE_URGENCY_CARD_CLASS: Record<string, string> = {
  overdue: "border-rose-900 bg-rose-950/30 text-rose-50",
  upcoming: "border-amber-900/60 bg-amber-950/10 text-zinc-100",
  settled: "border-zinc-800 bg-zinc-900 text-zinc-400",
};

const MOBILE_SITUACAO_CLASS: Record<string, string> = {
  overdue: "font-medium text-rose-300",
  upcoming: "font-medium text-amber-400",
  settled: "text-zinc-500",
};

const MOBILE_AMOUNT_CLASS = (amount: { isNegative(): boolean; isZero(): boolean }) => {
  if (amount.isZero()) return "text-amber-400";
  return amount.isNegative() ? "text-red-400" : "text-emerald-400";
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

  const [entries, wallets, natureLabels, categories, subcategories, people, statuses] = await Promise.all([
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
    prisma.category.findMany({ orderBy: [{ nature: "asc" }, { sortOrder: "asc" }] }),
    prisma.subcategory.findMany({ where: { workspaceId: null }, orderBy: { name: "asc" } }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.status.findMany(),
  ]);

  const natureLabelByCode = new Map(natureLabels.map((n) => [n.code, n.labelPt]));
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const rows: EntryRow[] = entries.map((entry) => {
    const urgency = entryUrgency({ status: entry.statusCode as EntryStatus, dueDate: entry.dueDate }, today);
    return {
      id: entry.id,
      transactionDateFormatted: formatDateBR(entry.transactionDate),
      dueDateIso: entry.dueDate.toISOString().slice(0, 10),
      dueDateFormatted: formatDateBR(entry.dueDate),
      walletName: entry.wallet.name,
      nature: entry.nature,
      natureLabel: natureLabelByCode.get(entry.nature) ?? entry.nature,
      categoryId: entry.categoryId,
      categoryName: entry.category.name,
      subcategoryId: entry.subcategoryId ?? "",
      subcategoryName: entry.subcategory?.name ?? "",
      description: entry.description,
      responsibleId: entry.responsibleId,
      responsibleName: entry.responsible.name,
      amountAbs: entry.amount.abs().toFixed(2),
      isNegative: entry.amount.isNegative(),
      amountFormatted: formatCurrencyBRL(entry.amount),
      amountClass: AMOUNT_CLASS(entry.amount),
      recurrenceLabel: recurrenceLabel(entry),
      statusCode: entry.statusCode,
      situacaoLabel: situacaoLabel(urgency, entry.status.labelPt),
      situacaoClass: SITUACAO_CLASS[urgency],
      rowClass: URGENCY_ROW_CLASS[urgency],
    };
  });

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
            href="/lancamentos/transferir"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Transferir
          </Link>
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

      {/* §21 — abaixo de 768px a tabela densa vira cards; acima, tabela normal (edição em linha + ações em lote só no desktop). */}
      <EntriesTable
        entries={rows}
        categories={categories.map((c) => ({ id: c.id, nature: c.nature, name: c.name }))}
        subcategories={subcategories.map((s) => ({ id: s.id, categoryId: s.categoryId, name: s.name }))}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        statuses={statuses.map((s) => ({ code: s.code, label: s.labelPt }))}
      />

      <div className="flex flex-col gap-2 md:hidden">
        {entries.map((entry) => {
          const urgency = entryUrgency({ status: entry.statusCode as EntryStatus, dueDate: entry.dueDate }, today);
          return (
            <div key={entry.id} className={`rounded-xl border p-3 ${MOBILE_URGENCY_CARD_CLASS[urgency]}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{entry.description}</span>
                <span className={`shrink-0 font-mono tabular-nums ${MOBILE_AMOUNT_CLASS(entry.amount)}`}>
                  {formatCurrencyBRL(entry.amount)}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {entry.wallet.name} · {entry.category.name}
                {entry.subcategory ? ` / ${entry.subcategory.name}` : ""}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-mono tabular-nums opacity-80">Vence {formatDateBR(entry.dueDate)}</span>
                <span className={MOBILE_SITUACAO_CLASS[urgency]}>{situacaoLabel(urgency, entry.status.labelPt)}</span>
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
