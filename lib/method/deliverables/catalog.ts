import type { DeliverableCode } from "@/app/generated/prisma/enums";

/**
 * §12.1 — catálogo dos dez artefatos codificados do Método PROSPECTAR.
 *
 * Puro e sem dependências: é a definição de **o que cada entregável é** e de
 * quais seções ele precisa ter para estar completo. A tela e o PDF leem daqui;
 * nenhum dos dois define estrutura por conta própria.
 *
 * **Os dez nomes estão confirmados na Metodologia v5.0** (2026-08-17). PAN e AFF
 * eram os dois que faltavam e foram encontrados no documento original:
 * "apresentação do Panorama Financeiro (PAN)" (§Fase 1, devolutiva) e
 * "o Acordo Financeiro Familiar (AFF) — uma página, assinada por todos, com
 * metas comuns, prioridades e regras de decisão". A sequência completa aparece
 * no fluxo do método: PRÉ-DIAGNÓSTICO (A1) → ENTREVISTA (B) → COMPLEMENTAÇÃO
 * (A2 + C) → PANORAMA (PAN) → ORGANIZAÇÃO (RAP) → DÍVIDAS (MEC) → PROTEÇÃO
 * (MRP) → LONGEVIDADE (PLA) → INVESTIMENTOS (PIP) → PATRIMÔNIO (MFP) →
 * SUCESSÃO (PCP) → PLANO INTEGRADO (PFI) → CONTINUIDADE.
 *
 * `nameConfirmed` foi mantido no tipo de propósito: se um artefato novo entrar
 * sem nome confirmado, o campo existe para marcá-lo em vez de inventar.
 */
export interface DeliverableSpec {
  code: DeliverableCode;
  /** Nome completo, quando confirmado; senão a própria sigla. */
  name: string;
  nameConfirmed: boolean;
  /** Fase do método em que costuma ser produzido (§7). */
  phase: number;
  purpose: string;
  /** Seções esperadas — viram o esqueleto do rascunho e a checagem de completude. */
  sections: string[];
}

export const DELIVERABLES: Record<DeliverableCode, DeliverableSpec> = {
  PAN: {
    code: "PAN",
    name: "Panorama Financeiro",
    nameConfirmed: true,
    phase: 1,
    purpose:
      "A devolutiva da Fase 1: retrato patrimonial, fluxo declarado, mapa de riscos, mapa de dívidas, objetivos " +
      "priorizados e o PSF de linha de base. É o entregável que faz o cliente entender por que precisa das fases seguintes.",
    sections: [
      "Retrato patrimonial",
      "Fluxo declarado",
      "Riscos e dívidas",
      "Objetivos priorizados",
      "PSF de linha de base",
      "As três alavancas de maior impacto",
    ],
  },
  AFF: {
    code: "AFF",
    name: "Acordo Financeiro Familiar",
    nameConfirmed: true,
    phase: 1,
    purpose:
      "Entregável da Reunião de Alinhamento Familiar, ao fim da Fase 1: uma página, assinada por todos, com metas " +
      "comuns, prioridades e regras de decisão. A Metodologia o descreve como o maior diferencial percebido da PROSPECTA.",
    sections: ["Metas comuns", "Prioridades acordadas", "Regras de decisão", "Assinaturas"],
  },
  RAP: {
    code: "RAP",
    name: "Régua de Alocação",
    nameConfirmed: true,
    phase: 1,
    purpose: "Como a receita se distribuiu entre essenciais, estilo de vida, obrigações e poupança.",
    sections: ["Distribuição atual", "Faixa de referência", "Desvios relevantes", "Trajetória proposta"],
  },
  MEC: {
    code: "MEC",
    name: "Mapa de Endividamento e Crédito",
    nameConfirmed: true,
    phase: 3,
    purpose: "Retrato completo das dívidas: CET, credor, negativação e plano de quitação.",
    sections: ["Dívidas em aberto", "Custo efetivo total", "Ordem de quitação", "Plano negociado"],
  },
  MRP: {
    code: "MRP",
    name: "Mapa de Riscos e Proteção",
    nameConfirmed: true,
    phase: 4,
    purpose: "Riscos materiais, coberturas contratadas e exposição residual.",
    sections: ["Riscos identificados", "Proteções existentes", "Exposição residual", "Tratamento recomendado"],
  },
  PLA: {
    code: "PLA",
    name: "Plano de Longevidade e Aposentadoria",
    nameConfirmed: true,
    phase: 6,
    purpose: "Projeção de longo prazo e os cenários de sustentação da renda.",
    sections: ["Situação atual", "Cenários projetados", "Lacuna estimada", "Estratégia"],
  },
  PIP: {
    code: "PIP",
    name: "Política de Investimento Pessoal",
    nameConfirmed: true,
    phase: 5,
    purpose: "As regras que regem as decisões de investimento — nunca indicação de produto (§3.1).",
    sections: ["Objetivos por horizonte", "Faixas-alvo por classe", "Regras de rebalanceamento", "Restrições"],
  },
  MFP: {
    code: "MFP",
    name: "Mapa Funcional do Patrimônio",
    nameConfirmed: true,
    phase: 5,
    purpose: "Para que serve cada peça do patrimônio e onde a composição está desequilibrada.",
    sections: ["Composição por função", "Ativos sem função", "Desequilíbrios", "Recomendações"],
  },
  PCP: {
    code: "PCP",
    name: "Plano de Continuidade Patrimonial",
    nameConfirmed: true,
    phase: 7,
    purpose: "Sucessão e o teste de liquidez sucessória.",
    sections: ["Estrutura atual", "Liquidez sucessória", "Lacunas", "Providências"],
  },
  PFI: {
    code: "PFI",
    name: "Plano Financeiro Integrado",
    nameConfirmed: true,
    phase: 8,
    purpose: "Compila os demais artefatos numa visão única. Ganha versão nova a cada fase (§12.1).",
    sections: ["Panorama", "O que mudou desde a última versão", "Prioridades", "Compromissos"],
  },
};

export const DELIVERABLE_CODES = Object.keys(DELIVERABLES) as DeliverableCode[];

export interface DeliverableSection {
  title: string;
  body: string;
}

export interface DeliverableContent {
  sections: DeliverableSection[];
}

/** Esqueleto de um rascunho novo — as seções do catálogo, vazias. */
export function emptyContentFor(code: DeliverableCode): DeliverableContent {
  return { sections: DELIVERABLES[code].sections.map((title) => ({ title, body: "" })) };
}

export interface CompletenessResult {
  /** Seções ainda sem conteúdo. */
  missing: string[];
  isComplete: boolean;
}

/**
 * Um artefato só deveria ser validado quando todas as seções têm conteúdo.
 * Devolve **quais** faltam, não só um booleano — o consultor precisa saber
 * onde voltar, e "incompleto" sem dizer onde é um aviso inútil.
 */
export function checkCompleteness(code: DeliverableCode, content: DeliverableContent): CompletenessResult {
  const porTitulo = new Map(content.sections.map((s) => [s.title, s.body.trim()]));
  const missing = DELIVERABLES[code].sections.filter((title) => !porTitulo.get(title));
  return { missing, isComplete: missing.length === 0 };
}

/**
 * §12.1 — a próxima versão de um artefato. Versão é por contrato e por código,
 * começando em 0: o PFI da Fase 1 é a v0, o da Fase 2 é a v1.
 */
export function nextVersion(existingVersions: number[]): number {
  if (existingVersions.length === 0) return 0;
  return Math.max(...existingVersions) + 1;
}
