import type { EntryStatus } from "@/lib/finance/types";
import type { MacroBloco } from "@/app/generated/prisma/enums";
import type { AllocationEntry } from "./allocation";

/**
 * Único lugar que traduz uma linha de `Entry` do banco (com os relations
 * necessários incluídos) para `AllocationEntry` — mesmo espírito de
 * `lib/finance/from-db.ts::toFinanceEntry`, mas vive aqui (não em
 * lib/finance/) porque `lib/method/` é quem depende de `lib/finance/`,
 * nunca o contrário (ARQUITETURA-METODO-PROSPECTAR.md §8).
 */
export function toAllocationEntry(entry: {
  id: string;
  nature: string;
  amount: AllocationEntry["amount"];
  transactionDate: Date;
  dueDate: Date;
  statusCode: string;
  macroBlocoOverride: string | null;
  category: { slug: string };
  subcategory: { macroBloco: string | null } | null;
  wallet: { kindCode: string };
}): AllocationEntry {
  return {
    id: entry.id,
    nature: entry.nature as AllocationEntry["nature"],
    amount: entry.amount,
    transactionDate: entry.transactionDate,
    dueDate: entry.dueDate,
    status: entry.statusCode as EntryStatus,
    categorySlug: entry.category.slug,
    walletKindCode: entry.wallet.kindCode,
    macroBloco: (entry.macroBlocoOverride ?? entry.subcategory?.macroBloco ?? null) as MacroBloco | null,
  };
}
