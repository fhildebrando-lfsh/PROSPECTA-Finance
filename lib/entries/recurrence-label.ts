/** Reconstrói o texto de Recorrência pra exibição/exportação (§8.5, §18.2). */
export function recurrenceLabel(entry: {
  legacyRecurrenceLabel: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  recurrence: { legacyLabel: string | null; code: string };
}): string {
  if (entry.legacyRecurrenceLabel) return entry.legacyRecurrenceLabel;
  if (entry.installmentNumber && entry.installmentTotal) {
    return `${entry.installmentNumber} de ${entry.installmentTotal}`;
  }
  if (entry.installmentNumber) return String(entry.installmentNumber);
  return entry.recurrence.legacyLabel ?? entry.recurrence.code;
}
