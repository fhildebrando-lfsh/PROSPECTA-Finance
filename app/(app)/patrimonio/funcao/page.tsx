import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { investmentPositionValue } from "@/lib/finance/investment";
import { walletBalance } from "@/lib/finance/balance";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { formatCurrencyBRL } from "@/lib/format";
import {
  computeFunctionMap,
  unclassifiedFindings,
  FUNCOES,
  type PatrimonyItem,
} from "@/lib/method/patrimony-function";
import { FunctionSelect } from "./FunctionSelect";

const FUNCAO_LABELS: Record<string, string> = {
  PROTECAO: "Proteção",
  LIQUIDEZ_OPERACIONAL: "Liquidez operacional",
  OBJETIVOS: "Objetivos",
  LONGEVIDADE: "Longevidade",
  CRESCIMENTO: "Crescimento",
  USO: "Uso",
  SUCESSAO: "Sucessão",
};

const FUNCAO_HINTS: Record<string, string> = {
  PROTECAO: "cobre imprevisto sem desmontar o resto",
  LIQUIDEZ_OPERACIONAL: "dinheiro do dia a dia, disponível na hora",
  OBJETIVOS: "guardado para algo com data e nome",
  LONGEVIDADE: "sustenta você quando a renda do trabalho parar",
  CRESCIMENTO: "aceita oscilar para crescer no longo prazo",
  USO: "serve para usar, não para render",
  SUCESSAO: "pensado para atravessar gerações",
};

const KIND_LABELS: Record<string, string> = {
  BEM: "Bem",
  INVESTIMENTO: "Investimento",
  CARTEIRA: "Carteira",
};

const FUNCTION_OPTIONS = FUNCOES.map((f) => ({ value: f, label: FUNCAO_LABELS[f] }));

/**
 * Etapa 7 do Método (§13.4) — classificação funcional do patrimônio e o
 * achado automático de "ativo sem função". **Não** é o MFP completo
 * (`mfp_diagnostico`, feature de método, Etapa 14): esta tela mostra a
 * distribuição e o que falta classificar, sem opinar se a distribuição está
 * certa — julgar a composição é aconselhamento, exige consultor (§3.1/P2).
 */
export default async function FuncaoPatrimonialPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "patrimonio_funcao"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">A classificação funcional do patrimônio está disponível a partir do plano Max.</p>
        <p className="mt-2">
          Em vez de só &quot;quanto eu tenho&quot;, responde &quot;para que serve cada parte&quot; — proteção, liquidez,
          objetivos, longevidade, crescimento, uso e sucessão — e aponta o que ainda está sem função definida.
        </p>
      </div>
    );
  }

  const today = new Date();
  const [assets, investments, wallets, assetEntries, investmentEntries, walletEntries] = await Promise.all([
    prisma.asset.findMany({ where: { workspaceId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.investment.findMany({ where: { workspaceId, isActive: true }, orderBy: { name: "asc" } }),
    // Cartão de crédito e afins ficam de fora por `isLiability` (dado do
    // catálogo `WalletKind`, nunca uma lista de códigos escrita à mão aqui):
    // dívida não recebe função patrimonial.
    prisma.wallet.findMany({
      where: { workspaceId, isActive: true, kind: { isLiability: false } },
      orderBy: { name: "asc" },
    }),
    prisma.entry.findMany({
      where: { workspaceId, assetId: { not: null } },
      select: { id: true, assetId: true, amount: true, statusCode: true },
    }),
    prisma.entry.findMany({
      where: { workspaceId, investmentId: { not: null }, nature: "INVESTIMENTO" },
      select: { investmentId: true, amount: true, category: { select: { slug: true } } },
    }),
    // Saldo de carteira e valor de bem/investimento nunca se sobrepõem: os
    // lançamentos de patrimônio usam AQUISICAO/ATUALIZACAO, que
    // `SETTLED_FOR_BALANCE` (PAGO/RECEBIDO/ISENTO) exclui de propósito —
    // somar os três aqui não conta nada duas vezes.
    prisma.entry.findMany({
      where: { workspaceId },
      select: {
        id: true,
        walletId: true,
        categoryId: true,
        nature: true,
        amount: true,
        transactionDate: true,
        dueDate: true,
        statusCode: true,
        recurrenceCode: true,
        isFixedOverride: true,
        groupId: true,
      },
    }),
  ]);

  const assetEntriesById = new Map<string, AssetValuationEntry[]>();
  for (const e of assetEntries) {
    if (!e.assetId) continue;
    const list = assetEntriesById.get(e.assetId) ?? [];
    list.push({ id: e.id, assetId: e.assetId, amount: e.amount, status: e.statusCode as AssetValuationEntry["status"] });
    assetEntriesById.set(e.assetId, list);
  }

  const investmentEntriesById = new Map<string, { amount: (typeof investmentEntries)[number]["amount"]; categorySlug: string }[]>();
  for (const e of investmentEntries) {
    if (!e.investmentId) continue;
    const list = investmentEntriesById.get(e.investmentId) ?? [];
    list.push({ amount: e.amount, categorySlug: e.category.slug });
    investmentEntriesById.set(e.investmentId, list);
  }

  const financeEntries = walletEntries.map(toFinanceEntry);

  const items: PatrimonyItem[] = [
    ...assets.map((a) => ({
      id: a.id,
      kind: "BEM" as const,
      name: a.name,
      value: assetCurrentValue(assetEntriesById.get(a.id) ?? []),
      funcao: a.funcaoPatrimonial,
    })),
    ...investments.map((i) => ({
      id: i.id,
      kind: "INVESTIMENTO" as const,
      name: i.name,
      value: investmentPositionValue(investmentEntriesById.get(i.id) ?? []),
      funcao: i.funcaoPatrimonial,
    })),
    ...wallets.map((w) => ({
      id: w.id,
      kind: "CARTEIRA" as const,
      name: w.name,
      value: walletBalance(financeEntries, w.id, today),
      funcao: w.funcaoPatrimonial,
    })),
  ];

  const map = computeFunctionMap(items);
  const findings = unclassifiedFindings(items);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-zinc-500">
        Cada parte do seu patrimônio existe para alguma coisa. Aqui você define para quê — e vê o que ainda não tem
        função definida. Esta tela mostra a distribuição; ela não julga se está certa.
      </p>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <p className="text-xs text-indigo-300">Patrimônio considerado (bens, investimentos e carteiras ativas)</p>
        <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(map.total)}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {map.slices.map((slice) => (
          <div key={slice.funcao} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <p className="text-xs text-indigo-300">{FUNCAO_LABELS[slice.funcao]}</p>
            <p className="font-mono text-lg tabular-nums text-zinc-100">{formatCurrencyBRL(slice.total)}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {slice.percent.toFixed(1)}% · {slice.itemCount} item(ns)
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">{FUNCAO_HINTS[slice.funcao]}</p>
          </div>
        ))}
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
          <p className="text-xs text-amber-300">Sem função definida</p>
          <p className="font-mono text-lg tabular-nums text-zinc-100">{formatCurrencyBRL(map.semFuncao)}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {map.semFuncaoPercent.toFixed(1)}% · {map.semFuncaoCount} item(ns)
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">nunca somado dentro das outras sete</p>
        </div>
      </div>

      {findings.length > 0 && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-4">
          <h2 className="text-sm font-medium text-amber-200">
            {findings.length} item(ns) sem função definida
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Do maior valor para o menor — o que mais pesa é o que mais vale classificar primeiro.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {findings.map((f) => (
              <li key={`${f.kind}-${f.id}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-zinc-200">
                  {f.name} <span className="text-xs text-zinc-500">· {KIND_LABELS[f.kind]}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-zinc-400">{formatCurrencyBRL(f.value)}</span>
                  <FunctionSelect id={f.id} kind={f.kind} current="" options={FUNCTION_OPTIONS} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Todo o patrimônio</h2>
        <div className="overflow-x-auto rounded-xl border border-indigo-900/50">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-[#131A47] text-xs text-indigo-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 text-left font-medium">Função</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-900/40 bg-[#131A47]/50">
              {items.map((i) => (
                <tr key={`${i.kind}-${i.id}`}>
                  <td className="px-3 py-2 text-zinc-200">{i.name}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{KIND_LABELS[i.kind]}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-zinc-300">
                    {formatCurrencyBRL(i.value)}
                  </td>
                  <td className="px-3 py-2">
                    <FunctionSelect id={i.id} kind={i.kind} current={i.funcao ?? ""} options={FUNCTION_OPTIONS} />
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-sm text-indigo-300">
                    Nenhum bem, investimento ou carteira ativa para classificar ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
