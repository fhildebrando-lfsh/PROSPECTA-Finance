/**
 * Backfill único (mas reexecutável e idempotente) para o bug de vencimento
 * relatado pelo usuário em 2026-08-10: `cardStatementWindow`
 * (`lib/finance/card.ts`) sempre calculava o vencimento no mês SEGUINTE ao
 * fechamento, mesmo quando `dueDay > closingDay` (ex.: fecha dia 2, vence dia
 * 10 — o vencimento já cai depois do fechamento dentro do MESMO mês). A
 * função pura já foi corrigida; este script recalcula e corrige o `due_date`
 * de lançamentos gravados ANTES da correção, só para as carteiras de cartão
 * de crédito onde o bug de fato produzia data errada.
 *
 * Escopo: só `Wallet` com `kindCode=CARTAO_CREDITO`, `closingDay`/`dueDay`
 * preenchidos e `dueDay > closingDay` — a única configuração afetada pelo
 * bug (quando `dueDay <= closingDay`, o cálculo antigo já estava certo).
 *
 * **Cuidado com parcelas — bug real encontrado na primeira versão deste
 * script (corrigido, ver Registro Nº 043):** parcelas de uma mesma série
 * compartilham a MESMA `transactionDate` por design
 * (`lib/finance/installments.ts`, "transactionDate idêntica em todas as
 * parcelas") — só `dueDate` avança mês a mês por `installmentNumber`.
 * Recalcular `dueDate` direto de `transactionDate`, ignorando
 * `installmentNumber`, colapsa todas as parcelas de uma série de volta pro
 * vencimento da parcela 1. Por isso, para lançamentos com `installmentTotal`
 * preenchido, o vencimento certo é o da PRIMEIRA parcela da série (calculado
 * a partir da própria `transactionDate` do lançamento, que é o mesmo valor em
 * toda a série) mais `(installmentNumber - 1)` meses — mesma fórmula de
 * `generateInstallments`. Isso funciona tanto para séries geradas pelo
 * próprio sistema (transactionDate idêntica em todas) quanto para séries
 * importadas de CSV/OFX que foram agrupadas por heurística e podem ter
 * `transactionDate` ligeiramente diferente por linha (cada uma calculada a
 * partir da sua própria data, sem depender das outras linhas do grupo).
 *
 * Idempotente: recalcula e só grava quando o valor certo é diferente do que
 * já está no banco — rodar de novo depois de já ter corrigido tudo não faz
 * nada.
 *
 * Uso: `npx tsx scripts/backfill-card-due-dates.ts`
 */
import { prisma } from "@/lib/db/prisma";
import { addMonths } from "@/lib/finance/dates";
import { statementWindowForDate } from "@/lib/finance/card";

async function main() {
  const affectedWallets = await prisma.wallet.findMany({
    where: {
      kindCode: "CARTAO_CREDITO",
      closingDay: { not: null },
      dueDay: { not: null },
    },
    select: { id: true, name: true, closingDay: true, dueDay: true },
  });

  const walletsWithBug = affectedWallets.filter((w) => w.dueDay! > w.closingDay!);

  console.log(
    `${affectedWallets.length} carteira(s) de cartão de crédito configuradas; ${walletsWithBug.length} afetada(s) pelo bug (dueDay > closingDay).`,
  );

  let entriesChecked = 0;
  let entriesUpdated = 0;

  for (const wallet of walletsWithBug) {
    const config = { closingDay: wallet.closingDay!, dueDay: wallet.dueDay! };
    const entries = await prisma.entry.findMany({
      where: { walletId: wallet.id },
      select: { id: true, transactionDate: true, dueDate: true, installmentNumber: true },
    });

    console.log(`\nCarteira "${wallet.name}" (fecha dia ${config.closingDay}, vence dia ${config.dueDay}): ${entries.length} lançamento(s).`);

    for (const entry of entries) {
      entriesChecked += 1;
      const firstInstallmentDueDate = statementWindowForDate(config, entry.transactionDate).dueDate;
      const correctDueDate =
        entry.installmentNumber != null
          ? addMonths(firstInstallmentDueDate, entry.installmentNumber - 1)
          : firstInstallmentDueDate;
      if (correctDueDate.getTime() === entry.dueDate.getTime()) continue;

      await prisma.entry.update({ where: { id: entry.id }, data: { dueDate: correctDueDate } });
      entriesUpdated += 1;
      console.log(
        `  - ${entry.id}: ${entry.dueDate.toISOString().slice(0, 10)} -> ${correctDueDate.toISOString().slice(0, 10)}`,
      );
    }
  }

  console.log(`\nResultado: ${entriesChecked} lançamento(s) verificado(s), ${entriesUpdated} corrigido(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill falhou:", err);
    process.exit(1);
  });
