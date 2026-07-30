import { z } from "zod";

/** ISO "AAAA-MM-DD" — datas de lançamento não usam fuso (§15). */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data precisa ser AAAA-MM-DD");

/** Valor monetário como string (nunca number/float no transporte, §15). */
export const decimalString = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, "valor precisa ser um número com até 2 casas decimais");

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export const createEntrySchema = z.object({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().nullable().optional(),
  responsibleId: z.string().uuid(),
  nature: z.enum(["RECEITA", "DESPESA", "INVESTIMENTO", "OUTRO"]),
  amount: decimalString,
  description: z.string().min(1),
  transactionDate: isoDate,
  dueDate: isoDate,
  statusCode: z.string().min(1),
  recurrenceCode: z.string().min(1),
  installmentNumber: z.number().int().positive().nullable().optional(),
  note: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isFixedOverride: z.boolean().nullable().optional(),
  /** Quando >= 2, gera um parcelamento (§8.5) em vez de um lançamento único. */
  installmentsTotal: z.number().int().min(2).optional(),
});

export const updateEntrySchema = createEntrySchema.omit({ installmentsTotal: true }).partial();

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
