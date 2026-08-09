import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { addMonths } from "@/lib/finance/dates";
import { cardStatementTotal, cardStatementWindow, currentStatementWindow } from "@/lib/finance/card";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { CurrencyInputBRL } from "@/components/ui/CurrencyInputBRL";
import { DayInput } from "@/components/ui/DayInput";
import { archiveCreditCard, deleteCreditCard, updateCreditCard } from "../actions";

const STATEMENT_HISTORY_MONTHS = 6;

function monthParam(year: number, monthIndex0: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

function parseMonthParam(raw: string | undefined, fallbackYear: number, fallbackMonthIndex0: number) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return { year: fallbackYear, month: fallbackMonthIndex0 };
}

export default async function CartaoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthRaw } = await searchParams;
  const workspaceId = await requireWorkspaceId();

  const [wallet, institutions, dbEntries] = await Promise.all([
    prisma.wallet.findFirst({
      where: { id, workspaceId, kindCode: "CARTAO_CREDITO" },
      include: { institution: true, creditCard: true },
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
    prisma.entry.findMany({
      where: { workspaceId, walletId: id },
      include: { category: true, responsible: true },
      orderBy: { transactionDate: "desc" },
    }),
  ]);

  if (!wallet) notFound();

  const entries = dbEntries.map(toFinanceEntry);
  const today = new Date();
  const hasCardConfig = Boolean(wallet.closingDay && wallet.dueDay);
  const cardConfig = hasCardConfig ? { closingDay: wallet.closingDay!, dueDay: wallet.dueDay! } : null;

  const currentWindow = cardConfig ? currentStatementWindow(cardConfig, today) : null;
  const currentTotal = currentWindow ? cardStatementTotal(entries, wallet.id, currentWindow) : null;

  // Seletor de mês de fatura (§ pedido do usuário: conferir qualquer fatura, passada ou
  // futura, lançamento a lançamento contra a fatura real do banco) — por padrão mostra a
  // fatura vigente, mas navega livremente via "?month=AAAA-MM".
  const fallbackYear = currentWindow ? currentWindow.windowEnd.getUTCFullYear() : today.getUTCFullYear();
  const fallbackMonth = currentWindow ? currentWindow.windowEnd.getUTCMonth() : today.getUTCMonth();
  const { year: selectedYear, month: selectedMonth } = parseMonthParam(monthRaw, fallbackYear, fallbackMonth);
  const selectedWindow = cardConfig ? cardStatementWindow(cardConfig, selectedYear, selectedMonth) : null;
  const selectedEntries = selectedWindow
    ? dbEntries.filter((e) => e.transactionDate >= selectedWindow.windowStart && e.transactionDate <= selectedWindow.windowEnd)
    : [];
  const selectedTotal = selectedWindow ? cardStatementTotal(entries, wallet.id, selectedWindow) : null;
  const isSelectedVigente = Boolean(
    currentWindow && selectedWindow && selectedWindow.windowEnd.getTime() === currentWindow.windowEnd.getTime(),
  );
  const prevMonth = selectedMonth === 0 ? { year: selectedYear - 1, month: 11 } : { year: selectedYear, month: selectedMonth - 1 };
  const nextMonth = selectedMonth === 11 ? { year: selectedYear + 1, month: 0 } : { year: selectedYear, month: selectedMonth + 1 };

  const statementHistory = cardConfig
    ? Array.from({ length: STATEMENT_HISTORY_MONTHS }, (_, i) => {
        const referenceDate = addMonths(today, -i);
        const window = cardStatementWindow(cardConfig, referenceDate.getUTCFullYear(), referenceDate.getUTCMonth());
        return { window, total: cardStatementTotal(entries, wallet.id, window) };
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cartoes" className="text-sm text-indigo-300 hover:text-white">
          ← Meus Cartões
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
          {wallet.creditCard?.imageUrl ? (
            <Image src={wallet.creditCard.imageUrl} alt={wallet.name} fill sizes="128px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-700 to-indigo-950 text-2xl font-semibold text-indigo-200">
              {(wallet.institution?.name ?? wallet.name).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-100">{wallet.name}</h2>
          {wallet.institution && <p className="text-xs text-indigo-300">{wallet.institution.name}</p>}
        </div>
        {currentWindow && currentTotal && (
          <div className="text-right">
            <p className="text-xs text-indigo-300">Fatura vigente</p>
            <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(currentTotal.abs())}</p>
            <p className="text-xs text-zinc-500">vence {formatDateBR(currentWindow.dueDate)}</p>
          </div>
        )}
      </div>

      {!hasCardConfig && (
        <p className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Preencha o dia de fechamento e de vencimento abaixo para ver a fatura deste cartão.
        </p>
      )}

      {cardConfig && selectedWindow && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-300">
              Fatura de {formatDateBR(selectedWindow.windowEnd)}
              {isSelectedVigente && <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">vigente</span>}
              {" — "}
              {formatDateBR(selectedWindow.windowStart)} a {formatDateBR(selectedWindow.windowEnd)}, vence{" "}
              {formatDateBR(selectedWindow.dueDate)}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <Link
                href={`/cartoes/${wallet.id}?month=${monthParam(prevMonth.year, prevMonth.month)}`}
                className="rounded-lg border border-indigo-900/50 px-2 py-1 text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
              >
                ← Anterior
              </Link>
              {!isSelectedVigente && (
                <Link
                  href={`/cartoes/${wallet.id}`}
                  className="rounded-lg border border-indigo-900/50 px-2 py-1 text-indigo-300 hover:bg-indigo-900/50 hover:text-white"
                >
                  Vigente
                </Link>
              )}
              <Link
                href={`/cartoes/${wallet.id}?month=${monthParam(nextMonth.year, nextMonth.month)}`}
                className="rounded-lg border border-indigo-900/50 px-2 py-1 text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
              >
                Próximo →
              </Link>
            </div>
          </div>
          {selectedTotal && (
            <p className="mb-2 font-mono text-lg tabular-nums text-zinc-100">Total: {formatCurrencyBRL(selectedTotal.abs())}</p>
          )}
          {selectedEntries.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhum lançamento nesta fatura.</p>
          ) : (
            <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
                    <th className="px-3 py-2 font-medium">Compra</th>
                    <th className="px-3 py-2 font-medium">Descrição</th>
                    <th className="px-3 py-2 font-medium">Categoria</th>
                    <th className="px-3 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.map((e) => (
                    <tr key={e.id} className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
                      <td className="px-3 py-2">{formatDateBR(e.transactionDate)}</td>
                      <td className="px-3 py-2 truncate">
                        {e.description}
                        {e.installmentTotal && (
                          <span className="ml-1 text-xs text-zinc-500">
                            ({e.installmentNumber}/{e.installmentTotal})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-400">{e.category.name}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-red-400">
                        {formatCurrencyBRL(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {statementHistory.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Histórico de faturas</h2>
          <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
                  <th className="px-3 py-2 font-medium">Fechamento</th>
                  <th className="px-3 py-2 font-medium">Vencimento</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {statementHistory.map(({ window, total }) => (
                  <tr key={window.windowEnd.toISOString()} className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/cartoes/${wallet.id}?month=${monthParam(window.windowEnd.getUTCFullYear(), window.windowEnd.getUTCMonth())}`}
                        className="hover:text-white hover:underline"
                      >
                        {formatDateBR(window.windowEnd)}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{formatDateBR(window.dueDate)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-red-400">
                      {formatCurrencyBRL(total.abs())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-1 text-sm font-medium text-zinc-300">Importar fatura em PDF</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Envie a fatura em PDF deste cartão — o sistema lança as compras certinho, na carteira certa.
        </p>
        <a
          href={`/lancamentos/importar?walletId=${wallet.id}&format=pdf`}
          className="inline-block rounded-lg border border-indigo-400/60 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-500/20"
        >
          Importar fatura
        </a>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Editar cartão</h2>
        <form action={updateCreditCard} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="walletId" value={wallet.id} />
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome do cartão *
            <input
              name="name"
              defaultValue={wallet.name}
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Instituição financeira
            <select
              name="institutionId"
              defaultValue={wallet.institutionId ?? ""}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            >
              <option value="">— selecione —</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
            Não achou o banco? Digite o nome (cria uma instituição nova)
            <input name="newInstitutionName" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Dia de fechamento *
            <DayInput
              name="closingDay"
              defaultValue={wallet.closingDay}
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Dia de vencimento *
            <DayInput
              name="dueDay"
              defaultValue={wallet.dueDay}
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Limite de crédito (R$)
            <CurrencyInputBRL
              name="creditLimit"
              defaultValue={wallet.creditLimit?.toString()}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Anuidade (R$/ano)
            <CurrencyInputBRL
              name="annualFee"
              defaultValue={wallet.creditCard?.annualFee?.toString()}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Condição de isenção da anuidade
            <input
              name="annualFeeWaiverNote"
              defaultValue={wallet.creditCard?.annualFeeWaiverNote ?? ""}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Programa de pontos/milhas
            <input
              name="rewardsProgramName"
              defaultValue={wallet.creditCard?.rewardsProgramName ?? ""}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Pontos por R$ gasto
            <input
              type="number"
              name="pointsPerRealSpent"
              min="0"
              step="0.0001"
              defaultValue={wallet.creditCard?.pointsPerRealSpent?.toString() ?? ""}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Valor estimado de cada ponto (R$)
            <input
              type="number"
              name="pointValueEstimateBRL"
              min="0"
              step="0.0001"
              defaultValue={wallet.creditCard?.pointValueEstimateBRL?.toString() ?? ""}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
            Trocar imagem (PNG, JPEG ou WebP, até 2MB)
            <input
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 file:mr-2 file:rounded file:border-0 file:bg-indigo-500/20 file:px-2 file:py-1 file:text-indigo-100"
            />
          </label>
          {wallet.creditCard?.imageUrl && (
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" name="removeImage" value="true" />
              Remover imagem atual
            </label>
          )}
          <button type="submit" className={`self-start ${BTN_PRIMARY} sm:col-span-2`}>
            Salvar
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900/50 bg-[#131A47] p-4">
        <div>
          <h2 className="text-sm font-medium text-red-300">{wallet.isActive ? "Arquivar" : "Reativar"} ou excluir</h2>
          <p className="text-xs text-zinc-400">
            Arquivar tira o cartão da lista sem perder o histórico. Excluir só é permitido se o cartão nunca teve
            lançamento.
          </p>
        </div>
        <div className="flex gap-2">
          <form action={archiveCreditCard}>
            <input type="hidden" name="walletId" value={wallet.id} />
            <input type="hidden" name="isActive" value={String(wallet.isActive)} />
            <button type="submit" className={BTN_GHOST}>
              {wallet.isActive ? "Arquivar" : "Reativar"}
            </button>
          </form>
          <form action={deleteCreditCard}>
            <input type="hidden" name="walletId" value={wallet.id} />
            <button type="submit" className={BTN_DANGER}>
              Excluir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
