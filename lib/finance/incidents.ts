export interface IncidentCandidateEntry {
  installmentNumber: number | null;
  installmentTotal: number | null;
  groupId: string | null;
  incidentAcknowledgedAt: Date | null;
}

/**
 * Um lançamento é um "incidente" (§13, Compromissos → Incidentes) quando diz
 * fazer parte de um parcelamento (`installmentTotal >= 2`) mas não tem
 * `groupId` — a heurística de agrupamento (`lib/import/group-installments.ts`)
 * não encontrou nenhuma parcela irmã (órfã de verdade) ou encontrou mais de
 * uma combinação possível (ambíguo). Some da lista assim que confirmado
 * (`incidentAcknowledgedAt` preenchido) ou corrigido (deixa de satisfazer a
 * condição — ex.: `installmentTotal` corrigido para menos de 2).
 */
export function isInstallmentIncident(entry: IncidentCandidateEntry): boolean {
  return (
    entry.installmentTotal != null &&
    entry.installmentTotal >= 2 &&
    entry.groupId == null &&
    entry.incidentAcknowledgedAt == null
  );
}

export function installmentIncidents<T extends IncidentCandidateEntry>(entries: T[]): T[] {
  return entries.filter(isInstallmentIncident);
}
