import type { RegimeTrabalho, SegundaAtividadeNivel } from "@/app/generated/prisma/enums";

/**
 * §20, §22 e §23 da especificação PROSPECTA-MCRF — **IPP** (Índice de
 * Portabilidade Profissional) e **Curva de Recuperação de Renda**. Puro.
 *
 * O IPP estima quão facilmente a capacidade produtiva da pessoa vira renda
 * nova. Três princípios de §20 governam os pesos aqui:
 *
 * 1. **Não confundir escolaridade com empregabilidade.** Diploma não colocado
 *    em prática pesa menos que atividade efetivamente exercida — por isso a
 *    segunda atividade tem o maior peso do modelo, e o nível dela importa mais
 *    que sua existência.
 * 2. **Experiência tem retorno decrescente.** A diferença entre 2 e 6 anos de
 *    carreira é enorme; entre 20 e 24, quase nada.
 * 3. **Estabilidade não é portabilidade** (§23). Um militar tem a renda mais
 *    estável do sistema e a menor facilidade de recolocação no setor privado.
 *    São eixos independentes, e confundi-los é o erro que §23 existe para
 *    evitar.
 *
 * **Aviso que vale mais que o índice** (§23): IPP baixo **não** aumenta a
 * reserva sozinho. Ele alimenta a curva de recuperação, e a curva só entra num
 * cenário que seja materialmente relevante. Um policial estável não recebe
 * reserva gigante por ter dificuldade de recolocação — recebe diagnóstico de
 * concentração no capital humano e recomendação de segunda carreira.
 */

/** Peso da segunda atividade — §21: evidência prática vale mais que possibilidade. */
const PESO_SEGUNDA_ATIVIDADE: Record<SegundaAtividadeNivel, number> = {
  RENDA_SECUNDARIA_ATIVA: 30,
  RENDA_SECUNDARIA_ADORMECIDA: 18,
  CAPACIDADE_POTENCIAL: 8,
  // §21.4 — possibilidade teórica não é renda resiliente e não vale ponto.
  POSSIBILIDADE_TEORICA: 0,
};

/**
 * §23 — ajuste por regime, sobre a facilidade de **recolocação**, não sobre a
 * estabilidade da renda atual. Servidor e militar têm carreira fechada e
 * pouca conversão direta para o setor privado; autônomo e liberal já vivem de
 * recolocar-se e levam vantagem aqui.
 */
const AJUSTE_REGIME: Partial<Record<RegimeTrabalho, number>> = {
  MILITAR: -20,
  SERVIDOR_EFETIVO: -15,
  EMPREGADO_PUBLICO: -10,
  CARGO_COMISSIONADO: -5,
  PROFISSIONAL_LIBERAL: 10,
  AUTONOMO: 10,
  MEI: 5,
  EMPRESARIO: 5,
  APOSENTADO: -10,
  PENSIONISTA: -10,
};

export interface EmploymentProfile {
  regime: RegimeTrabalho | null;
  experienceTotalMonths: number | null;
  tenureCurrentMonths: number | null;
  segundaAtividadeNivel: SegundaAtividadeNivel | null;
}

export interface PortabilityResult {
  /** 0–100. Quanto maior, mais fácil converter capacidade em renda nova. */
  ipp: number;
  /** Fatores que mais pesaram, para a tela explicar (§53). */
  drivers: string[];
  /** Falso quando falta dado demais para o índice significar algo. */
  hasEnoughData: boolean;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Componente de experiência: cresce rápido no início e satura. 10 anos de
 * carreira valem quase o máximo; o que vem depois muda pouco a capacidade de
 * recomeçar.
 */
function pontosPorExperiencia(months: number | null): number {
  if (!months || months <= 0) return 0;
  const anos = months / 12;
  // Saturação suave: 40 × (1 − e^(−anos/5)) → ~32 aos 10 anos, ~39 aos 20.
  return 40 * (1 - Math.exp(-anos / 5));
}

/**
 * §20 — "tempo desde a última experiência fora da carreira principal". Muito
 * tempo no mesmo vínculo tende a especializar e reduzir a portabilidade. Efeito
 * pequeno de propósito: é uma tendência, não uma regra, e tratá-la como forte
 * puniria quem simplesmente tem estabilidade.
 */
function ajustePorTempoDeCasa(months: number | null): number {
  if (!months) return 0;
  const anos = months / 12;
  if (anos >= 15) return -8;
  if (anos >= 10) return -5;
  return 0;
}

export function computePortability(profile: EmploymentProfile): PortabilityResult {
  const drivers: string[] = [];

  const base = 40; // ponto de partida neutro
  const exp = pontosPorExperiencia(profile.experienceTotalMonths);
  const segunda = profile.segundaAtividadeNivel ? PESO_SEGUNDA_ATIVIDADE[profile.segundaAtividadeNivel] : 0;
  const regime = profile.regime ? (AJUSTE_REGIME[profile.regime] ?? 0) : 0;
  const casa = ajustePorTempoDeCasa(profile.tenureCurrentMonths);

  if (segunda >= 18) drivers.push("Você já exerce (ou exerceu há pouco) outra atividade que gera renda.");
  else if (segunda > 0) drivers.push("Há capacidade para outra atividade, mas com pouca evidência prática.");
  else if (profile.segundaAtividadeNivel === "POSSIBILIDADE_TEORICA")
    drivers.push("A segunda atividade é só uma possibilidade — não conta como renda alternativa.");

  if (exp >= 30) drivers.push("Experiência longa na sua área.");
  else if (exp > 0 && exp < 15) drivers.push("Pouco tempo de experiência acumulada.");

  if (regime <= -15) {
    drivers.push("Sua carreira tem alta estabilidade, mas pouca conversão direta para o mercado privado.");
  } else if (regime >= 10) {
    drivers.push("Você já vive de se recolocar, o que ajuda numa interrupção.");
  }

  if (casa < 0) drivers.push("Muito tempo no mesmo vínculo tende a especializar e dificultar a mudança.");

  // Sem experiência nem segunda atividade nem regime, o índice seria só o
  // ponto de partida — número sem significado, e §9 manda evitar falsa precisão.
  const hasEnoughData =
    profile.experienceTotalMonths != null || profile.segundaAtividadeNivel != null || profile.regime != null;

  return { ipp: clamp(base + exp + segunda + regime + casa), drivers, hasEnoughData };
}

/**
 * §22 — Curva de Recuperação de Renda: que fração da renda original a pessoa
 * consegue reconstituir a cada mês depois de uma interrupção.
 *
 * **Nunca universal** (§22): os percentuais saem do IPP. E deliberadamente
 * conservadora — o mês 0 é sempre 0%, porque nenhuma recolocação acontece no
 * mês em que a renda para.
 *
 * A curva é explicável, não uma previsão: o sistema não diz "você levará 4,7
 * meses para conseguir emprego" (§22 proíbe explicitamente). Ela existe para
 * dimensionar liquidez, não para prever a vida de ninguém.
 */
export function recoveryCurve(ipp: number, horizonMonths = 12): number[] {
  // IPP alto encurta a recuperação; IPP baixo a alonga. 3 a 12 meses até 100%.
  const mesesParaPleno = Math.round(12 - (ipp / 100) * 9);

  return Array.from({ length: horizonMonths + 1 }, (_, mes) => {
    if (mes === 0) return 0;
    if (mes >= mesesParaPleno) return 1;
    // Progressão suave: nada de degrau artificial entre um mês e outro.
    return Number((mes / mesesParaPleno).toFixed(4));
  });
}

/**
 * §21 — a segunda atividade é renda resiliente neste cenário?
 *
 * Só ATIVA e ADORMECIDA entram. `CAPACIDADE_POTENCIAL` e
 * `POSSIBILIDADE_TEORICA` ficam de fora por §21.4: contar com renda que nunca
 * existiu é o tipo de otimismo que faz a reserva parecer suficiente sem ser.
 */
export function segundaAtividadeEhResiliente(nivel: SegundaAtividadeNivel | null): boolean {
  return nivel === "RENDA_SECUNDARIA_ATIVA" || nivel === "RENDA_SECUNDARIA_ADORMECIDA";
}
