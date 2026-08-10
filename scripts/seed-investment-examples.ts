/**
 * Exemplos de investimento para demonstrar o menu Investimentos — pedido pelo
 * usuário em 2026-08-09 pra conferir como cada classe aparece no sistema
 * depois que o menu foi construído (Registro Nº 044). Guardado aqui pra
 * reuso futuro (ex.: recriar o mesmo cenário numa demo, num workspace novo,
 * ou depois de uma limpeza de dados de teste) — ver Registro Nº 045.
 *
 * Cobre 10 posições reais de mercado, uma por classe (menos Renda Fixa e
 * Renda Variável, com 2 cada, pra mostrar a diferença entre título de dívida
 * e ação/FII): Tesouro, CDB, Ações, FII, Fundo Multimercado, Bitcoin,
 * Imóvel (com aluguel de verdade), Veículo, Participação Societária (com
 * distribuição de lucro de verdade) e Ouro físico — cada um com pelo menos
 * um evento de rendimento/ganho/perda lançado, pra Análise não ficar zerada.
 *
 * Idempotente: se um investimento com o mesmo nome já existe no workspace,
 * pula (não duplica). Cria as carteiras de investimento que faltarem
 * (`kindCode=CONTA_INVESTIMENTO`) — reaproveita as que já existirem com o
 * mesmo nome.
 *
 * Uso:
 *   npx tsx scripts/seed-investment-examples.ts                        (se só existir 1 workspace)
 *   npx tsx scripts/seed-investment-examples.ts --workspace-id=<uuid>   (veja o id em
 *     Supabase > Table Editor > workspaces, se houver mais de um)
 */
import { prisma } from "../lib/db/prisma";
import { slugify } from "../lib/slug";
import { createInvestment, registerInvestmentEvent, registerInvestmentIncome } from "../lib/entries/investment";

async function resolveWorkspaceId(): Promise<string> {
  const workspaceIdArg = process.argv.find((a) => a.startsWith("--workspace-id="));
  if (workspaceIdArg) return workspaceIdArg.split("=")[1];

  const workspaces = await prisma.workspace.findMany();
  if (workspaces.length === 1) return workspaces[0].id;

  throw new Error(
    workspaces.length === 0
      ? "Nenhum workspace encontrado. Faca login no sistema primeiro."
      : `Existe mais de um workspace. Rode de novo com --workspace-id=<id>. Workspaces existentes: ${workspaces
          .map((w) => `${w.id} (${w.name})`)
          .join(", ")}`,
  );
}

/** Pessoa responsável padrão: prioriza quem tem "(eu)" no nome (convenção
 * observada nos responsáveis já cadastrados), senão pega a primeira. */
async function resolveResponsibleId(workspaceId: string): Promise<string> {
  const people = await prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
  if (people.length === 0) throw new Error("Nenhum responsável cadastrado neste workspace.");
  return (people.find((p) => p.name.includes("(eu)")) ?? people[0]).id;
}

/** `Profile.id` de quem "criou" os lançamentos (createdBy/updatedBy) — não é
 * o mesmo id de `Person` (responsável). Prioriza o titular do workspace. */
async function resolveProfileId(workspaceId: string): Promise<string> {
  const memberships = await prisma.membership.findMany({ where: { workspaceId }, orderBy: { role: "asc" } });
  if (memberships.length === 0) throw new Error("Nenhum membro cadastrado neste workspace.");
  return (memberships.find((m) => m.role === "TITULAR") ?? memberships[0]).profileId;
}

/** Carteira real (não-investimento) pra receber renda de verdade (aluguel,
 * distribuição de lucro) — primeira Conta Bancária ativa do workspace. */
async function resolveIncomeWalletId(workspaceId: string): Promise<string> {
  const wallet = await prisma.wallet.findFirst({
    where: { workspaceId, kindCode: "CONTA_BANCARIA", isActive: true },
    orderBy: { name: "asc" },
  });
  if (!wallet) throw new Error("Nenhuma Conta Bancária ativa neste workspace pra receber a renda de exemplo.");
  return wallet.id;
}

async function ensureInvestmentWallet(workspaceId: string, name: string): Promise<string> {
  const existing = await prisma.wallet.findFirst({ where: { workspaceId, name } });
  if (existing) return existing.id;
  const wallet = await prisma.wallet.create({
    data: { workspaceId, name, kindCode: "CONTA_INVESTIMENTO", slug: slugify(name) },
  });
  return wallet.id;
}

interface ExampleSpec {
  name: string;
  classCode: string;
  walletName: string;
  acquisitionDate: string;
  acquisitionAmount: string;
  details: Record<string, string>;
  events?: { categorySlug: Parameters<typeof registerInvestmentEvent>[2]["categorySlug"]; date: string; amount: string }[];
  income?: { categorySlug: "aluguel" | "participacao_nos_lucros"; date: string; amount: string }[];
}

const EXAMPLES: ExampleSpec[] = [
  {
    name: "Tesouro IPCA+ 2029",
    classCode: "RENDA_FIXA",
    walletName: "XP Investimento",
    acquisitionDate: "2025-09-15",
    acquisitionAmount: "5000.00",
    details: { instrumentType: "Tesouro IPCA+", indexador: "IPCA+", taxa: "6,10", vencimento: "2029-08-15" },
    events: [{ categorySlug: "juros", date: "2026-07-15", amount: "312.40" }],
  },
  {
    name: "CDB Banco Inter 110% CDI",
    classCode: "RENDA_FIXA",
    walletName: "NUInvest",
    acquisitionDate: "2025-11-01",
    acquisitionAmount: "3000.00",
    details: { instrumentType: "CDB", indexador: "CDI", taxa: "110% do CDI", vencimento: "2027-11-01" },
    events: [{ categorySlug: "juros", date: "2026-08-01", amount: "198.30" }],
  },
  {
    name: "PETR4",
    classCode: "RENDA_VARIAVEL",
    walletName: "Clear",
    acquisitionDate: "2026-02-10",
    acquisitionAmount: "2000.00",
    details: { instrumentType: "Ações", ticker: "PETR4", quantidade: "50", precoMedio: "40,00" },
    events: [{ categorySlug: "ganho_de_capital", date: "2026-08-05", amount: "340.00" }],
  },
  {
    name: "HGLG11",
    classCode: "RENDA_VARIAVEL",
    walletName: "BTG Pactual",
    acquisitionDate: "2025-06-20",
    acquisitionAmount: "4000.00",
    details: { instrumentType: "Fundo Imobiliário (FII)", ticker: "HGLG11", quantidade: "25", precoMedio: "160,00" },
    events: [
      { categorySlug: "dividendos", date: "2026-08-01", amount: "225.00" },
      { categorySlug: "perdas", date: "2026-05-15", amount: "-120.00" },
    ],
  },
  {
    name: "Fundo Multimercado XP",
    classCode: "FUNDOS_INVESTIMENTO",
    walletName: "XP Investimento",
    acquisitionDate: "2025-04-05",
    acquisitionAmount: "6000.00",
    details: { instrumentType: "Fundo Multimercado", estrategia: "Multimercado", cnpjFundo: "12.345.678/0001-90" },
    events: [{ categorySlug: "ganho_de_capital", date: "2026-07-20", amount: "540.00" }],
  },
  {
    name: "Bitcoin",
    classCode: "CRIPTOATIVOS",
    walletName: "Binance",
    acquisitionDate: "2026-01-10",
    acquisitionAmount: "1500.00",
    details: { instrumentType: "Bitcoin", quantidade: "0,015", precoMedio: "100.000,00" },
    events: [{ categorySlug: "ganho_de_capital", date: "2026-08-08", amount: "410.00" }],
  },
  {
    name: "Apartamento Rua das Flores",
    classCode: "IMOVEIS",
    walletName: "Apto Rua das Flores",
    acquisitionDate: "2024-03-01",
    acquisitionAmount: "250000.00",
    details: { instrumentType: "Imóvel para locação", endereco: "Rua das Flores, 123", aluguelMensalEsperado: "1800,00" },
    events: [{ categorySlug: "ganho_de_capital", date: "2026-07-01", amount: "18000.00" }],
    income: [
      { categorySlug: "aluguel", date: "2026-06-05", amount: "1800.00" },
      { categorySlug: "aluguel", date: "2026-07-05", amount: "1800.00" },
      { categorySlug: "aluguel", date: "2026-08-05", amount: "1800.00" },
    ],
  },
  {
    name: "Honda Civic 2020",
    classCode: "VEICULOS",
    walletName: "Honda Civic 2020",
    acquisitionDate: "2025-01-20",
    acquisitionAmount: "95000.00",
    details: { instrumentType: "Carro", placa: "ABC1D23", kmAtual: "42.000" },
    events: [{ categorySlug: "perdas", date: "2026-07-01", amount: "-8000.00" }],
  },
  {
    name: "15% Padaria do Zé",
    classCode: "PARTICIPACAO_SOCIETARIA",
    walletName: "Padaria do Zé",
    acquisitionDate: "2024-09-10",
    acquisitionAmount: "20000.00",
    details: { instrumentType: "Participação em LTDA", razaoSocial: "Padaria do Zé LTDA", percentual: "15" },
    income: [{ categorySlug: "participacao_nos_lucros", date: "2026-07-30", amount: "1200.00" }],
  },
  {
    name: "Ouro físico (100g)",
    classCode: "METAIS_PRECIOSOS",
    walletName: "Cofre - Metais Preciosos",
    acquisitionDate: "2025-10-05",
    acquisitionAmount: "35000.00",
    details: { instrumentType: "Ouro físico", quantidadeGramas: "100" },
    events: [{ categorySlug: "ganho_de_capital", date: "2026-08-01", amount: "2100.00" }],
  },
];

async function main() {
  const workspaceId = await resolveWorkspaceId();
  const profileId = await resolveProfileId(workspaceId);
  const responsibleId = await resolveResponsibleId(workspaceId);
  const incomeWalletId = await resolveIncomeWalletId(workspaceId);

  const created: string[] = [];
  const skipped: string[] = [];

  for (const example of EXAMPLES) {
    const existing = await prisma.investment.findFirst({ where: { workspaceId, name: example.name } });
    if (existing) {
      skipped.push(example.name);
      continue;
    }

    const walletId = await ensureInvestmentWallet(workspaceId, example.walletName);
    const investment = await createInvestment(workspaceId, profileId, {
      name: example.name,
      classCode: example.classCode,
      walletId,
      responsibleId,
      acquisitionDate: example.acquisitionDate,
      acquisitionAmount: example.acquisitionAmount,
      details: example.details,
    });

    for (const event of example.events ?? []) {
      await registerInvestmentEvent(workspaceId, profileId, {
        investmentId: investment.id,
        categorySlug: event.categorySlug,
        date: event.date,
        amount: event.amount,
        responsibleId,
      });
    }

    for (const income of example.income ?? []) {
      await registerInvestmentIncome(workspaceId, profileId, {
        investmentId: investment.id,
        walletId: incomeWalletId,
        categorySlug: income.categorySlug,
        date: income.date,
        amount: income.amount,
        responsibleId,
      });
    }

    created.push(example.name);
  }

  console.log("Criados:", created);
  if (skipped.length > 0) console.log("Já existiam, pulados:", skipped);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
