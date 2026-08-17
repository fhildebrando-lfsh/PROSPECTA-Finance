import type { DeliverableCode } from "@/app/generated/prisma/enums";

/**
 * §12.1 — catálogo dos dez artefatos codificados do Método PROSPECTAR.
 *
 * Puro e sem dependências: é a definição de **o que cada entregável é** e de
 * quais seções ele precisa ter para estar completo. A tela e o PDF leem daqui;
 * nenhum dos dois define estrutura por conta própria.
 *
 * **Nota de honestidade sobre dois nomes.** Oito das dez siglas têm o nome
 * completo confirmado na documentação do projeto (`seed-plans.ts` e
 * `ARQUITETURA-METODO-PROSPECTAR.md`). **PAN e AFF não** — a expansão delas não
 * aparece em nenhum documento versionado. Em vez de inventar um nome plausível,
 * ficam com a sigla e uma descrição do que o roteiro indica que elas são, com
 * `nameConfirmed: false` para ser fácil achar e corrigir depois. Um nome errado
 * num documento entregue ao cliente é pior que um nome ausente.
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
    name: "PAN",
    nameConfirmed: false,
    phase: 0,
    purpose: "Documento de abertura do trabalho, produzido no diagnóstico inicial.",
    sections: ["Contexto do cliente", "Objetivos declarados", "Escopo acordado", "Próximos passos"],
  },
  AFF: {
    code: "AFF",
    name: "AFF",
    nameConfirmed: false,
    phase: 1,
    purpose: "Análise do fluxo financeiro observado nos lançamentos do cliente.",
    sections: ["Receitas observadas", "Despesas por bloco", "Sazonalidade", "Conclusões"],
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
