import { requireProfile, requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { currentStatementWindow } from "@/lib/finance/card";
import { QuickEntryForm } from "./QuickEntryForm";

export default async function NovoLancamentoPage() {
  const workspaceId = await requireWorkspaceId();
  await requireProfile();

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [wallets, categories, subcategories, people, recurrenceKinds, statuses, lastWalletEntry, lastResponsibleEntry] =
    await Promise.all([
      prisma.wallet.findMany({ where: { workspaceId, isActive: true }, orderBy: { name: "asc" } }),
      prisma.category.findMany({ orderBy: [{ nature: "asc" }, { sortOrder: "asc" }] }),
      prisma.subcategory.findMany({ where: { workspaceId: null }, orderBy: { name: "asc" } }),
      prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
      prisma.recurrenceKind.findMany({ orderBy: { code: "asc" } }),
      prisma.status.findMany(),
      // §12 — "carteira: a última usada nas últimas 24h".
      prisma.entry.findFirst({
        where: { workspaceId, createdAt: { gte: since24h } },
        orderBy: { createdAt: "desc" },
        select: { walletId: true },
      }),
      prisma.entry.findFirst({
        where: { workspaceId, createdAt: { gte: since24h } },
        orderBy: { createdAt: "desc" },
        select: { responsibleId: true },
      }),
    ]);

  const cardDueDates: Record<string, string> = {};
  for (const w of wallets) {
    if (w.kindCode === "CARTAO_CREDITO" && w.closingDay && w.dueDay) {
      const window = currentStatementWindow({ closingDay: w.closingDay, dueDay: w.dueDay }, today);
      cardDueDates[w.id] = window.dueDate.toISOString().slice(0, 10);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-lg font-semibold text-zinc-100">Novo lançamento</h1>
      <QuickEntryForm
        wallets={wallets.map((w) => ({ id: w.id, name: w.name, kindCode: w.kindCode }))}
        categories={categories.map((c) => ({ id: c.id, nature: c.nature, name: c.name }))}
        subcategories={subcategories.map((s) => ({ id: s.id, categoryId: s.categoryId, name: s.name }))}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        recurrenceKinds={recurrenceKinds.map((r) => ({ code: r.code, label: r.legacyLabel ?? r.code }))}
        statuses={statuses.map((s) => ({ code: s.code, label: s.labelPt }))}
        defaultWalletId={lastWalletEntry?.walletId ?? wallets[0]?.id ?? ""}
        defaultResponsibleId={lastResponsibleEntry?.responsibleId ?? people[0]?.id ?? ""}
        cardDueDates={cardDueDates}
        todayIso={today.toISOString().slice(0, 10)}
      />
    </div>
  );
}
