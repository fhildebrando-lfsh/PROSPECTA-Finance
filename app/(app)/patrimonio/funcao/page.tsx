import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { investmentPositionValue } from "@/lib/finance/investment";
import { walletBalance } from "@/lib/finance/balance";
import { Decimal } from "@/lib/finance/types";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { formatCurrencyBRL } from "@/lib/format";
import {
  buildPatrimonyItems,
  classifiedItems,
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
    // dívida não recebe função patrimonial. `isPseudoWallet` também sai — a
    // pseudo-conta "Patrimônio" (§9) é um artefato interno da planilha
    // original, não um lugar onde alguém guarda dinheiro; deixá-la na lista
    // dava ao usuário uma linha de R$ 0,00 classificável que ele não tem como
    // arquivar por nenhuma tela.
    prisma.wallet.findMany({
      where: { workspaceId, isActive: true, isPseudoWallet: false, kind: { isLiability: false } },
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

  // O desconto de posições abrigadas (dupla contagem) vive em
  // `buildPatrimonyItems`, não aqui — ver o comentário lá.
  const items: PatrimonyItem[] = buildPatrimonyItems({
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      value: assetCurrentValue(assetEntriesById.get(a.id) ?? []),
      funcao: a.funcaoPatrimonial,
    })),
    investments: investments.map((i) => ({
      id: i.id,
      name: i.name,
      walletId: i.walletId,
      value: investmentPositionValue(investmentEntriesById.get(i.id) ?? []),
      funcao: i.funcaoPatrimonial,
    })),
    wallets: wallets.map((w) => ({
      id: w.id,
      name: w.name,
      balance: walletBalance(financeEntries, w.id, today),
      funcao: w.funcaoPatrimonial,
    })),
  });

  const map = computeFunctionMap(items);
  const pendentes = unclassifiedFindings(items);
  const classificados = classifiedItems(items);

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

      {/* Duas tabelas com propósitos distintos, a pedido do usuário (2026-08-16):
          uma fila de trabalho que esvazia conforme se classifica, e um registro
          permanente do que já está classificado. A versão anterior tinha uma
          lista de pendentes + uma tabela com TUDO (classificado e não), então
          classificar na tabela de baixo fazia a linha sumir da lista de cima e
          a página inteira saltar — dava a impressão de que o item tinha
          desaparecido. Agora o item só troca de tabela, e nunca some. */}
      <PatrimonySection
        title="Pendentes de classificação"
        subtitle="Do maior valor para o menor — o que mais pesa é o que mais vale classificar primeiro. Ao definir a função, o item passa para a tabela de baixo."
        emptyLabel="Nada pendente — todo o patrimônio já tem função definida."
        rows={pendentes}
        highlight
      />

      <PatrimonySection
        title="Todo o patrimônio classificado"
        subtitle="A função pode ser trocada a qualquer momento — um carro que hoje é de uso pode virar bem de venda amanhã. Escolher “— sem função —” devolve o item para a tabela de cima."
        emptyLabel="Nenhum item classificado ainda."
        rows={classificados}
      />
    </div>
  );
}

function PatrimonySection({
  title,
  subtitle,
  emptyLabel,
  rows,
  highlight = false,
}: {
  title: string;
  subtitle: string;
  emptyLabel: string;
  rows: PatrimonyItem[];
  highlight?: boolean;
}) {
  return (
    <div>
      <h2 className={`text-sm font-medium ${highlight ? "text-amber-200" : "text-zinc-300"}`}>
        {title} <span className="text-xs font-normal text-zinc-500">· {rows.length} item(ns)</span>
      </h2>
      <p className="mb-2 mt-1 max-w-3xl text-xs text-zinc-500">{subtitle}</p>
      <div
        className={`overflow-x-auto rounded-xl border ${highlight ? "border-amber-900/50" : "border-indigo-900/50"}`}
      >
        <table className="w-full min-w-[36rem] text-sm">
          <thead className={`text-xs ${highlight ? "bg-amber-950/20 text-amber-300" : "bg-[#131A47] text-indigo-300"}`}>
            <tr>
              <th className="px-3 py-2 text-left font-medium">Item</th>
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
              <th className="px-3 py-2 text-left font-medium">Função</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-900/40 bg-[#131A47]/50">
            {rows.map((i) => (
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-sm text-indigo-300">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
