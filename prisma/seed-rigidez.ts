/**
 * PROSPECTA-MCRF §11.1–11.3 — classifica a rigidez das subcategorias de DESPESA
 * e semeia os parâmetros da metodologia.
 *
 * Regra aprovada pelo usuário em 2026-08-16:
 * - **RIGIDA** = contrato de valor fixo que se paga mesmo sem usar;
 * - **AJUSTAVEL** = essencial cujo consumo a pessoa controla;
 * - **DISCRICIONARIA** = pode ser suspensa.
 *
 * Implementação por **lista de exceções**, não por planilha de 285 linhas: as
 * rígidas são enumeradas abaixo (é uma lista curta e revisável), e todo o resto
 * do `ESSENCIAL` deriva para AJUSTAVEL. Uma planilha seria mais difícil de
 * auditar e de manter coerente com a regra.
 *
 * Nunca sobrescreve classificação já existente — mesmo contrato de
 * `seedMacroBlocos()`: o admin pode ter ajustado em `/admin/metodologia`, e o
 * seed não desfaz decisão humana.
 *
 * Uso: npm run db:seed:rigidez
 */
import { prisma } from "../lib/db/prisma";
import { CCM_REDUCAO_AJUSTAVEL_PCT_PADRAO, METHODOLOGY_VERSION } from "../lib/method/mcrf/config";
import { PARAM_ENVIO_AUTOMATICO } from "../lib/method/instruments/run-dispatches";

/**
 * Subcategorias de `ESSENCIAL` que são contrato de valor fixo. Chave é
 * `categoria/subcategoria` (slug), para não classificar por engano uma
 * subcategoria homônima de outra categoria.
 *
 * As cinco últimas linhas de Habitação e as de Comunicação são a **exceção
 * explícita do usuário**: água, energia, gás, telefone e internet são consumo,
 * mas comprimem pouco na prática, e a escolha foi deliberadamente conservadora
 * (erra para reserva maior, nunca menor).
 */
const RIGIDAS = new Set<string>([
  // Moradia — contrato
  "2_habitacao/aluguel",
  "2_habitacao/condominio",
  "2_habitacao/financiamento",
  "2_habitacao/iptu",
  // Utilities — exceção do usuário (consumo, tratado como rígido)
  "2_habitacao/agua",
  "2_habitacao/energia_eletrica",
  "2_habitacao/gas",
  "2_habitacao/taxa_de_agua_e_esgoto",
  "2_habitacao/taxa_de_energia_eletrica",
  // Veículo — contrato e obrigação legal
  "5_transporte/financiamento_veiculo",
  "5_transporte/ipva",
  "5_transporte/licenciamento",
  "5_transporte/emplacamento",
  "5_transporte/seguro_protecao",
  "5_transporte/seguro_obrigatorio",
  "5_transporte/documento_veiculo",
  "5_transporte/transporte_escolar",
  // Saúde — mensalidade e proteção contratada
  "6_saude/plano_de_saude",
  "6_saude/plano_odontologico",
  "6_saude/seguro_de_vida",
  "6_saude/remedio",
  // Educação — mensalidade
  "8_educacao/creche",
  "8_educacao/escola",
  "8_educacao/ensino_fundamental",
  "8_educacao/ensino_medio",
  "8_educacao/pre_escola",
  // Comunicação — exceção do usuário
  "9_comunicacao/acesso_a_internet",
  "9_comunicacao/plano_de_tel_fixa",
  "9_comunicacao/plano_de_tel_movel",
  // Obrigação profissional
  "7_des_pessoais/conselho_de_classe",
]);

async function seedRigidez() {
  const subs = await prisma.subcategory.findMany({
    where: { workspaceId: null, category: { nature: "DESPESA" } },
    select: { id: true, slug: true, macroBloco: true, rigidez: true, category: { select: { slug: true } } },
  });

  let rigida = 0;
  let ajustavel = 0;
  let discricionaria = 0;
  let preservadas = 0;

  for (const s of subs) {
    if (s.rigidez !== null) {
      preservadas += 1; // decisão já tomada (seed anterior ou admin) — não desfaz
      continue;
    }

    let valor: "RIGIDA" | "AJUSTAVEL" | "DISCRICIONARIA" | null = null;

    if (s.macroBloco === "ESTILO_DE_VIDA") {
      valor = "DISCRICIONARIA";
    } else if (s.macroBloco === "OBRIGACAO") {
      // Parcela de dívida, imposto, pensão: contrato por definição.
      valor = "RIGIDA";
    } else if (s.macroBloco === "ESSENCIAL") {
      valor = RIGIDAS.has(`${s.category.slug}/${s.slug}`) ? "RIGIDA" : "AJUSTAVEL";
    }
    // macroBloco nulo (subcategoria ainda sem classificação de fluxo) fica nulo
    // aqui também — não há base para decidir, e inventar seria pior.

    if (!valor) continue;

    await prisma.subcategory.update({ where: { id: s.id }, data: { rigidez: valor } });
    if (valor === "RIGIDA") rigida += 1;
    else if (valor === "AJUSTAVEL") ajustavel += 1;
    else discricionaria += 1;
  }

  console.log(
    `rigidez: ${rigida} rígidas, ${ajustavel} ajustáveis, ${discricionaria} discricionárias ` +
      `(${preservadas} preservadas por já terem classificação)`,
  );

  // Confere se algum slug da lista não existe — erro de digitação passaria
  // despercebido e a subcategoria viraria "ajustável" em silêncio.
  const existentes = new Set(subs.map((s) => `${s.category.slug}/${s.slug}`));
  const ausentes = [...RIGIDAS].filter((k) => !existentes.has(k));
  if (ausentes.length > 0) {
    console.warn(`AVISO: ${ausentes.length} slug(s) da lista de rígidas não existem na taxonomia:`);
    for (const a of ausentes) console.warn(`  - ${a}`);
  }
}

async function seedParameters() {
  const params = [
    {
      key: "ccm.reducao_ajustavel_pct",
      value: CCM_REDUCAO_AJUSTAVEL_PCT_PADRAO,
      label: "Redução das despesas ajustáveis durante a crise (%)",
      description:
        "Quanto uma despesa essencial ajustável (alimentação, combustível, higiene) encolhe num cenário adverso. " +
        "Não se aplica às rígidas, que não cedem, nem às discricionárias, que zeram. Vale para todo o sistema.",
    },
    {
      key: PARAM_ENVIO_AUTOMATICO,
      // Nasce DESLIGADO. É a única rotina que fala com o cliente sem humano no
      // meio; ligar junto com o deploy mandaria e-mail para quem ainda não sabe
      // que ela existe, e e-mail enviado não tem desfazer.
      value: 0,
      label: "Envio automático dos instrumentos de diagnóstico (0 = desligado, 1 = ligado)",
      description:
        "Quando ligado, a rotina diária envia o A1 na abertura do contrato, o A2 e o C quando a Fase 1 começa, " +
        "e cobra até dois lembretes por instrumento antes de parar. Vale para todos os clientes com consultoria ativa.",
    },
  ];

  for (const p of params) {
    await prisma.methodologyParameter.upsert({
      where: { key: p.key },
      // Nunca sobrescreve valor já ajustado pelo admin — só rótulo e descrição,
      // que são texto de apresentação e podem melhorar entre versões.
      update: { label: p.label, description: p.description },
      create: { key: p.key, value: p.value, label: p.label, description: p.description },
    });
  }

  console.log(`parâmetros da metodologia (${METHODOLOGY_VERSION}): ${params.length}`);
}

async function main() {
  await seedRigidez();
  await seedParameters();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
