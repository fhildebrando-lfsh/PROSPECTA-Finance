import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  investmentAcquisitionValue,
  investmentGainLoss,
  investmentIncomeTotal,
  investmentPositionValue,
  investmentReturnPct,
  investmentTotalReturnPct,
  type InvestmentPositionEntry,
} from "@/lib/finance/investment";
import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { InvestmentEvolutionChart, type InvestmentEvolutionPoint } from "@/components/charts/InvestmentEvolutionChart";
import {
  archiveInvestmentAction,
  deleteInvestmentAction,
  generateRentIncomeAction,
  registerInvestmentEventAction,
  registerInvestmentIncomeAction,
} from "../actions";
import { InvestmentEditForm } from "../InvestmentEditForm";

const EVENT_CATEGORY_OPTIONS = [
  { slug: "ganho_de_capital", label: "Ganho de Capital" },
  { slug: "perdas", label: "Perda" },
  { slug: "dividendos", label: "Dividendo" },
  { slug: "juros", label: "Juro" },
  { slug: "retiradas", label: "Retirada" },
  { slug: "impostos", label: "Imposto" },
  { slug: "cambio", label: "Variação Cambial" },
] as const;

const INCOME_CATEGORY_OPTIONS = [
  { slug: "aluguel", label: "Aluguel" },
  { slug: "participacao_nos_lucros", label: "Participação nos Lucros" },
] as const;

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = await requireWorkspaceId();

  const [investment, classes, people, realWallets, entries] = await Promise.all([
    prisma.investment.findFirst({ where: { id, workspaceId }, include: { class: true, wallet: true } }),
    prisma.investmentClass.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.wallet.findMany({
      where: { workspaceId, kindCode: { not: "CONTA_INVESTIMENTO" }, isPseudoWallet: false, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.entry.findMany({
      where: { workspaceId, investmentId: id },
      include: { category: true, responsible: true },
      orderBy: { transactionDate: "asc" },
    }),
  ]);

  if (!investment) notFound();

  const positionEntries = entries.filter((e) => e.nature === "INVESTIMENTO");
  const incomeEntries = entries.filter((e) => e.nature === "RECEITA");

  const positionForCalc: InvestmentPositionEntry[] = positionEntries.map((e) => ({
    amount: e.amount,
    categorySlug: e.category.slug,
  }));

  const acquisitionValue = investmentAcquisitionValue(positionForCalc);
  const currentValue = investmentPositionValue(positionForCalc);
  const gainLoss = investmentGainLoss(positionForCalc);
  const returnPct = investmentReturnPct(positionForCalc);
  const incomeTotal = investmentIncomeTotal(incomeEntries);
  const totalReturnPct = investmentTotalReturnPct(positionForCalc, incomeEntries);

  let running = new Decimal(0);
  const evolutionData: InvestmentEvolutionPoint[] = positionEntries.map((e) => {
    running = running.plus(e.amount);
    return { label: formatDateBR(e.transactionDate), posicao: running.toNumber() };
  });

  const history = [...entries].sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

  const isImoveis = investment.classCode === "IMOVEIS";
  const canDelete = entries.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/investimentos" className="text-sm text-indigo-300 hover:text-white">
          ← Carteira
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            {investment.name}
            {!investment.isActive && <span className="ml-2 text-xs font-normal text-zinc-500">(arquivado)</span>}
          </h2>
          <p className="text-xs text-indigo-300">
            {investment.class.labelPt} · {investment.wallet.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-right">
          <div>
            <p className="text-xs text-indigo-300">Investido</p>
            <p className="font-mono text-lg tabular-nums text-zinc-100">{formatCurrencyBRL(acquisitionValue)}</p>
          </div>
          <div>
            <p className="text-xs text-indigo-300">Valor atual</p>
            <p className="font-mono text-lg tabular-nums text-zinc-100">{formatCurrencyBRL(currentValue)}</p>
          </div>
          <div>
            <p className="text-xs text-indigo-300">Ganho de capital</p>
            <p className={`font-mono text-lg tabular-nums ${gainLoss.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
              {formatCurrencyBRL(gainLoss)}
            </p>
          </div>
          <div>
            <p className="text-xs text-indigo-300">Rentabilidade</p>
            <p className={`font-mono text-lg tabular-nums ${returnPct.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
              {returnPct.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-indigo-300">Renda recebida</p>
            <p className="font-mono text-lg tabular-nums text-zinc-100">{formatCurrencyBRL(incomeTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-indigo-300">Retorno total</p>
            <p className={`font-mono text-lg tabular-nums ${totalReturnPct.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
              {totalReturnPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {evolutionData.length > 1 && (
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Evolução da posição</h2>
          <InvestmentEvolutionChart data={evolutionData} />
        </div>
      )}

      <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Natureza</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Responsável</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
                <td className="px-3 py-2">{formatDateBR(h.transactionDate)}</td>
                <td className="px-3 py-2 text-xs text-zinc-400">{h.nature === "RECEITA" ? "Renda" : "Posição"}</td>
                <td className="px-3 py-2 text-xs text-zinc-400">{h.category.name}</td>
                <td className="px-3 py-2 text-xs text-zinc-400">{h.responsible.name}</td>
                <td className={`px-3 py-2 text-right font-mono tabular-nums ${h.amount.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
                  {formatCurrencyBRL(h.amount)}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-xs text-zinc-500">
                  Nenhum lançamento ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Registrar evento da posição</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Ganho/perda de capital, dividendo, juro, retirada, imposto ou variação cambial — fica ligado à posição, na
          própria carteira {investment.wallet.name}.
        </p>
        <form action={registerInvestmentEventAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="investmentId" value={investment.id} />
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Categoria
            <select name="categorySlug" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              {EVENT_CATEGORY_OPTIONS.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Valor
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              required
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="negative" value="true" />
            Câmbio negativo
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Responsável
            <select name="responsibleId" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Registrar
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Registrar renda recebida</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Aluguel ou distribuição de lucro que caiu de verdade numa conta — escolha em qual carteira o dinheiro
          entrou.
        </p>
        <form action={registerInvestmentIncomeAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="investmentId" value={investment.id} />
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Categoria
            <select name="categorySlug" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              {INCOME_CATEGORY_OPTIONS.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Carteira de destino
            <select name="walletId" required defaultValue="" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              <option value="">— selecione —</option>
              {realWallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Valor
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              required
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Responsável
            <select name="responsibleId" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Registrar
          </button>
        </form>
      </div>

      {isImoveis && (
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Gerar lançamentos recorrentes de aluguel</h2>
          <p className="mb-3 text-xs text-zinc-500">Cria a série mensal de aluguel a receber, a partir da data de início.</p>
          <form action={generateRentIncomeAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="investmentId" value={investment.id} />
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Carteira de destino
              <select name="walletId" required defaultValue="" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
                <option value="">— selecione —</option>
                {realWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Valor mensal
              <input
                type="number"
                name="monthlyAmount"
                min="0"
                step="0.01"
                required
                defaultValue={
                  investment.details && typeof investment.details === "object"
                    ? (investment.details as unknown as Record<string, string>).aluguelMensalEsperado
                    : undefined
                }
                className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Início
              <input
                type="date"
                name="startDate"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Responsável
              <select name="responsibleId" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className={BTN_PRIMARY}>
              Gerar
            </button>
          </form>
        </div>
      )}

      <InvestmentEditForm
        investment={{
          id: investment.id,
          name: investment.name,
          classCode: investment.classCode,
          details: (investment.details as unknown as Record<string, string>) ?? {},
        }}
        classes={classes.map((c) => ({ code: c.code, labelPt: c.labelPt, groupLabel: c.groupLabel }))}
      />

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-1 text-sm font-medium text-zinc-300">{investment.isActive ? "Arquivar investimento" : "Reativar investimento"}</h2>
        <p className="mb-3 text-xs text-zinc-400">
          {investment.isActive
            ? "Tira a posição da lista principal sem apagar o histórico — use quando encerrar a aplicação (ex.: vendeu tudo)."
            : "Volta a posição para a lista principal."}
        </p>
        <form action={archiveInvestmentAction}>
          <input type="hidden" name="id" value={investment.id} />
          <input type="hidden" name="isActive" value={String(investment.isActive)} />
          <button type="submit" className={BTN_GHOST}>
            {investment.isActive ? "Arquivar" : "Reativar"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-red-900/50 bg-[#131A47] p-4">
        <h2 className="mb-1 text-sm font-medium text-red-300">Excluir investimento</h2>
        <p className="mb-3 text-xs text-zinc-400">
          {canDelete
            ? "Apaga a posição — não pode ser desfeito."
            : "Não dá pra excluir — esse investimento já tem lançamentos. Arquive em vez de excluir."}
        </p>
        <form action={deleteInvestmentAction}>
          <input type="hidden" name="id" value={investment.id} />
          <button type="submit" disabled={!canDelete} className={`${BTN_DANGER} disabled:cursor-not-allowed disabled:opacity-40`}>
            Excluir permanentemente
          </button>
        </form>
      </div>
    </div>
  );
}
