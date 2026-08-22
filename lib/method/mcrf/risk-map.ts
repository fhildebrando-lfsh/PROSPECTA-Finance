import { Decimal } from "@/lib/finance/types";
import { bestProtectionFor, type CoverageInput } from "./insurance-engine";
import type { ScenarioId, ScenarioResult } from "./scenario-engine";

/**
 * Etapa 12 — Mapa de Riscos e Proteção (MRP): **coberturas atuais × necessárias**.
 *
 * A metade "atuais" já existia desde a 9-A.2 (`InsurancePolicy` +
 * `InsuranceCoverage`, e `bestProtectionFor` para saber quanto uma apólice
 * realmente paga). A metade **"necessárias"** é o que faltava, e ela não vem de
 * uma tabela de referência de mercado — vem dos próprios cenários do cliente: a
 * necessidade de um risco é a liquidez que aquele cenário consumiria dele
 * (§33). Isso mantém o MRP ancorado na vida da pessoa, e não numa regra
 * genérica de "faça um seguro de dez vezes a renda".
 *
 * Puro: recebe cenários e coberturas já lidos, e não toca em banco.
 */

/** Tipo de apólice, espelhando `InsuranceKind` do schema. */
export type PolicyKind =
  | "VIDA"
  | "INCAPACIDADE"
  | "PROTECAO_RENDA"
  | "SAUDE"
  | "ODONTOLOGICO"
  | "AUTOMOVEL"
  | "RESIDENCIAL"
  | "PRESTAMISTA"
  | "EMPRESARIAL"
  | "OUTRO";

/**
 * Que tipo de apólice transfere cada cenário.
 *
 * Lista **vazia** significa risco que seguro nenhum transfere — e isso é
 * informação, não lacuna: dizer "não há seguro para isto, a resposta é
 * liquidez" é uma conclusão do método, não uma omissão do sistema.
 *
 * `ODONTOLOGICO` e `VIDA` não aparecem em cenário algum de propósito. Os
 * cenários A–H medem **a liquidez que o próprio cliente precisaria**; morte do
 * titular é um problema de quem fica, que é outra pergunta e outro cálculo. Um
 * mapa que forçasse o seguro de vida a "cobrir" um desses cenários daria a
 * impressão de proteção onde não há.
 */
export const COBERTURA_POR_CENARIO: Record<ScenarioId, PolicyKind[]> = {
  A: [],
  B: ["PROTECAO_RENDA", "PRESTAMISTA"],
  C25: ["PROTECAO_RENDA"],
  C50: ["PROTECAO_RENDA"],
  C75: ["PROTECAO_RENDA"],
  D: ["INCAPACIDADE", "PROTECAO_RENDA", "SAUDE"],
  E: ["AUTOMOVEL", "RESIDENCIAL"],
  F: ["SAUDE"],
  G: ["EMPRESARIAL", "PROTECAO_RENDA"],
  H: ["PROTECAO_RENDA", "PRESTAMISTA", "AUTOMOVEL", "RESIDENCIAL"],
};

export interface PolicyCoverage extends CoverageInput {
  policyKind: PolicyKind;
  policyName: string;
}

export type Tratamento = "TRANSFERIR" | "COMPLEMENTAR" | "RETER" | "COBERTO";

export interface RiskRow {
  scenarioId: ScenarioId;
  label: string;
  /** Liquidez que este cenário consumiria — a "cobertura necessária" (§33). */
  necessario: Decimal;
  /** O que as apólices aplicáveis efetivamente pagariam, já com franquia e carência. */
  cobertoPorSeguro: Decimal;
  /** O que continua sendo problema do cliente. */
  residual: Decimal;
  /** Apólices consideradas — a tela nomeia, para a conta ser auditável. */
  apolicesAplicaveis: string[];
  /** Falso quando nenhum tipo de seguro transfere este risco. */
  transferivel: boolean;
  tratamento: Tratamento;
  /** Por que este tratamento — nunca só o rótulo. */
  justificativa: string;
}

/**
 * §40 — o que fazer com a exposição que sobrou.
 *
 * A ordem das perguntas é a do método: dá para **transferir** (seguro)? Se já
 * há seguro mas não basta, **complementar**. Se não é transferível, **reter**
 * com liquidez. "Coberto" é o único que não pede ação.
 */
function decidirTratamento(row: {
  necessario: Decimal;
  cobertoPorSeguro: Decimal;
  residual: Decimal;
  transferivel: boolean;
  temApolice: boolean;
}): { tratamento: Tratamento; justificativa: string } {
  if (row.necessario.lessThanOrEqualTo(0)) {
    return { tratamento: "COBERTO", justificativa: "Este cenário não consumiria liquidez sua." };
  }
  if (row.residual.lessThanOrEqualTo(0)) {
    return { tratamento: "COBERTO", justificativa: "O seguro contratado cobre a necessidade deste cenário." };
  }
  if (!row.transferivel) {
    return {
      tratamento: "RETER",
      justificativa: "Nenhum seguro transfere este risco — a resposta é liquidez própria.",
    };
  }
  if (row.temApolice && row.cobertoPorSeguro.greaterThan(0)) {
    return {
      tratamento: "COMPLEMENTAR",
      justificativa: "Há proteção, mas ela não alcança o tamanho do evento — sobra exposição.",
    };
  }
  return {
    tratamento: "TRANSFERIR",
    justificativa: "Existe seguro no mercado para este risco e você não tem cobertura aplicável.",
  };
}

export function buildRiskMap(scenarios: ScenarioResult[], coberturas: PolicyCoverage[]): RiskRow[] {
  // Só cenário material entra no mapa: listar o que não se aplica ao cliente
  // encheria a tela de linha vazia e esconderia o que importa.
  return scenarios
    .filter((s) => s.isMaterial)
    .map((s) => {
      const kinds = COBERTURA_POR_CENARIO[s.id] ?? [];
      const aplicaveis = coberturas.filter((c) => kinds.includes(c.policyKind));

      // Reaproveita o motor de seguros em vez de somar capitais: somar ignoraria
      // franquia, carência e teto, e produziria um mapa otimista — que é a
      // pior espécie de erro num documento de proteção.
      const protecao =
        aplicaveis.length > 0
          ? bestProtectionFor(s.need, aplicaveis)
          : { payout: new Decimal(0), residualExposure: s.need, payoutMonth: 0, blockedByWaitingPeriod: false };

      const decisao = decidirTratamento({
        necessario: s.need,
        cobertoPorSeguro: protecao.payout,
        residual: protecao.residualExposure,
        transferivel: kinds.length > 0,
        temApolice: aplicaveis.length > 0,
      });

      return {
        scenarioId: s.id,
        label: s.label,
        necessario: s.need,
        cobertoPorSeguro: protecao.payout,
        residual: protecao.residualExposure,
        apolicesAplicaveis: [...new Set(aplicaveis.map((c) => c.policyName))],
        transferivel: kinds.length > 0,
        ...decisao,
      };
    });
}

export interface RiskMapSummary {
  totalNecessario: Decimal;
  totalCoberto: Decimal;
  totalResidual: Decimal;
  /** Riscos que dá para transferir e ainda não foram — a lista de ação mais curta. */
  aTransferir: RiskRow[];
  /** Riscos sem seguro possível: o que justifica a reserva existir. */
  aReter: RiskRow[];
}

export function summarizeRiskMap(rows: RiskRow[]): RiskMapSummary {
  const zero = new Decimal(0);
  return {
    totalNecessario: rows.reduce((s, r) => s.plus(r.necessario), zero),
    totalCoberto: rows.reduce((s, r) => s.plus(r.cobertoPorSeguro), zero),
    totalResidual: rows.reduce((s, r) => s.plus(r.residual), zero),
    aTransferir: rows.filter((r) => r.tratamento === "TRANSFERIR"),
    aReter: rows.filter((r) => r.tratamento === "RETER"),
  };
}
