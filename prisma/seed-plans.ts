/**
 * Etapa 3 do Método PROSPECTAR (ARQUITETURA-METODO-PROSPECTAR.md §5.2/6,
 * 2026-08-15) — catálogo comercial real: 6 SKUs (Start/Pro/Max ×
 * Individual/Família, §5.1 da Metodologia v5.0) e o catálogo de features de
 * §13.8. Não toca no catálogo antigo (`START`/`PLUS`/`PREMIUM`/
 * `PREMIUM_NEGOCIOS`, 12 features de um exercício de roadmap anterior,
 * nomenclatura sem sobreposição) — fica intacto, superado mas não apagado.
 *
 * Também reforça `LEGACY_INTERNAL` (Fase 2 Etapa 1 da Arquitetura de
 * Identidade) com o catálogo novo inteiro, e garante que todo workspace sem
 * nenhuma Subscription ganhe uma nela — mesma lógica idempotente da
 * migration original (`20260801205917_identity_plans_backfill`), reaplicada
 * porque o banco de dev atual é novo (Registro Nº 047) e nunca rodou aquele
 * backfill contra dado real. Sem isso, gatear qualquer tela com
 * `hasFeature()` travaria os workspaces que já usam o sistema hoje.
 *
 * Uso: npm run db:seed:plans
 */
import { prisma } from "../lib/db/prisma";
import type { FeatureGateKind } from "../app/generated/prisma/enums";

const START_FEATURES: Record<string, string> = {
  lancamento_manual: "Lançamento manual",
  lancamento_rapido: "Lançamento rápido",
  transferencias: "Transferências entre carteiras",
  carteiras_categorias: "Carteiras, categorias e responsáveis",
  painel_basico: "Painel básico",
  compromissos: "Compromissos e calendário",
  metas_simples: "Metas simples",
  import_csv: "Importação de CSV",
  // Decisão do usuário (2026-08-19): importar extrato e fatura passa a valer
  // desde o Start — quem está começando é justamente quem mais precisa trazer
  // o histórico de fora, e cobrar por isso trava a entrada no produto.
  import_ofx: "Importação de OFX",
  import_pdf_fatura: "Importação de PDF de fatura",
  export_dados: "Exportação de dados",
  cartoes_basico: "Cartões de crédito (cadastro e fatura)",
  relatorio_balanco_anual: "Relatório: Balanço anual",
  pwa: "App instalável (PWA)",
};

const PRO_FEATURES: Record<string, string> = {
  google_agenda: "Integração com Google Agenda",
  relatorio_orcamento: "Relatório: Orçamento",
  relatorio_fluxo_projetado: "Relatório: Fluxo projetado",
  relatorio_parceladas: "Relatório: Despesas parceladas",
  patrimonio_bens: "Patrimônio: Bens",
  patrimonio_metas_avancadas: "Metas avançadas (caixinha vinculada)",
  patrimonio_dividas: "Patrimônio: Dívidas",
  regua_posicao: "Régua de Alocação — posição atual",
  psf_nivel_1: "Painel de Saúde Financeira — nível 1",
};

const MAX_FEATURES: Record<string, string> = {
  investimentos_carteira: "Investimentos: Carteira",
  investimentos_analise: "Investimentos: Análise",
  cartoes_analise_beneficios: "Cartões: Análise de benefícios",
  ia_assistente: "Assistente de IA",
  regua_simulacao: "Régua de Alocação — simulação de cenários",
  psf_nivel_2: "Painel de Saúde Financeira — nível 2",
  seguros_cadastro: "Cadastro de apólices de seguro",
  patrimonio_funcao: "Classificação funcional do patrimônio",
  automacoes: "Automações",
  /// PROSPECTA-MCRF (Etapa 9-A) — perfil de risco, reserva recomendada e stress
  /// tests. O mapa de riscos e o plano de tratamento ficam em `mrp_completo`
  /// (camada de método, exige consultor ativo) — decisão do usuário, 2026-08-16.
  reserva_inteligente: "Reserva de Emergência inteligente e stress tests",
};

const METODO_FEATURES: Record<string, string> = {
  metodo_trilha: "Trilha do Método PROSPECTAR",
  metodo_gates: "Gates de fase",
  psf_nivel_3: "Painel de Saúde Financeira — nível 3",
  psf_revisado: "PSF com devolutiva revisada pelo consultor",
  entregaveis: "Entregáveis do método",
  diagnostico_dip: "Diagnóstico Integrado PROSPECTA (instrumentos)",
  regua_trajetoria: "Régua de Alocação — trajetória de metas",
  pip_politica: "Política de Investimento Pessoal (PIP)",
  mec_completo: "Mapa de Endividamento e Crédito completo",
  mrp_completo: "Mapa de Riscos e Proteção completo",
  mfp_diagnostico: "Mapa Funcional do Patrimônio — diagnóstico",
  pla_projecao: "Plano de Longevidade e Aposentadoria",
  pcp_sucessorio: "Plano de Continuidade Patrimonial",
  pfi_compilador: "Plano Financeiro Integrado",
  consultor_workspace: "Acesso do consultor ao workspace",
  agenda_consultoria: "Agenda de consultoria",
};

const OTHER_FEATURES: Record<string, string> = {
  multi_seat_5: "Assento — até 5 membros (Plano Família)",
  modulo_pj: "Módulo PJ (MEI e autônomo)",
  open_finance: "Open Finance (reservada, sem nível vinculado — §5.9)",
};

// Cada nível inclui integralmente o anterior (§4.2 da Metodologia v5.0).
const START_CODES = Object.keys(START_FEATURES);
const PRO_CODES = [...START_CODES, ...Object.keys(PRO_FEATURES)];
const MAX_CODES = [...PRO_CODES, ...Object.keys(MAX_FEATURES)];

interface PlanSeed {
  code: string;
  name: string;
  priceCents: number;
  seatType: "individual" | "familia";
  featureCodes: string[];
}

// Preços mensais de §5.1 da Metodologia v5.0. Anual (com desconto de 2
// meses) não vira Plan separado nesta etapa — não há checkout/cobrança real
// ainda; entra quando essa peça existir de verdade.
const PLANS: PlanSeed[] = [
  { code: "start_individual", name: "Start Individual", priceCents: 1990, seatType: "individual", featureCodes: START_CODES },
  {
    code: "start_familia",
    name: "Start Família",
    priceCents: 3490,
    seatType: "familia",
    featureCodes: [...START_CODES, "multi_seat_5"],
  },
  { code: "pro_individual", name: "Pro Individual", priceCents: 3990, seatType: "individual", featureCodes: PRO_CODES },
  {
    code: "pro_familia",
    name: "Pro Família",
    priceCents: 6490,
    seatType: "familia",
    featureCodes: [...PRO_CODES, "multi_seat_5"],
  },
  { code: "max_individual", name: "Max Individual", priceCents: 6990, seatType: "individual", featureCodes: MAX_CODES },
  {
    code: "max_familia",
    name: "Max Família",
    priceCents: 10990,
    seatType: "familia",
    featureCodes: [...MAX_CODES, "multi_seat_5"],
  },
];

/**
 * §13.8 / §12.1 — a fase do método a que cada feature pertence.
 *
 * Existe por causa do contrato de **Projeto** (§4.9), que cobre **uma** fase e
 * não a trilha inteira. Sem este mapa, `engagementCoversFeature` não tinha como
 * decidir e recusava tudo: um contrato de Projeto liberava **zero** features,
 * defeito encontrado em produção em 2026-08-17 quando o usuário abriu um e as
 * três telas do menu Método continuaram negando.
 *
 * As fases vêm da tabela de artefatos da Metodologia v5.0 (§12.1), não de
 * arbítrio: MEC é 3, MRP é 4, PIP é 6, MFP é 7, PCP é 8, PFI é ∞ (9), RAP é 2.
 *
 * **`null` aqui significa "transversal", não "não classificada"** — e é a
 * distinção que faltava. São as features estruturais da camada de método, que
 * qualquer contrato precisa ter para o trabalho existir: sem a trilha, um
 * cliente de Projeto não consegue nem ver em que ponto está; sem o acesso do
 * consultor, não há quem execute. Cobrar por fase o andaime do próprio método
 * seria vender uma sala sem porta.
 */
const METODO_FEATURE_PHASE: Record<string, number | null> = {
  // Estruturais — todo contrato tem, inclusive Projeto.
  metodo_trilha: null,
  metodo_gates: null,
  consultor_workspace: null,
  agenda_consultoria: null,
  entregaveis: null,
  psf_nivel_3: null,
  psf_revisado: null,

  // Por fase, conforme §12.1.
  diagnostico_dip: 0, // A1 na Fase 0; A2 e C na Fase 1 (§12.8) — ancorado na origem.
  regua_trajetoria: 2, // RAP
  mec_completo: 3, // MEC
  mrp_completo: 4, // MRP
  pip_politica: 6, // PIP
  mfp_diagnostico: 7, // MFP
  pcp_sucessorio: 8, // PCP
  pla_projecao: 5, // PLA
  pfi_compilador: 9, // PFI — Fase ∞
};

/**
 * Features que **são o produto**, não um adicional.
 *
 * Decisão do usuário em 2026-08-19: o Start não restringe nada. Lançar, ver o
 * painel, cadastrar carteira e exportar o próprio dado são o que o sistema é —
 * não um pacote que alguém possa desmarcar. Elas somem da matriz de
 * `/admin/planos` e `hasFeature` as libera para todos.
 *
 * Continuam existindo como linha: apagá-las quebraria os `PlanFeature` que já
 * as referenciam e destruiria o histórico do catálogo. O que muda é o
 * significado, não a existência (Registro Nº 107).
 */
const SEMPRE_INCLUIDAS = new Set<string>([
  "lancamento_manual",
  "lancamento_rapido",
  "transferencias",
  "carteiras_categorias",
  "painel_basico",
  "compromissos",
  "metas_simples",
  "import_csv",
  "export_dados",
  "cartoes_basico",
  "relatorio_balanco_anual",
  "pwa",
]);

async function seedFeatures() {
  const allFeatures: Record<string, string> = {
    ...START_FEATURES,
    ...PRO_FEATURES,
    ...MAX_FEATURES,
    ...METODO_FEATURES,
    ...OTHER_FEATURES,
  };
  const methodoCodes = new Set(Object.keys(METODO_FEATURES));

  let count = 0;
  for (const [code, name] of Object.entries(allFeatures)) {
    const gateKind: FeatureGateKind = methodoCodes.has(code) ? "METODO" : "PLANO";
    const methodPhase = methodoCodes.has(code) ? (METODO_FEATURE_PHASE[code] ?? null) : null;
    const alwaysIncluded = SEMPRE_INCLUIDAS.has(code);
    await prisma.feature.upsert({
      where: { code },
      // Nunca sobrescreve name/gateKind já existente — admin pode ter editado via /admin/planos.
      // `methodPhase` é exceção: nenhuma tela o edita, então não há edição de
      // admin a preservar, e ele **precisa** ser corrigido em base já semeada —
      // era justamente o campo que estava nulo em produção e travava o Projeto.
      create: { code, name, gateKind, methodPhase, alwaysIncluded },
      update: { methodPhase, alwaysIncluded },
    });
    count += 1;
  }
  console.log(`features (catálogo §13.8): ${count}`);
}

async function seedPlans() {
  for (const planSeed of PLANS) {
    const plan = await prisma.plan.upsert({
      where: { code: planSeed.code },
      create: {
        code: planSeed.code,
        name: planSeed.name,
        priceCents: planSeed.priceCents,
        billingInterval: "MONTHLY",
      },
      update: {}, // preço/nome editável manualmente depois — seed nunca sobrescreve
    });

    // Bootstrap uma vez só: se o plano já tem qualquer PlanFeature, assume
    // que o admin já tomou posse da composição dele via /admin/planos — não
    // reintroduz features que ele tenha removido de propósito.
    const existing = await prisma.planFeature.count({ where: { planId: plan.id } });
    if (existing > 0) continue;

    const features = await prisma.feature.findMany({ where: { code: { in: planSeed.featureCodes } } });
    await prisma.planFeature.createMany({
      data: features.map((f) => ({ planId: plan.id, featureId: f.id })),
      skipDuplicates: true,
    });
  }
  console.log(`plans (6 SKUs Start/Pro/Max × Individual/Família): ${PLANS.length}`);
}

/**
 * Reforça o LEGACY_INTERNAL (Fase 2 Etapa 1 da Arquitetura de Identidade)
 * com TODO o catálogo de feature hoje — antigo (roadmap anterior) + novo
 * (§13.8) — pra continuar significando "todas as features", como o nome
 * promete. Sem isso, gatear qualquer tela nova quebraria quem já usa o
 * sistema com essa Subscription.
 */
async function topUpLegacyInternal() {
  const legacy = await prisma.plan.findUnique({ where: { code: "LEGACY_INTERNAL" } });
  if (!legacy) {
    console.log("LEGACY_INTERNAL não existe neste banco — pulando reforço (nada a fazer).");
    return;
  }

  const allFeatures = await prisma.feature.findMany();
  await prisma.planFeature.createMany({
    data: allFeatures.map((f) => ({ planId: legacy.id, featureId: f.id })),
    skipDuplicates: true,
  });
  console.log(`LEGACY_INTERNAL reforçado: ${allFeatures.length} features ligadas no total.`);
}

/**
 * Mesma lógica idempotente de `20260801205917_identity_plans_backfill`,
 * reaplicada — o banco de dev atual (Registro Nº 047) é um projeto Supabase
 * novo, criado depois daquela migration ter rodado contra o antigo, e nunca
 * recebeu esse backfill. Todo workspace sem NENHUMA Subscription ganha uma
 * em LEGACY_INTERNAL (todas as features, sem cobrança) — garante que nenhum
 * workspace real fica travado quando uma tela passar a checar `hasFeature()`.
 */
async function backfillLegacySubscriptions() {
  const legacy = await prisma.plan.findUnique({ where: { code: "LEGACY_INTERNAL" } });
  if (!legacy) {
    console.log("LEGACY_INTERNAL não existe — pulando backfill de assinatura.");
    return;
  }

  const workspacesWithoutSubscription = await prisma.workspace.findMany({
    where: { subscriptions: { none: {} } },
    select: { id: true },
  });

  if (workspacesWithoutSubscription.length === 0) {
    console.log("backfill de assinatura: nenhum workspace pendente.");
    return;
  }

  await prisma.subscription.createMany({
    data: workspacesWithoutSubscription.map((w) => ({
      workspaceId: w.id,
      planId: legacy.id,
      status: "ACTIVE",
      paymentProvider: "NONE",
    })),
  });
  console.log(`backfill de assinatura: ${workspacesWithoutSubscription.length} workspace(s) ganharam Subscription em LEGACY_INTERNAL.`);
}

/**
 * `START`/`PLUS`/`PREMIUM`/`PREMIUM_NEGOCIOS` vêm de um exercício de roadmap
 * comercial anterior (Registro histórico, `20260802004826_plan_roadmap_
 * features`), superado pelo catálogo real de §13.8/§5.1 da Metodologia v5.0.
 * Nunca apagados (podem já ter Subscription real apontando pra eles) — só
 * marcados inativos, usando o campo que já existe pra isso (§20: nunca
 * exclui, só arquiva), pra não aparecerem misturados com os 6 SKUs reais em
 * `/admin/planos`. `LEGACY_INTERNAL` fica de fora — continua ativo,
 * cobrindo o backfill.
 */
async function deactivateSupersededPlans() {
  const result = await prisma.plan.updateMany({
    where: { code: { in: ["START", "PLUS", "PREMIUM", "PREMIUM_NEGOCIOS"] }, isActive: true },
    data: { isActive: false },
  });
  if (result.count > 0) console.log(`planos superados desativados: ${result.count}`);
}

async function main() {
  await seedFeatures();
  await seedPlans();
  await topUpLegacyInternal();
  await backfillLegacySubscriptions();
  await deactivateSupersededPlans();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
