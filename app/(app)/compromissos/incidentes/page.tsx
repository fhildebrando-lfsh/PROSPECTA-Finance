import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { CompromissosTabs } from "../CompromissosTabs";
import { IncidentCard, type IncidentCardData } from "./IncidentCard";

/** §13 "Incidentes" — lançamentos parcelados (`installmentTotal >= 2`) que a
 * heurística de agrupamento (`lib/import/group-installments.ts`) não
 * conseguiu combinar com nenhuma parcela irmã: ou porque nenhum par existe
 * de verdade (parcela órfã, ex.: registro incompleto na fonte original), ou
 * porque o cluster ficou ambíguo. Mesma condição de `isInstallmentIncident()`
 * (`lib/finance/incidents.ts`), expressa aqui como filtro de banco. */
export default async function IncidentesPage() {
  const workspaceId = await requireWorkspaceId();

  const [incidents, wallets, categories, subcategories, people, statuses] = await Promise.all([
    prisma.entry.findMany({
      where: { workspaceId, installmentTotal: { gte: 2 }, groupId: null, incidentAcknowledgedAt: null },
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
      e.installmentNumber != null
        ? `Parcela ${e.installmentNumber} de ${e.installmentTotal} sem outras parcelas correspondentes encontradas (mesma carteira, categoria, descrição e valor).`
        : `Marcado como parcelamento (${e.installmentTotal}x) sem número de parcela definido.`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Compromissos</h1>
        <p className="text-sm text-zinc-500">
          Lançamentos parcelados que o sistema não conseguiu combinar automaticamente com o
          restante da série (§13) — confirme que estão corretos ou corrija a linha.
        </p>
      </div>

      <CompromissosTabs active="incidentes" />

      {cards.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
          Nenhum incidente pendente. Todos os parcelamentos importados foram combinados com sucesso.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            {cards.length} lançamento(s) precisam de revisão.
          </p>
          {cards.map((card) => (
            <IncidentCard
              key={card.id}
              data={card}
              wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
              categories={categories.map((c) => ({ id: c.id, nature: c.nature, name: c.name }))}
              subcategories={subcategories.map((s) => ({ id: s.id, categoryId: s.categoryId, name: s.name }))}
              people={people.map((p) => ({ id: p.id, name: p.name }))}
              statuses={statuses.map((s) => ({ code: s.code, label: s.labelPt }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
