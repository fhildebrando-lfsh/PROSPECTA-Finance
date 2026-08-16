import { prisma } from "@/lib/db/prisma";
import { Decimal } from "@/lib/finance/types";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { walletBalance } from "@/lib/finance/balance";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { investmentPositionValue } from "@/lib/finance/investment";
import { buildPatrimonyItems } from "@/lib/method/patrimony-function";
import {
  CCM_REDUCAO_AJUSTAVEL_PCT_PADRAO,
  METHODOLOGY_VERSION,
  OBSERVATION_MONTHS_PREFERRED,
  PARAM_CCM_REDUCAO_AJUSTAVEL,
  type ConfiancaAnalise,
} from "./config";
import { observeIncomeByPerson, incomeConcentrationHHI } from "./income-observation";
import { computeExpenseBaseline, indiceRigidezFinanceira, type ExpenseEntry } from "./expense-engine";
import { bestProtectionFor, type CoverageInput } from "./insurance-engine";
import { benefitCashflows, type BenefitInput } from "./benefits-engine";
import { classifyLiquidity, computeEmergencyLiquidity, coberturaEmMeses, type LiquidityItem } from "./liquidity-engine";
import { computePortability, recoveryCurve, segundaAtividadeEhResiliente } from "./employment-engine";
import { buildScenarios, coberturaNoCenario, piorCenarioMaterial, type ScenarioResult } from "./scenario-engine";
import { computeIprf, margemIncerteza, pisoLiquidezImediata, principaisFatores, recommendReserve } from "./reserve-engine";

/**
 * Etapa 9-A.5 — a camada **impura** do MCRF: busca o dado real, chama os sete
 * motores puros na ordem certa e devolve a avaliação pronta.
 *
 * Mesmo padrão de `lib/method/run-automations.ts`: toda a lógica vive nos
 * motores testáveis; aqui só há I/O e composição. É deliberado — foi a
 * duplicação entre tela e teste que deixou passar a dupla contagem da Etapa 7,
 * e a lição virou regra.
 */
export interface AssessmentResult {
  methodologyVersion: string;
  dataReferenceDate: Date;
  cema: Decimal;
  ccm: Decimal;
  reserveTarget: Decimal;
  protecaoEssencial: Decimal;
  protecaoReforcada: Decimal;
  eligibleReserve: Decimal;
  progressoPct: number;
  faltaConstruir: Decimal;
  coberturaMatematicaMeses: number | null;
  coberturaNoCenarioMeses: number | null;
  cenarioDeterminante: ScenarioResult | null;
  scenarios: ScenarioResult[];
  iprf: number;
  iprfComponentes: { nome: string; valor: number; peso: number }[];
  mainDrivers: string[];
  dataConfidence: ConfiancaAnalise;
  margemAplicada: number;
  /** Sinais que a tela usa para orientar o que preencher primeiro. */
  gaps: string[];
}

/** A pior das duas confianças — o resultado não é mais confiável que seu elo mais fraco. */
function piorConfianca(a: ConfiancaAnalise, b: ConfiancaAnalise): ConfiancaAnalise {
  const ordem: ConfiancaAnalise[] = ["BAIXA", "MODERADA", "ALTA", "MUITO_ALTA"];
  return ordem.indexOf(a) <= ordem.indexOf(b) ? a : b;
}

export async function runAssessment(workspaceId: string, referenceDate = new Date()): Promise<AssessmentResult> {
  const [entryRows, people, policies, benefits, assets, investments, wallets, param] = await Promise.all([
    prisma.entry.findMany({
      where: { workspaceId },
      select: {
        id: true,
        walletId: true,
        categoryId: true,
        responsibleId: true,
        nature: true,
        amount: true,
        transactionDate: true,
        dueDate: true,
        statusCode: true,
        recurrenceCode: true,
        isFixedOverride: true,
        groupId: true,
        assetId: true,
        investmentId: true,
        subcategory: { select: { rigidez: true } },
        category: { select: { slug: true } },
      },
    }),
    prisma.person.findMany({ where: { workspaceId }, include: { incomeSources: true, benefitEntitlements: true } }),
    prisma.insurancePolicy.findMany({ where: { workspaceId, isActive: true }, include: { coverages: true } }),
    prisma.benefitEntitlement.findMany({ where: { workspaceId } }),
    prisma.asset.findMany({ where: { workspaceId, isActive: true } }),
    prisma.investment.findMany({ where: { workspaceId, isActive: true } }),
    prisma.wallet.findMany({
      where: { workspaceId, isActive: true, isPseudoWallet: false },
      include: { kind: { select: { isLiability: true } } },
    }),
    prisma.methodologyParameter.findUnique({ where: { key: PARAM_CCM_REDUCAO_AJUSTAVEL } }),
  ]);

  const financeEntries = entryRows.map(toFinanceEntry);
  const gaps: string[] = [];

  // --- Despesa: CEMA e CCM (§11/§12) ---
  // Recorrência anual/semestral vira "periódica" — o motor a remove da mediana
  // e a reintroduz como duodécimo, para não contar duas vezes.
  const PERIODICAS = new Set(["ANUAL", "SEMESTRAL", "BIENIO", "TRIENIO", "QUINQUENIO", "DECENIO", "VICENIO"]);
  const expenseEntries: ExpenseEntry[] = entryRows.map((e) => ({
    amount: e.amount,
    dueDate: e.dueDate,
    status: e.statusCode as ExpenseEntry["status"],
    nature: e.nature,
    rigidez: e.subcategory?.rigidez ?? null,
    isPeriodic: PERIODICAS.has(e.recurrenceCode),
  }));

  const reducaoPct = param ? Number(param.value) : CCM_REDUCAO_AJUSTAVEL_PCT_PADRAO;
  const despesa = computeExpenseBaseline(expenseEntries, referenceDate, OBSERVATION_MONTHS_PREFERRED, reducaoPct);
  if (despesa.naoClassificadasMensais.greaterThan(0)) {
    gaps.push("Há despesas essenciais sem classificação de rigidez — elas entram como se não pudessem ser cortadas.");
  }

  // --- Renda observada por pessoa (§14/§15) ---
  const provedores = people.filter((p) => !p.isDependent);
  const observacoes = observeIncomeByPerson(
    entryRows.map((e) => ({
      responsibleId: e.responsibleId,
      amount: e.amount,
      dueDate: e.dueDate,
      status: e.statusCode as "PAGO",
      nature: e.nature,
    })),
    provedores.map((p) => p.id),
    referenceDate,
  );

  const rendaTotal = observacoes.reduce((sum, o) => sum.plus(o.median), new Decimal(0));
  const principal = observacoes.reduce(
    (maior, o) => (o.median.greaterThan(maior.median) ? o : maior),
    observacoes[0] ?? { personId: "", median: new Decimal(0), monthsObserved: 0, confidence: "BAIXA" as ConfiancaAnalise, worstMonth: new Decimal(0), monthsWithoutIncome: 0, variability: null },
  );
  const pessoaPrincipal = provedores.find((p) => p.id === principal.personId) ?? null;

  const confiancaRenda = observacoes.length > 0
    ? observacoes.reduce<ConfiancaAnalise>((pior, o) => piorConfianca(pior, o.confidence), "MUITO_ALTA")
    : "BAIXA";
  if (rendaTotal.lessThanOrEqualTo(0)) gaps.push("Nenhuma receita liquidada no período — o cálculo fica sem base de renda.");

  // --- §18: correlação inferida pelo pagador, sem perguntar ---
  const empregadoresPorPessoa = new Map<string, Set<string>>();
  for (const p of people) {
    empregadoresPorPessoa.set(
      p.id,
      new Set(p.incomeSources.map((s) => (s.employerName ?? "").trim().toLowerCase()).filter((n) => n !== "")),
    );
  }
  const empregadoresPrincipal = empregadoresPorPessoa.get(principal.personId) ?? new Set<string>();
  const outrosCompartilhamPagador = provedores
    .filter((p) => p.id !== principal.personId)
    .some((p) => [...(empregadoresPorPessoa.get(p.id) ?? [])].some((e) => empregadoresPrincipal.has(e)));
  // Sem informação de pagador, assume correlação moderada — §8: ausência de
  // dado não pode virar afirmação de independência.
  const temInfoPagador = empregadoresPrincipal.size > 0;
  const correlacaoRenda = outrosCompartilhamPagador ? 1 : temInfoPagador ? 0.1 : 0.4;
  if (!temInfoPagador && provedores.length > 1) {
    gaps.push("Informe quem paga cada fonte de renda — sem isso o sistema não sabe se as rendas da família são independentes.");
  }

  // --- Profissional: IPP e curva de recuperação (§20/§22) ---
  const portabilidade = computePortability({
    regime: pessoaPrincipal?.regimeTrabalho ?? null,
    experienceTotalMonths: pessoaPrincipal?.experienceTotalMonths ?? null,
    tenureCurrentMonths: pessoaPrincipal?.tenureCurrentMonths ?? null,
    segundaAtividadeNivel: pessoaPrincipal?.segundaAtividadeNivel ?? null,
  });
  if (!portabilidade.hasEnoughData) {
    gaps.push("Preencha o perfil profissional em Perfil de Risco — sem ele a recuperação de renda é estimada no escuro.");
  }

  const regimeEstavel =
    pessoaPrincipal?.regimeTrabalho === "MILITAR" ||
    pessoaPrincipal?.regimeTrabalho === "SERVIDOR_EFETIVO" ||
    pessoaPrincipal?.regimeTrabalho === "APOSENTADO" ||
    pessoaPrincipal?.regimeTrabalho === "PENSIONISTA";

  const dependeDeNegocio =
    pessoaPrincipal?.regimeTrabalho === "AUTONOMO" ||
    pessoaPrincipal?.regimeTrabalho === "EMPRESARIO" ||
    pessoaPrincipal?.regimeTrabalho === "MEI" ||
    pessoaPrincipal?.regimeTrabalho === "PROFISSIONAL_LIBERAL";

  // §21 — só conta como resiliente o que tem evidência prática.
  const rendaSegunda = segundaAtividadeEhResiliente(pessoaPrincipal?.segundaAtividadeNivel ?? null)
    ? principal.median.times(0.2)
    : new Decimal(0);

  // --- Liquidez elegível (§29/§30) ---
  const assetEntriesById = new Map<string, AssetValuationEntry[]>();
  for (const e of entryRows) {
    if (!e.assetId) continue;
    const list = assetEntriesById.get(e.assetId) ?? [];
    list.push({ id: e.id, assetId: e.assetId, amount: e.amount, status: e.statusCode as AssetValuationEntry["status"] });
    assetEntriesById.set(e.assetId, list);
  }
  const investmentEntriesById = new Map<string, { amount: Decimal; categorySlug: string }[]>();
  for (const e of entryRows) {
    if (!e.investmentId || e.nature !== "INVESTIMENTO") continue;
    const list = investmentEntriesById.get(e.investmentId) ?? [];
    list.push({ amount: e.amount, categorySlug: e.category.slug });
    investmentEntriesById.set(e.investmentId, list);
  }

  // Reusa `buildPatrimonyItems` (Etapa 7) — é ele que desconta a dupla
  // contagem entre saldo da carteira e posições que ela abriga.
  const patrimonyItems = buildPatrimonyItems({
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      value: assetCurrentValue(assetEntriesById.get(a.id) ?? []),
      funcao: a.funcaoPatrimonial,
    })),
    investments: investments.map((i) => ({
      id: i.id,
      name: i.name,
      walletId: i.walletId,
      value: investmentPositionValue(investmentEntriesById.get(i.id) ?? []),
      funcao: i.funcaoPatrimonial,
    })),
    wallets: wallets.map((w) => ({
      id: w.id,
      name: w.name,
      balance: walletBalance(financeEntries, w.id, referenceDate),
      funcao: w.funcaoPatrimonial,
    })),
  });

  const walletById = new Map(wallets.map((w) => [w.id, w]));
  const liquidityItems: LiquidityItem[] = patrimonyItems.map((i) => {
    const wallet = i.kind === "CARTEIRA" ? walletById.get(i.id) : undefined;
    return {
      id: i.id,
      name: i.name,
      value: i.value,
      classe: classifyLiquidity({
        funcao: i.funcao,
        walletKindCode: wallet?.kindCode ?? null,
        isLiability: wallet?.kind.isLiability ?? false,
        isPhysicalAsset: i.kind === "BEM",
      }),
    };
  });
  const liquidez = computeEmergencyLiquidity(liquidityItems);
  if (patrimonyItems.some((i) => i.funcao === null && i.value.greaterThan(0))) {
    gaps.push("Há patrimônio sem função definida — classifique em Patrimônio → Função do Patrimônio para o cálculo ficar preciso.");
  }

  // --- Seguros e benefícios (§25/§26) ---
  const coverages: CoverageInput[] = policies.flatMap((p) =>
    p.coverages.map((c) => ({
      riskCovered: c.riskCovered,
      capitalInsured: c.capitalInsured,
      deductible: c.deductible,
      waitingPeriodDays: c.waitingPeriodDays,
      payoutDelayDays: c.payoutDelayDays,
      daysSinceStart: null,
    })),
  );
  // Exposição de referência para o cenário E: a maior franquia declarada, ou
  // dois meses de custo essencial quando não há seguro nenhum.
  const maiorFranquia = coverages.reduce(
    (maior, c) => (c.deductible && c.deductible.greaterThan(maior) ? c.deductible : maior),
    new Decimal(0),
  );
  const exposicaoAtivoEssencial = maiorFranquia.greaterThan(0) ? maiorFranquia : despesa.cema.times(2);
  const protecao = bestProtectionFor(exposicaoAtivoEssencial, coverages);
  if (policies.length === 0) gaps.push("Nenhum seguro cadastrado — riscos grandes acabam tendo que ser cobertos pela reserva.");

  const benefitInputs: BenefitInput[] = benefits.map((b) => ({
    kind: b.kind,
    isEligible: b.isEligible,
    estimatedAmount: b.estimatedAmount,
    durationMonths: b.durationMonths,
    availableAfterDays: b.availableAfterDays,
  }));
  const cashflows = benefitCashflows(benefitInputs, pessoaPrincipal?.regimeTrabalho ?? null);
  const temBeneficioIncerto = benefits.some((b) => b.isEligible === null);

  // --- Cenários (§31/§33) ---
  const piorQueda = observacoes.reduce(
    (soma, o) => soma.plus(o.median.minus(o.worstMonth).isNegative() ? new Decimal(0) : o.median.minus(o.worstMonth)),
    new Decimal(0),
  );
  const scenarios = buildScenarios({
    ccm: despesa.ccm,
    rendaTotal,
    rendaPrincipal: principal.median,
    correlacaoRenda,
    recoveryCurve: recoveryCurve(portabilidade.ipp),
    rendaSegundaAtividadeResiliente: rendaSegunda,
    benefitCashflows: cashflows,
    exposicaoAtivoEssencial: protecao.residualExposure,
    insurancePayout: protecao.payout,
    insurancePayoutMonth: protecao.payoutMonth,
    piorQuedaRendaObservada: piorQueda,
    piorAltaDespesaObservada: despesa.cema.times(0.3),
    regimePrincipalEstavel: regimeEstavel,
    rendaDependeDeNegocioProprio: dependeDeNegocio,
    horizonMonths: 12,
  });

  // --- Reserva (§34/§35/§37) ---
  const margem = margemIncerteza({
    confiancaDespesa: despesa.confidence,
    confiancaRenda,
    temSeguroNaoConfirmado: policies.length > 0 && coverages.length === 0,
    temBeneficioIncerto,
    rendaAltamenteVolatil: observacoes.some((o) => (o.variability ?? 0) > 1),
  });

  const recomendacao = recommendReserve({
    pli: pisoLiquidezImediata(despesa.ccm, protecao.residualExposure),
    scenarios,
    margem,
    reservaAtualElegivel: liquidez.eligibleValue,
  });

  const determinante = piorCenarioMaterial(scenarios);

  const iprf = computeIprf({
    adequacaoLiquidez: recomendacao.progressoPct / 100,
    continuidadeRenda: rendaTotal.greaterThan(0)
      ? rendaTotal.minus(principal.median).div(rendaTotal).toNumber()
      : 0,
    concentracaoRenda: incomeConcentrationHHI(observacoes.map((o) => o.median)),
    rigidezPct: indiceRigidezFinanceira(despesa.rigidasMensais, rendaTotal),
    ipp: portabilidade.ipp,
    coberturaSeguros: coverages.length > 0 ? 1 : 0,
  });

  const dataConfidence = piorConfianca(despesa.confidence, confiancaRenda);

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    dataReferenceDate: referenceDate,
    cema: despesa.cema,
    ccm: despesa.ccm,
    reserveTarget: recomendacao.protecaoRecomendada,
    protecaoEssencial: recomendacao.protecaoEssencial,
    protecaoReforcada: recomendacao.protecaoReforcada,
    eligibleReserve: liquidez.eligibleValue,
    progressoPct: recomendacao.progressoPct,
    faltaConstruir: recomendacao.faltaConstruir,
    coberturaMatematicaMeses: coberturaEmMeses(liquidez.eligibleValue, despesa.cema),
    coberturaNoCenarioMeses: determinante ? coberturaNoCenario(liquidez.eligibleValue, determinante) : null,
    cenarioDeterminante: determinante,
    scenarios,
    iprf: iprf.score,
    iprfComponentes: iprf.componentes,
    mainDrivers: principaisFatores(recomendacao, iprf, {
      correlacaoAlta: correlacaoRenda >= 0.5,
      semSegundaAtividade: !segundaAtividadeEhResiliente(pessoaPrincipal?.segundaAtividadeNivel ?? null),
      semSeguro: coverages.length === 0,
    }),
    dataConfidence,
    margemAplicada: margem,
    gaps,
  };
}
