import type { DeliverableCode } from "@/app/generated/prisma/enums";
import { DELIVERABLES, DELIVERABLE_CODES, type DeliverableContent } from "./deliverables/catalog";
import { evolucaoFaixa, faixaDoSnapshot, type EvolucaoFaixa } from "./psf-progress";
import type { PsfFaixa } from "./psf";

/**
 * Etapa 16 — compilador do Plano Financeiro Integrado (§10, Fase ∞). Puro.
 *
 * O PFI **agrega**, não reescreve. Ele monta o panorama a partir do que já
 * existe — quais artefatos foram produzidos, em que versão, e como o PSF se
 * moveu desde a linha de base — e deixa em branco o que é juízo do consultor.
 *
 * A tentação aqui seria copiar o texto de cada entregável para dentro do PFI.
 * Seria pior: o conteúdo copiado envelhece em silêncio no dia em que o MRP
 * ganha uma versão nova, e o cliente passaria a ler no PFI algo que já foi
 * revisto. O compilador aponta para a versão, com data — o documento continua
 * verdadeiro mesmo quando o outro muda.
 */

/** Rótulos dos sete indicadores do PSF, na ordem de §8.3. */
export const PSF_INDICADORES: { key: string; label: string }[] = [
  { key: "organizacao", label: "Organização" },
  { key: "endividamento", label: "Endividamento" },
  { key: "liquidez", label: "Liquidez" },
  { key: "protecao", label: "Proteção" },
  { key: "construcao", label: "Construção Patrimonial" },
  { key: "longevidade", label: "Longevidade" },
  { key: "continuidade", label: "Continuidade" },
];

export interface PsfComparisonRow {
  key: string;
  label: string;
  base: PsfFaixa | null;
  atual: PsfFaixa | null;
  evolucao: EvolucaoFaixa | null;
}

/**
 * §8.1 — "comparativo início × fim justifica o honorário melhor que qualquer
 * relatório". É a razão de o PFI existir.
 *
 * Indicador ausente numa das pontas devolve `evolucao: null`, e a tela não diz
 * nada: um indicador que passou a ser avaliado no meio do caminho não "subiu",
 * ele passou a existir. Tratar isso como progresso inflaria o resultado do
 * trabalho — exatamente o que não se pode fazer num documento que justifica
 * honorário.
 */
export function compararPsf(baseIndicators: unknown, atualIndicators: unknown): PsfComparisonRow[] {
  return PSF_INDICADORES.map(({ key, label }) => {
    const base = faixaDoSnapshot(baseIndicators, key);
    const atual = faixaDoSnapshot(atualIndicators, key);
    return { key, label, base, atual, evolucao: evolucaoFaixa(base, atual) };
  });
}

export interface DeliverableSnapshot {
  code: DeliverableCode;
  version: number;
  status: string;
  createdAt: Date;
  validatedAt: Date | null;
}

export interface CompileInput {
  /** A versão mais recente de cada artefato do contrato. */
  deliverables: DeliverableSnapshot[];
  baseSnapshotDate: Date | null;
  baseIndicators: unknown;
  atualSnapshotDate: Date | null;
  atualIndicators: unknown;
  /** Versão anterior do PFI, para a seção "o que mudou". */
  pfiAnterior: { version: number; deliverables: DeliverableSnapshot[] } | null;
  hoje: Date;
}

export interface CompileResult {
  content: DeliverableContent;
  comparacao: PsfComparisonRow[];
  /** O que impede o PFI de ser completo — a tela mostra antes de salvar. */
  avisos: string[];
  /** Artefatos que ainda não existem neste contrato. */
  faltando: DeliverableCode[];
}

function dataBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function compilePfi(input: CompileInput): CompileResult {
  const avisos: string[] = [];

  // O próprio PFI não entra no inventário — um documento que se lista dentro
  // de si mesmo confunde mais do que informa.
  const codigos = DELIVERABLE_CODES.filter((c) => c !== "PFI");
  const porCodigo = new Map(input.deliverables.filter((d) => d.code !== "PFI").map((d) => [d.code, d]));
  const faltando = codigos.filter((c) => !porCodigo.has(c));

  // --- Panorama: o inventário do que existe ---
  const linhasPanorama = codigos.map((code) => {
    const d = porCodigo.get(code);
    const spec = DELIVERABLES[code];
    if (!d) return `• ${code} — ${spec.name}: ainda não produzido.`;
    const quando = d.validatedAt ? `validado em ${dataBR(d.validatedAt)}` : `rascunho de ${dataBR(d.createdAt)}`;
    return `• ${code} — ${spec.name}: v${d.version}, ${quando}.`;
  });

  const naoValidados = [...porCodigo.values()].filter((d) => d.status === "RASCUNHO");
  if (naoValidados.length > 0) {
    avisos.push(
      `${naoValidados.length} artefato(s) ainda em rascunho: ${naoValidados.map((d) => d.code).join(", ")}. O PFI os inclui como rascunho, não como entrega.`,
    );
  }
  if (faltando.length > 0) {
    avisos.push(`${faltando.length} artefato(s) nunca produzidos neste contrato: ${faltando.join(", ")}.`);
  }

  // --- Comparativo do PSF ---
  const comparacao = compararPsf(input.baseIndicators, input.atualIndicators);

  let blocoPsf: string;
  if (input.baseSnapshotDate === null || input.atualSnapshotDate === null) {
    blocoPsf =
      "Ainda não há duas fotos do Painel de Saúde Financeira para comparar. O comparativo aparece a partir da segunda foto salva.";
    avisos.push("Sem linha de base do PSF — o comparativo início × fim, que é o coração do PFI, fica vazio.");
  } else if (input.baseSnapshotDate.getTime() === input.atualSnapshotDate.getTime()) {
    blocoPsf = "Só existe uma foto do PSF; não há intervalo a comparar.";
    avisos.push("Só existe uma foto do PSF — sem intervalo, não há evolução a mostrar.");
  } else {
    const movidos = comparacao.filter((c) => c.evolucao && c.evolucao.mudanca !== "igual");
    const cabecalho = `Linha de base em ${dataBR(input.baseSnapshotDate)}, situação atual em ${dataBR(input.atualSnapshotDate)}.`;
    const linhas = comparacao.map((c) => {
      if (!c.evolucao) return `• ${c.label}: sem comparação possível no período.`;
      if (c.evolucao.mudanca === "igual") return `• ${c.label}: manteve-se no mesmo nível.`;
      const verbo = c.evolucao.mudanca === "subiu" ? "subiu" : "recuou";
      const n = c.evolucao.degraus === 1 ? "um nível" : `${c.evolucao.degraus} níveis`;
      return `• ${c.label}: ${verbo} ${n}.`;
    });
    const resumo =
      movidos.length === 0
        ? "Nenhum indicador mudou de nível no período."
        : `${movidos.length} indicador(es) mudaram de nível no período.`;
    blocoPsf = [cabecalho, resumo, "", ...linhas].join("\n");
  }

  // --- O que mudou desde a última versão do PFI ---
  let blocoMudancas: string;
  if (!input.pfiAnterior) {
    blocoMudancas = "Esta é a primeira versão do Plano Financeiro Integrado deste contrato.";
  } else {
    const anteriorPorCodigo = new Map(input.pfiAnterior.deliverables.map((d) => [d.code, d]));
    const novos: string[] = [];
    for (const [code, d] of porCodigo) {
      const antes = anteriorPorCodigo.get(code);
      if (!antes) novos.push(`• ${code} passou a existir (v${d.version}).`);
      else if (d.version > antes.version) novos.push(`• ${code} foi revisto: v${antes.version} → v${d.version}.`);
    }
    blocoMudancas =
      novos.length === 0
        ? `Nenhum artefato mudou desde a v${input.pfiAnterior.version} do PFI.`
        : [`Desde a v${input.pfiAnterior.version}:`, "", ...novos].join("\n");
  }

  const content: DeliverableContent = {
    sections: [
      { title: "Panorama", body: [`Compilado em ${dataBR(input.hoje)}.`, "", ...linhasPanorama].join("\n") },
      { title: "O que mudou desde a última versão", body: blocoMudancas },
      // Estas duas o compilador **não** preenche: prioridade e compromisso são
      // juízo do consultor sobre o cliente, e um texto gerado aqui teria a
      // aparência de conselho sem ninguém tê-lo dado.
      { title: "Prioridades", body: "" },
      { title: "Compromissos", body: "" },
    ],
  };

  // O comparativo do PSF entra no Panorama, e não em seção própria, porque as
  // seções do PFI são fixas no catálogo (§12.1) — inventar uma quinta aqui
  // faria o entregável divergir do seu próprio template.
  content.sections[0].body += `\n\nPainel de Saúde Financeira\n${blocoPsf}`;

  avisos.push("Prioridades e Compromissos ficam em branco de propósito — são juízo do consultor, não do compilador.");

  return { content, comparacao, avisos, faltando };
}
