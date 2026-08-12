import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { CompromissosTabs } from "../CompromissosTabs";
import { IncidentsList } from "./IncidentsList";
import type { IncidentCardData } from "./IncidentCard";

interface SearchParams {
  from?: string;
  to?: string;
}

/** §13 "Incidentes" — duas origens (§18, ver `lib/finance/incidents.ts::
 * isEntryIncident()`, expressa aqui como filtro de banco): (1) lançamentos
 * parcelados (`installmentTotal >= 2`) que a heurística de agrupamento
 * (`lib/import/group-installments.ts`) não conseguiu combinar com nenhuma
 * parcela irmã — órfã de verdade ou cluster ambíguo; (2) lançamentos
 * importados por OFX sem histórico de categoria para a descrição, que caíram
 * na categoria padrão escolhida no import (`lib/import/ofx-to-rows.ts`). */
export default async function IncidentesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();
  const params = await searchParams;

  const where: Prisma.EntryWhereInput = {
    workspaceId,
    incidentAcknowledgedAt: null,
    OR: [{ installmentTotal: { gte: 2 }, groupId: null }, { autoReviewReason: { not: null } }],
  };
  if (params.from || params.to) {
    where.dueDate = {
      ...(params.from ? { gte: new Date(`${params.from}T00:00:00Z`) } : {}),
      ...(params.to ? { lte: new Date(`${params.to}T00:00:00Z`) } : {}),
    };
  }

  const [incidents, wallets, categories, subcategories, people, statuses] = await Promise.all([
    prisma.entry.findMany({
      where,
      include: { wallet: true, category: true, responsible: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.wallet.findMany({ where: { workspaceId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: [{ nature: "asc" }, { sortOrder: "asc" }] }),
    prisma.subcategory.findMany({ where: { workspaceId: null }, orderBy: { name: "asc" } }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.status.findMany(),
  ]);

  const cards: IncidentCardData[] = incidents.map((e) => ({
    id: e.id,
    description: e.description,
    walletId: e.walletId,
    categoryId: e.categoryId,
    subcategoryId: e.subcategoryId ?? "",
    responsibleId: e.responsibleId,
    nature: e.nature,
    statusCode: e.statusCode,
    amountAbs: e.amount.abs().toFixed(2),
    isNegative: e.amount.isNegative(),
    amountFormatted: formatCurrencyBRL(e.amount),
    transactionDateIso: e.transactionDate.toISOString().slice(0, 10),
    dueDateIso: e.dueDate.toISOString().slice(0, 10),
    dueDateFormatted: formatDateBR(e.dueDate),
    installmentNumber: e.installmentNumber,
    installmentTotal: e.installmentTotal,
    walletName: e.wallet.name,
    categoryName: e.category.name,
    responsibleName: e.responsible.name,
    motivo:
      e.autoReviewReason ??
      (e.installmentNumber != null
        ? `Parcela ${e.installmentNumber} de ${e.installmentTotal} sem outras parcelas correspondentes encontradas (mesma carteira, categoria, descrição e valor).`
        : `Marcado como parcelamento (${e.installmentTotal}x) sem número de parcela definido.`),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Compromissos</h1>
        <p className="text-sm text-zinc-500">
          Lançamentos que precisam de revisão manual — parcelas sem par encontrado ou
          importados de OFX sem histórico de categoria — confirme que estão corretos
          ou corrija a linha.
        </p>
      </div>

      <CompromissosTabs active="incidentes" />

      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          De (vencimento)
          <input
            type="date"
            name="from"
            defaultValue={params.from}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Até (vencimento)
          <input
            type="date"
            name="to"
            defaultValue={params.to}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
          />
        </label>
        <button type="submit" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800">
          Filtrar
        </button>
        {(params.from || params.to) && (
          <a href="/compromissos/incidentes" className="rounded-lg px-3 py-1.5 text-zinc-500 hover:text-zinc-300">
            Limpar
          </a>
        )}
      </form>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
          Nenhum incidente pendente. Todos os parcelamentos importados foram combinados com sucesso.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            {cards.length} lançamento(s) precisam de revisão.
          </p>
          <IncidentsList
            cards={cards}
            wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
            categories={categories.map((c) => ({ id: c.id, nature: c.nature, name: c.name }))}
            subcategories={subcategories.map((s) => ({ id: s.id, categoryId: s.categoryId, name: s.name }))}
            people={people.map((p) => ({ id: p.id, name: p.name }))}
            statuses={statuses.map((s) => ({ code: s.code, label: s.labelPt }))}
          />
        </div>
      )}
    </div>
  );
}
