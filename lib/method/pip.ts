import { Decimal } from "@/lib/finance/types";

/**
 * Etapa 14 — Política de Investimento Pessoal (PIP, §12.1). Puro.
 *
 * O PIP é **regra**, não indicação: define em que faixa cada classe deve
 * ficar e quando rebalancear. A PROSPECTA mede o desvio e diz o tamanho do
 * ajuste; **nunca** diz qual produto comprar ou vender (§3.1).
 *
 * É faixa e não alvo único de propósito. Alvo exato exigiria rebalancear a
 * cada oscilação — custo e imposto a cada tremor de mercado. A banda é o que
 * torna a política operável: só se mexe quando a posição sai dela.
 */

export type BandStatus = "ABAIXO" | "DENTRO" | "ACIMA";

export interface PolicyBand {
  classCode: string;
  classLabel: string;
  minPercent: Decimal;
  maxPercent: Decimal;
}

export interface Position {
  classCode: string;
  classLabel: string;
  currentValue: Decimal;
}

export interface PolicyRow {
  classCode: string;
  classLabel: string;
  currentValue: Decimal;
  actualPercent: number;
  band: PolicyBand | null;
  status: BandStatus | null;
  /** Distância até a borda mais próxima da faixa, em pontos percentuais. */
  desvioPp: number;
  /**
   * Quanto precisaria entrar (positivo) ou sair (negativo) desta classe para
   * voltar à borda da faixa. Zero quando dentro.
   */
  ajusteValor: Decimal;
}

const ZERO = new Decimal(0);

export function classifyBand(actualPercent: number, band: PolicyBand): { status: BandStatus; desvioPp: number } {
  const min = band.minPercent.toNumber();
  const max = band.maxPercent.toNumber();

  if (actualPercent < min) return { status: "ABAIXO", desvioPp: min - actualPercent };
  if (actualPercent > max) return { status: "ACIMA", desvioPp: actualPercent - max };
  return { status: "DENTRO", desvioPp: 0 };
}

/**
 * Confronta a carteira com a política.
 *
 * Classe **sem faixa definida** entra na tabela com `band: null` em vez de ser
 * omitida: dinheiro alocado fora da política é justamente o que o consultor
 * precisa ver. Esconder produziria uma soma que não fecha em 100%.
 */
export function buildPolicyMap(positions: Position[], bands: PolicyBand[]): PolicyRow[] {
  const total = positions.reduce((s, p) => s.plus(p.currentValue), ZERO);
  const bandByClass = new Map(bands.map((b) => [b.classCode, b]));

  // Classes com faixa mas sem posição também aparecem: "você definiu 20% em
  // renda variável e tem zero" é informação, e some se a linha não existir.
  const classes = new Map<string, { label: string; valor: Decimal }>();
  for (const p of positions) {
    const atual = classes.get(p.classCode);
    classes.set(p.classCode, {
      label: p.classLabel,
      valor: (atual?.valor ?? ZERO).plus(p.currentValue),
    });
  }
  for (const b of bands) {
    if (!classes.has(b.classCode)) classes.set(b.classCode, { label: b.classLabel, valor: ZERO });
  }

  return [...classes.entries()].map(([classCode, { label, valor }]) => {
    const actualPercent = total.lessThanOrEqualTo(0) ? 0 : valor.dividedBy(total).times(100).toNumber();
    const band = bandByClass.get(classCode) ?? null;

    if (!band) {
      return {
        classCode,
        classLabel: label,
        currentValue: valor,
        actualPercent,
        band: null,
        status: null,
        desvioPp: 0,
        ajusteValor: ZERO,
      };
    }

    const { status, desvioPp } = classifyBand(actualPercent, band);
    const alvoPp = status === "ABAIXO" ? band.minPercent.toNumber() : status === "ACIMA" ? band.maxPercent.toNumber() : actualPercent;
    const valorAlvo = total.times(alvoPp).dividedBy(100);
    const ajusteValor = status === "DENTRO" ? ZERO : valorAlvo.minus(valor);

    return { classCode, classLabel: label, currentValue: valor, actualPercent, band, status, desvioPp, ajusteValor };
  });
}

export interface PolicyValidation {
  /** Problemas que tornam a política impossível de cumprir. */
  erros: string[];
  /** Coisas que merecem atenção mas não impedem. */
  avisos: string[];
  valida: boolean;
}

/**
 * Uma política pode ser **aritmeticamente impossível**, e isso não é óbvio ao
 * preencher classe por classe: se os mínimos somam mais de 100%, nenhuma
 * carteira satisfaz; se os máximos somam menos de 100%, sobra dinheiro sem
 * onde caber. Descobrir isso só no rebalanceamento seria descobrir tarde.
 */
export function validatePolicy(bands: PolicyBand[]): PolicyValidation {
  const erros: string[] = [];
  const avisos: string[] = [];

  for (const b of bands) {
    if (b.minPercent.greaterThan(b.maxPercent)) {
      erros.push(`${b.classLabel}: o mínimo (${b.minPercent.toFixed(1)}%) é maior que o máximo (${b.maxPercent.toFixed(1)}%).`);
    }
    if (b.minPercent.isNegative() || b.maxPercent.greaterThan(100)) {
      erros.push(`${b.classLabel}: as faixas precisam ficar entre 0% e 100%.`);
    }
  }

  if (bands.length > 0) {
    const somaMin = bands.reduce((s, b) => s.plus(b.minPercent), ZERO);
    const somaMax = bands.reduce((s, b) => s.plus(b.maxPercent), ZERO);

    if (somaMin.greaterThan(100)) {
      erros.push(
        `Os mínimos somam ${somaMin.toFixed(1)}% — acima de 100%, nenhuma carteira consegue cumprir esta política.`,
      );
    }
    if (somaMax.lessThan(100)) {
      erros.push(
        `Os máximos somam ${somaMax.toFixed(1)}% — abaixo de 100%, sobraria dinheiro sem classe onde caber.`,
      );
    }
    if (somaMin.equals(somaMax) && somaMin.equals(100)) {
      avisos.push("As faixas não têm folga: qualquer oscilação de mercado já dispara rebalanceamento.");
    }
  }

  return { erros, avisos, valida: erros.length === 0 };
}

/** Só o que está fora da faixa — a lista de ação do rebalanceamento. */
export function foraDaFaixa(rows: PolicyRow[]): PolicyRow[] {
  return rows.filter((r) => r.status === "ABAIXO" || r.status === "ACIMA");
}

/** Dinheiro em classe que a política não prevê. */
export function semPolitica(rows: PolicyRow[]): PolicyRow[] {
  return rows.filter((r) => r.band === null && r.currentValue.greaterThan(0));
}
