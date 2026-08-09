import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { cardStatementTotal, currentStatementWindow } from "@/lib/finance/card";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { CreditCardTile } from "./CreditCardTile";

export default async function CartoesPage() {
  const workspaceId = await requireWorkspaceId();

  const [wallets, dbEntries] = await Promise.all([
    prisma.wallet.findMany({
      where: { workspaceId, kindCode: "CARTAO_CREDITO" },
      include: { institution: true, creditCard: true },
      orderBy: { name: "asc" },
    }),
    prisma.entry.findMany({ where: { workspaceId } }),
  ]);

  const entries = dbEntries.map(toFinanceEntry);
  const today = new Date();

  const cards = wallets.map((w) => {
    let currentInvoice: { total: string; dueDate: string } | null = null;
    if (w.closingDay && w.dueDay) {
      const window = currentStatementWindow({ closingDay: w.closingDay, dueDay: w.dueDay }, today);
      const total = cardStatementTotal(entries, w.id, window);
      currentInvoice = { total: formatCurrencyBRL(total.abs()), dueDate: formatDateBR(window.dueDate) };
    }
    return {
      id: w.id,
      name: w.name,
      institutionName: w.institution?.name ?? null,
      imageUrl: w.creditCard?.imageUrl ?? null,
      isActive: w.isActive,
      creditLimit: w.creditLimit ? formatCurrencyBRL(w.creditLimit) : null,
      currentInvoice,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Fatura vigente de cada cartão, num só lugar — clique num cartão para ver o histórico completo.
        </p>
        <a
          href="/cartoes/novo"
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
        >
          + Novo cartão
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <CreditCardTile key={c.id} card={c} />
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-indigo-300">
            Nenhum cartão de crédito cadastrado ainda —{" "}
            <a href="/cartoes/novo" className="underline hover:text-white">
              cadastre o primeiro
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
