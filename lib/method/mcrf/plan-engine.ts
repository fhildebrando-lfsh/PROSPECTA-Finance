import { Decimal } from "@/lib/finance/types";

/**
 * §44 da especificação PROSPECTA-MCRF — plano para construir a reserva. Puro.
 *
 * Depois de saber **quanto** guardar, falta a pergunta que o cliente realmente
 * faz: *em quanto tempo eu chego lá?* §44 é explícito num ponto que muda o
 * desenho: **não comprometer despesas essenciais**. A capacidade de poupança
 * não é "renda menos o que eu quiser" — é o que sobra depois do custo essencial
 * e das obrigações que não cedem.
 *
 * Receitas extraordinárias (13º, bônus, férias, restituição) entram à parte,
 * porque elas encurtam o prazo sem depender de apertar o mês a mês.
 */
export interface ReservePlanInput {
  /** Meta — a Proteção Recomendada (§37). */
  target: Decimal;
  /** O que já existe, ponderado pela elegibilidade (§30). */
  current: Decimal;
  /** Renda líquida mediana mensal. */
  rendaMensal: Decimal;
  /** CEMA — custo essencial mensal. O que sobra daqui é o que dá para guardar. */
  custoEssencialMensal: Decimal;
  /**
   * Quanto do excedente a pessoa se dispõe a direcionar à reserva, 0–1.
   * Nunca 100% por padrão: viver com zero folga é insustentável e o plano
   * viraria ficção.
   */
  fracaoDoExcedente: number;
  /** Receitas extraordinárias previstas nos próximos 12 meses (13º, bônus). */
  receitasExtraordinariasAnuais: Decimal;
}

export interface ReservePlanResult {
  /** Sobra mensal real depois do custo essencial. */
  excedenteMensal: Decimal;
  /** Quanto vai para a reserva por mês, já aplicada a fração escolhida. */
  aporteMensal: Decimal;
  /** Contribuição mensalizada das receitas extraordinárias. */
  aporteExtraordinarioMensalizado: Decimal;
  /** Total que entra por mês, somando os dois. */
  aporteTotalMensal: Decimal;
  /** Meses até atingir a meta. `null` quando não há aporte possível. */
  mesesAteMeta: number | null;
  /** Já atingiu ou superou a meta. */
  metaAtingida: boolean;
  /** O que falta guardar. */
  faltaConstruir: Decimal;
  /**
   * Verdadeiro quando não sobra nada depois do essencial. Não é "meta
   * impossível" — é sinal de que o caminho passa por reduzir despesa ou
   * aumentar renda antes de falar em prazo (§40).
   */
  semCapacidadeDePoupanca: boolean;
}

export function buildReservePlan(input: ReservePlanInput): ReservePlanResult {
  const zero = new Decimal(0);

  const excedenteBruto = input.rendaMensal.minus(input.custoEssencialMensal);
  const excedenteMensal = excedenteBruto.isNegative() ? zero : excedenteBruto;

  const fracao = Math.max(0, Math.min(1, input.fracaoDoExcedente));
  const aporteMensal = excedenteMensal.times(fracao);

  const extra = input.receitasExtraordinariasAnuais.isNegative() ? zero : input.receitasExtraordinariasAnuais;
  const aporteExtraordinarioMensalizado = extra.div(12);

  const aporteTotalMensal = aporteMensal.plus(aporteExtraordinarioMensalizado);

  const falta = input.target.minus(input.current);
  const metaAtingida = falta.lessThanOrEqualTo(0);
  const faltaConstruir = metaAtingida ? zero : falta;

  const mesesAteMeta = metaAtingida
    ? 0
    : aporteTotalMensal.greaterThan(0)
      ? Math.ceil(faltaConstruir.div(aporteTotalMensal).toNumber())
      : null;

  return {
    excedenteMensal,
    aporteMensal,
    aporteExtraordinarioMensalizado,
    aporteTotalMensal,
    mesesAteMeta,
    metaAtingida,
    faltaConstruir,
    semCapacidadeDePoupanca: excedenteMensal.lessThanOrEqualTo(0),
  };
}

/**
 * §40 — Plano de Tratamento de Riscos: *"como este usuário poderia reduzir sua
 * necessidade de reserva sem ficar menos protegido?"*
 *
 * O princípio de §5 governa a ordem das sugestões: **a solução para todo risco
 * não é aumentar a reserva**. Transferir (seguro), diversificar (segunda renda)
 * e reduzir exposição (dívida) diminuem a necessidade na origem — guardar mais
 * dinheiro só financia o risco que continua lá.
 */
export interface TreatmentInput {
  temSegundaAtividadeResiliente: boolean;
  temSeguroContratado: boolean;
  correlacaoRendaAlta: boolean;
  rigidezPct: number | null;
  concentracaoRenda: number | null;
  semCapacidadeDePoupanca: boolean;
}

export interface TreatmentSuggestion {
  acao: string;
  porque: string;
  /** "transferir" | "diversificar" | "reduzir" | "reter" — a estratégia de §5. */
  estrategia: string;
}

export function treatmentPlan(input: TreatmentInput): TreatmentSuggestion[] {
  const sugestoes: TreatmentSuggestion[] = [];

  if (!input.temSeguroContratado) {
    sugestoes.push({
      acao: "Avaliar cobertura de seguro para os riscos grandes",
      porque:
        "Sem seguro, a reserva precisa cobrir sozinha eventos que uma apólice transferiria por uma fração do valor.",
      estrategia: "transferir",
    });
  }

  if (!input.temSegundaAtividadeResiliente) {
    sugestoes.push({
      acao: "Desenvolver uma segunda fonte de renda",
      porque:
        "Uma atividade que já gere renda encurta a recuperação num cenário de interrupção — e encurtar a recuperação reduz a reserva necessária.",
      estrategia: "diversificar",
    });
  }

  if (input.correlacaoRendaAlta) {
    sugestoes.push({
      acao: "Reduzir a dependência da família de uma mesma fonte pagadora",
      porque:
        "Rendas que vêm do mesmo lugar param juntas — hoje uma não protege a outra, e o cálculo reflete isso.",
      estrategia: "diversificar",
    });
  }

  if (input.rigidezPct !== null && input.rigidezPct > 50) {
    sugestoes.push({
      acao: "Reduzir despesas rígidas ou quitar dívida contratada",
      porque:
        "Mais da metade da sua renda está presa em compromissos que não cedem numa crise. Cada real que sai daí reduz o custo de contingência e a reserva junto.",
      estrategia: "reduzir",
    });
  }

  if (input.concentracaoRenda !== null && input.concentracaoRenda > 0.7) {
    sugestoes.push({
      acao: "Diversificar as fontes de renda",
      porque: "Sua renda depende fortemente de uma única fonte — a interrupção dela tem impacto integral.",
      estrategia: "diversificar",
    });
  }

  if (input.semCapacidadeDePoupanca) {
    sugestoes.push({
      acao: "Abrir folga no orçamento antes de mirar a meta",
      porque:
        "Hoje não sobra nada depois do custo essencial. O caminho começa por reduzir despesa ou aumentar renda — sem folga, nenhum prazo de construção é realista.",
      estrategia: "reduzir",
    });
  }

  if (sugestoes.length === 0) {
    sugestoes.push({
      acao: "Manter o aporte e revisar em seis meses",
      porque: "Seus riscos principais já estão tratados; o que resta é construir a reserva com constância.",
      estrategia: "reter",
    });
  }

  return sugestoes;
}
