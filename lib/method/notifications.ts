import type { MembershipRole } from "@/app/generated/prisma/enums";

/**
 * Quem vê qual aviso, e como cada aviso se apresenta. Puro.
 *
 * Existe separado da tela porque a regra de visibilidade é **de segurança**:
 * `ADVISOR_ONLY` são os alertas internos do consultor, e vazá-los ao cliente
 * mostraria a ele uma leitura profissional sobre o próprio caso que ninguém
 * escolheu compartilhar. Regra assim não pode morar dentro de JSX, onde não dá
 * para testá-la.
 */

export type NotificationVisibility = "SHARED" | "ADVISOR_ONLY";

export interface NotificationRow {
  id: string;
  visibility: NotificationVisibility;
  severity: string;
  message: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

/**
 * Só quem acessa como consultor — ou o admin da plataforma — enxerga
 * `ADVISOR_ONLY`. O titular e os membros da família veem apenas `SHARED`.
 *
 * A checagem é por **papel na membership**, não por "é dono da conta": a mesma
 * pessoa é TITULAR no workspace dela e ADVISOR no do cliente, e o que vale é o
 * papel no workspace que está sendo olhado.
 */
export function podeVerInternos(role: MembershipRole | null, isPlatformAdmin: boolean): boolean {
  return isPlatformAdmin || role === "ADVISOR";
}

export function visibleTo(
  notifications: NotificationRow[],
  role: MembershipRole | null,
  isPlatformAdmin: boolean,
): NotificationRow[] {
  if (podeVerInternos(role, isPlatformAdmin)) return notifications;
  return notifications.filter((n) => n.visibility === "SHARED");
}

/**
 * Rótulo e tom de cada severidade.
 *
 * Severidade desconhecida **não quebra e não some**: cai num rótulo neutro. Um
 * aviso que o sistema não sabe classificar ainda é um aviso, e engoli-lo seria
 * repetir em escala menor o defeito que esta tela existe para corrigir.
 */
export interface SeverityStyle {
  label: string;
  tone: "info" | "atencao" | "critico";
}

const SEVERITIES: Record<string, SeverityStyle> = {
  alerta_automacao: { label: "Automação", tone: "atencao" },
  incidente: { label: "Incidente", tone: "critico" },
  informativo: { label: "Informativo", tone: "info" },
};

export function severityStyle(severity: string): SeverityStyle {
  return SEVERITIES[severity] ?? { label: "Aviso", tone: "info" };
}

export interface NotificationSummary {
  pendentes: NotificationRow[];
  resolvidas: NotificationRow[];
  total: number;
  /** Quantos avisos internos existem — só faz sentido para quem pode vê-los. */
  internos: number;
}

/**
 * Separa pendentes de resolvidas e ordena da mais recente para a mais antiga.
 *
 * Resolvida **não é apagada**: o histórico é o que permite ao consultor dizer
 * "isto já foi tratado em tal data", e apagar transformaria a tela numa caixa
 * de entrada sem memória.
 */
export function summarize(notifications: NotificationRow[]): NotificationSummary {
  const porData = [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return {
    pendentes: porData.filter((n) => n.resolvedAt === null),
    resolvidas: porData.filter((n) => n.resolvedAt !== null),
    total: porData.length,
    internos: porData.filter((n) => n.visibility === "ADVISOR_ONLY").length,
  };
}
