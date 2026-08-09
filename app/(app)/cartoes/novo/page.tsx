import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { createCreditCard } from "../actions";

export default async function NovoCartaoPage() {
  await requireWorkspaceId();
  const institutions = await prisma.institution.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cartoes" className="text-sm text-indigo-300 hover:text-white">
          ← Meus Cartões
        </Link>
      </div>

      <form action={createCreditCard} className="flex flex-col gap-6">
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Dados do cartão</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Nome do cartão *
              <input
                name="name"
                required
                placeholder='Ex.: "Nubank Ultravioleta"'
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Instituição financeira
              <select
                name="institutionId"
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
              <input
                name="newInstitutionName"
                placeholder="Deixe em branco se já selecionou acima"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
              Imagem do cartão (opcional — PNG, JPEG ou WebP, até 2MB)
              <input
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 file:mr-2 file:rounded file:border-0 file:bg-indigo-500/20 file:px-2 file:py-1 file:text-indigo-100"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Fatura</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Dia de fechamento *
              <input
                type="number"
                name="closingDay"
                min="1"
                max="28"
                required
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Dia de vencimento *
              <input
                type="number"
                name="dueDay"
                min="1"
                max="28"
                required
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Limite de crédito (R$)
              <input
                type="number"
                name="creditLimit"
                min="0"
                step="0.01"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-1 text-sm font-medium text-zinc-300">Anuidade e programa de pontos</h2>
          <p className="mb-3 text-xs text-zinc-500">
            Opcional — preencha para este cartão entrar na Análise de Benefícios (comparação de custo-benefício).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Anuidade (R$/ano)
              <input
                type="number"
                name="annualFee"
                min="0"
                step="0.01"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Condição de isenção da anuidade
              <input
                name="annualFeeWaiverNote"
                placeholder='Ex.: "isento gastando R$ 1.500/mês"'
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Programa de pontos/milhas
              <input
                name="rewardsProgramName"
                placeholder='Ex.: "Livelo", "Smiles", "Cashback"'
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
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
          </div>
        </div>

        <button type="submit" className={`self-start ${BTN_PRIMARY}`}>
          Criar cartão
        </button>
      </form>
    </div>
  );
}
