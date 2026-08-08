/**
 * Backfill único (mas reexecutável e idempotente) para o bug real registrado
 * em 2026-08-08: `app/api/import/commit/route.ts` nunca atribuía `group_id`
 * a lançamentos parcelados vindos de CSV — só `installmentNumber`/
 * `installmentTotal` eram gravados. Isso deixava "Despesas parceladas" e
 * "Dívidas" (ambas dependem de `openInstallmentGroups()`, que exige
 * `groupId`) cegas para praticamente todo o histórico real importado.
 *
 * Usa a mesma heurística de agrupamento do fluxo de importação
 * (`lib/import/group-installments.ts`): carteira + categoria + descrição
 * normalizada + total de parcelas, subdividido por valor da parcela
 * (tolerância de 2 centavos, para absorver só o resto da divisão do total
 * por N parcelas — não confunde duas compras de valores diferentes).
 * Clusters que ainda assim tiverem número de parcela repetido (mesmo valor
 * de parcela nas duas séries) ficam de fora e são listados no final para
 * revisão manual — o script nunca adivinha nesses casos.
 *
 * Idempotente: só olha entries com `groupId IS NULL`, então rodar de novo
 * depois de já ter corrigido tudo não faz nada.
 *
 * Uso: `npx tsx scripts/backfill-installment-groups.ts`
 */
import { prisma } from "@/lib/db/prisma";
import { clusterInstallmentRows } from "@/lib/import/group-installments";

async function main() {
  const candidates = await prisma.entry.findMany({
    where: { groupId: null, installmentTotal: { gte: 2 } },
    select: {
      id: true,
      workspaceId: true,
      walletId: true,
      categoryId: true,
      description: true,
      installmentNumber: true,
      installmentTotal: true,
      amount: true,
    },
  });

  console.log(`Encontrados ${candidates.length} lançamentos parcelados sem group_id.`);

  const { safe, ambiguous } = clusterInstallmentRows(candidates);
  const safeMultiRow = safe.filter((cluster) => cluster.length >= 2);

  let groupsCreated = 0;
  let entriesUpdated = 0;

  for (const cluster of safeMultiRow) {
    const workspaceId = cluster[0].workspaceId;
    const group = await prisma.entryGroup.create({ data: { workspaceId } });
    await prisma.entry.updateMany({
      where: { id: { in: cluster.map((c) => c.id) } },
      data: { groupId: group.id },
    });
    groupsCreated += 1;
    entriesUpdated += cluster.length;
  }

  console.log(`\nResultado:`);
  console.log(`- ${groupsCreated} grupos (EntryGroup) criados`);
  console.log(`- ${entriesUpdated} lançamentos atualizados com group_id`);
  console.log(`- ${safe.length - safeMultiRow.length} clusters de 1 linha só (parcela avulsa, sem grupo — esperado)`);

  if (ambiguous.length > 0) {
    console.log(`\n${ambiguous.length} cluster(s) AMBÍGUO(S) — número de parcela repetido, revisão manual:`);
    for (const cluster of ambiguous) {
      console.log(
        `  - workspace ${cluster[0].workspaceId} · carteira ${cluster[0].walletId} · "${cluster[0].description}" · ` +
          `${cluster[0].installmentTotal} parcelas · ${cluster.length} lançamentos · ids: ${cluster.map((c) => c.id).join(", ")}`,
      );
    }
  } else {
    console.log(`\nNenhum cluster ambíguo.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill falhou:", err);
    process.exit(1);
  });
