import type { MembershipRole } from "@/app/generated/prisma/enums";

/**
 * Como apresentar o registro de acessos. Puro.
 *
 * `VIEW_WORKSPACE` é gravado a **cada carregamento de página** de um consultor
 * (`lib/auth/session.ts`), então a tabela cresce por navegação, não por visita.
 * Listar linha a linha produziria centenas de registros idênticos por dia — e
 * uma auditoria que ninguém consegue ler é quase tão inútil quanto a que não
 * existe, que era justamente o estado anterior (Registro Nº 105).
 *
 * A leitura útil agrupa visualizações contíguas do mesmo ator numa **sessão**,
 * e destaca à parte os eventos discretos — conceder e revogar escrita —, que
 * são poucos e importam individualmente.
 */

export type AccessAction = "VIEW_WORKSPACE" | "GRANT_ADVISOR_WRITE" | "REVOKE_ADVISOR_WRITE" | string;

export interface AccessLogRow {
  id: string;
  actorProfileId: string;
  actorRole: MembershipRole;
  action: AccessAction;
  occurredAt: Date;
}

export const ACTION_LABELS: Record<string, string> = {
  VIEW_WORKSPACE: "Acessou o workspace",
  GRANT_ADVISOR_WRITE: "Recebeu permissão de edição",
  REVOKE_ADVISOR_WRITE: "Teve a permissão de edição revogada",
};

/** Ação desconhecida não some — vira o próprio código, que ao menos é rastreável. */
export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/**
 * Minutos de silêncio que encerram uma sessão.
 *
 * Trinta é escolha, não medida: curto demais fragmentaria uma visita contínua
 * em vários blocos; longo demais juntaria a visita da manhã com a da tarde e
 * esconderia que foram duas. Isolado em constante para poder ser discutido.
 */
export const JANELA_SESSAO_MIN = 30;

export interface AccessSession {
  actorProfileId: string;
  actorRole: MembershipRole;
  inicio: Date;
  fim: Date;
  /** Quantos carregamentos de página a sessão reuniu. */
  visualizacoes: number;
}

/**
 * Agrupa `VIEW_WORKSPACE` contíguas do mesmo ator em sessões.
 *
 * Só agrupa visualização: conceder e revogar escrita são atos deliberados, e
 * dissolvê-los numa sessão apagaria exatamente o que mais importa auditar.
 */
export function agruparSessoes(logs: AccessLogRow[], janelaMin: number = JANELA_SESSAO_MIN): AccessSession[] {
  const views = logs
    .filter((l) => l.action === "VIEW_WORKSPACE")
    .sort((a, b) => a.actorProfileId.localeCompare(b.actorProfileId) || a.occurredAt.getTime() - b.occurredAt.getTime());

  const janelaMs = janelaMin * 60_000;
  const sessoes: AccessSession[] = [];

  for (const v of views) {
    const ultima = sessoes[sessoes.length - 1];
    const contigua =
      ultima &&
      ultima.actorProfileId === v.actorProfileId &&
      v.occurredAt.getTime() - ultima.fim.getTime() <= janelaMs;

    if (contigua) {
      ultima.fim = v.occurredAt;
      ultima.visualizacoes += 1;
    } else {
      sessoes.push({
        actorProfileId: v.actorProfileId,
        actorRole: v.actorRole,
        inicio: v.occurredAt,
        fim: v.occurredAt,
        visualizacoes: 1,
      });
    }
  }

  // Mais recente primeiro — é o que a pessoa quer ver ao abrir a tela.
  return sessoes.sort((a, b) => b.fim.getTime() - a.fim.getTime());
}

/** Os atos deliberados, que se leem um a um. */
export function eventosRelevantes(logs: AccessLogRow[]): AccessLogRow[] {
  return logs
    .filter((l) => l.action !== "VIEW_WORKSPACE")
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}

export interface AccessSummary {
  sessoes: AccessSession[];
  eventos: AccessLogRow[];
  /** Quantas pessoas distintas acessaram no período coberto. */
  atoresDistintos: number;
  ultimoAcesso: Date | null;
}

export function summarizeAccess(logs: AccessLogRow[], janelaMin: number = JANELA_SESSAO_MIN): AccessSummary {
  const sessoes = agruparSessoes(logs, janelaMin);
  return {
    sessoes,
    eventos: eventosRelevantes(logs),
    atoresDistintos: new Set(logs.map((l) => l.actorProfileId)).size,
    ultimoAcesso: logs.length === 0 ? null : new Date(Math.max(...logs.map((l) => l.occurredAt.getTime()))),
  };
}
