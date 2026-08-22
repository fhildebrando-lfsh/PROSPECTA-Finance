import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { annualCardSpend } from "@/lib/finance/card";
import { calculateCardBenefit } from "@/lib/finance/credit-card-benefit";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL } from "@/lib/format";

export default async function AnaliseBeneficiosPage() {
  const workspaceId = await requireWorkspaceId();
  // Registro Nº 108 — a feature existia no catálogo e nenhuma tela a
  // consultava: desmarcá-la em /admin/planos não tinha efeito nenhum.
  if (!(await hasFeature(workspaceId, "cartoes_analise_beneficios"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">A análise de benefícios do cartão está disponível a partir do plano Max.</p>
        <p className="mt-2">Ela confronta o que o cartão custa com o que ele devolve, para dizer se a anuidade se paga.</p>
      </div>
    );
  }

  const [wallets, dbEntries] = await Promise.all([
    prisma.wallet.findMany({
      where: { workspaceId, kindCode: "CARTAO_CREDITO", isActive: true },
      include: { institution: true, creditCard: true },
      orderBy: { name: "asc" },
    }),
    prisma.entry.findMany({ where: { workspaceId } }),
  ]);

  const entries = dbEntries.map(toFinanceEntry);
  const today = new Date();

  const eligible = wallets.filter(
    (w) => w.creditCard?.pointsPerRealSpent != null && w.creditCard?.pointValueEstimateBRL != null,
  );

  const rows = eligible
    .map((w) => {
      const annualSpend = annualCardSpend(entries, w.id, today);
      const result = calculateCardBenefit({
        annualSpend,
        annualFee: w.creditCard!.annualFee ?? new Decimal(0),
        pointsPerRealSpent: w.creditCard!.pointsPerRealSpent!,
        pointValueEstimateBRL: w.creditCard!.pointValueEstimateBRL!,
      });
      return {
        id: w.id,
        name: w.name,
        institutionName: w.institution?.name ?? null,
        annualFee: w.creditCard!.annualFee ?? new Decimal(0),
        annualSpend,
        ...result,
      };
    })
    .sort((a, b) => b.netBenefit.comparedTo(a.netBenefit));

  const notEligible = wallets.filter((w) => !eligible.some((e) => e.id === w.id));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500">
        Benefício líquido de cada cartão, calculado sobre o seu gasto real dos últimos 12 meses — não é uma promessa
        de marketing do banco. Positivo significa que os pontos/milhas ganhos valem mais do que a anuidade cobrada.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-indigo-300">
          Nenhum cartão com dados de pontos/anuidade preenchidos ainda — complete esses campos na edição de cada
          cartão para eles aparecerem aqui.
        </p>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
                <th className="px-3 py-2 font-medium">Cartão</th>
                <th className="px-3 py-2 text-right font-medium">Anuidade</th>
                <th className="px-3 py-2 text-right font-medium">Gasto anual real</th>
                <th className="px-3 py-2 text-right font-medium">Pontos ganhos</th>
                <th className="px-3 py-2 text-right font-medium">Valor do benefício</th>
                <th className="px-3 py-2 text-right font-medium">Benefício líquido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
                  <td className="px-3 py-2">
                    <Link href={`/cartoes/${r.id}`} className="hover:text-white hover:underline">
                      {r.name}
                    </Link>
                    {r.institutionName && <p className="text-xs text-zinc-500">{r.institutionName}</p>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrencyBRL(r.annualFee)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrencyBRL(r.annualSpend)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-400">
                    {r.pointsEarned.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrencyBRL(r.benefitValue)}</td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-semibold tabular-nums ${
                      r.netBenefit.isNegative() ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {formatCurrencyBRL(r.netBenefit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {notEligible.length > 0 && (
        <p className="text-xs text-zinc-500">
          Sem dados de pontos/anuidade ainda: {notEligible.map((w) => w.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
