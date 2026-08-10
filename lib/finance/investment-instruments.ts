// Sem import de Decimal/Prisma de propósito — este módulo é importado por
// Client Components (formulário de cadastro/edição de investimento). Ver
// `lib/import/pdf-statement/types.ts` pro mesmo cuidado já tomado antes nesta
// sessão: `Decimal` de "@/lib/finance/types" reexporta de
// "@prisma/client/runtime/client", que carrega imports Node-only e quebra o
// build do webpack no bundle do cliente.

/**
 * Campos específicos por classe, guardados em `Investment.details` (coluna `Json`) —
 * sempre tem ao menos `instrumentType` (texto livre, com sugestões abaixo). O resto
 * varia por classe; todos os campos são opcionais (o cliente pode cadastrar rápido e
 * completar depois).
 */
export type InvestmentDetails =
  | { classCode: "RENDA_FIXA"; instrumentType?: string; indexador?: string; taxa?: string; vencimento?: string }
  | { classCode: "RENDA_VARIAVEL"; instrumentType?: string; ticker?: string; quantidade?: string; precoMedio?: string }
  | { classCode: "FUNDOS_INVESTIMENTO"; instrumentType?: string; estrategia?: string; cnpjFundo?: string }
  | { classCode: "CRIPTOATIVOS"; instrumentType?: string; quantidade?: string; precoMedio?: string }
  | { classCode: "IMOVEIS"; instrumentType?: string; endereco?: string; aluguelMensalEsperado?: string }
  | { classCode: "VEICULOS"; instrumentType?: string; placa?: string; kmAtual?: string }
  | { classCode: "METAIS_PRECIOSOS"; instrumentType?: string; quantidadeGramas?: string }
  | { classCode: "COMMODITIES"; instrumentType?: string; quantidade?: string; unidade?: string }
  | { classCode: "TERRAS_PRODUCAO_RURAL"; instrumentType?: string; areaHectares?: string; endereco?: string }
  | { classCode: "BENS_COLECIONAVEIS"; instrumentType?: string; descricaoItem?: string }
  | { classCode: "PARTICIPACAO_SOCIETARIA"; instrumentType?: string; razaoSocial?: string; percentual?: string }
  | { classCode: "PREVIDENCIA_PRIVADA"; instrumentType?: string; estrategiaFundo?: string }
  | { classCode: "OUTROS"; instrumentType?: string };

/** Um campo específico de classe no formulário — nome (chave em `details`), rótulo em
 * português e tipo de input HTML (padrão "text"). */
export interface InvestmentDetailField {
  name: string;
  label: string;
  type?: "text" | "date";
  placeholder?: string;
}

/** Quais campos de `details` o formulário mostra pra cada classe (fora `instrumentType`,
 * que é comum a todas). */
export const DETAIL_FIELDS_BY_CLASS: Record<string, InvestmentDetailField[]> = {
  RENDA_FIXA: [
    { name: "indexador", label: "Indexador", placeholder: "CDI, IPCA+, Prefixado..." },
    { name: "taxa", label: "Taxa (% ao ano)" },
    { name: "vencimento", label: "Vencimento", type: "date" },
  ],
  RENDA_VARIAVEL: [
    { name: "ticker", label: "Ticker" },
    { name: "quantidade", label: "Quantidade" },
    { name: "precoMedio", label: "Preço médio (R$)" },
  ],
  FUNDOS_INVESTIMENTO: [
    { name: "estrategia", label: "Estratégia", placeholder: "Multimercado, Ações, Renda Fixa..." },
    { name: "cnpjFundo", label: "CNPJ do fundo" },
  ],
  CRIPTOATIVOS: [
    { name: "quantidade", label: "Quantidade" },
    { name: "precoMedio", label: "Preço médio (R$)" },
  ],
  IMOVEIS: [
    { name: "endereco", label: "Endereço" },
    { name: "aluguelMensalEsperado", label: "Aluguel mensal esperado (R$)" },
  ],
  VEICULOS: [
    { name: "placa", label: "Placa" },
    { name: "kmAtual", label: "Km atual" },
  ],
  METAIS_PRECIOSOS: [{ name: "quantidadeGramas", label: "Quantidade (gramas)" }],
  COMMODITIES: [
    { name: "quantidade", label: "Quantidade" },
    { name: "unidade", label: "Unidade", placeholder: "sacas, toneladas, barris..." },
  ],
  TERRAS_PRODUCAO_RURAL: [
    { name: "areaHectares", label: "Área (hectares)" },
    { name: "endereco", label: "Localização" },
  ],
  BENS_COLECIONAVEIS: [{ name: "descricaoItem", label: "Descrição do item" }],
  PARTICIPACAO_SOCIETARIA: [
    { name: "razaoSocial", label: "Razão social da empresa" },
    { name: "percentual", label: "Percentual de participação (%)" },
  ],
  PREVIDENCIA_PRIVADA: [{ name: "estrategiaFundo", label: "Estratégia do fundo" }],
  OUTROS: [],
};

/**
 * Sugestões de "tipo de instrumento" por classe — vira `<datalist>` no formulário de
 * cadastro (rico igual uma lista fechada, mas o campo continua texto livre, então nada
 * trava se o cliente digitar algo fora da lista). Termos tirados direto da classificação
 * de mercado detalhada pelo usuário no pedido desta funcionalidade.
 */
export const INSTRUMENT_SUGGESTIONS_BY_CLASS: Record<string, string[]> = {
  RENDA_FIXA: [
    "Tesouro Selic",
    "Tesouro Prefixado",
    "Tesouro IPCA+",
    "CDB",
    "RDB",
    "LCI",
    "LCA",
    "LC",
    "Debênture",
    "CRI",
    "CRA",
    "Poupança",
    "Letra Financeira",
  ],
  RENDA_VARIAVEL: [
    "Ações",
    "ETF",
    "BDR",
    "Fundo de Ações",
    "Fundo Imobiliário (FII)",
    "Stocks no exterior",
    "REIT",
    "Opções",
    "Futuros",
    "Swap",
    "Contrato a termo",
  ],
  FUNDOS_INVESTIMENTO: ["Fundo Multimercado", "Fundo de Renda Fixa", "Fundo de Ações", "Fundo Cambial", "Fundo de Crédito Privado"],
  CRIPTOATIVOS: ["Bitcoin", "Ethereum", "Stablecoin", "Altcoin", "Token", "NFT"],
  IMOVEIS: [
    "Apartamento",
    "Casa",
    "Terreno",
    "Sala Comercial",
    "Loja",
    "Galpão",
    "Imóvel para locação",
    "Imóvel para valorização",
    "Imóvel para exploração comercial",
  ],
  VEICULOS: ["Carro", "Moto", "Caminhão", "Utilitário", "Veículo clássico"],
  METAIS_PRECIOSOS: ["Ouro físico", "Prata física", "Platina", "Paládio"],
  COMMODITIES: ["Café", "Soja", "Milho", "Açúcar", "Algodão", "Petróleo", "Gás", "Minério", "Gado", "Madeira"],
  TERRAS_PRODUCAO_RURAL: ["Terra agrícola", "Fazenda produtiva", "Pecuária", "Agricultura", "Reflorestamento", "Arrendamento rural"],
  BENS_COLECIONAVEIS: ["Obra de arte", "Relógio", "Carro clássico", "Moeda", "Selo", "Antiguidade", "Joia", "Vinho raro"],
  PARTICIPACAO_SOCIETARIA: ["Participação em LTDA", "Quotas empresariais", "Participação em startup", "Private equity", "Venture capital", "Angel investment"],
  PREVIDENCIA_PRIVADA: ["PGBL", "VGBL"],
  OUTROS: ["Peer-to-peer lending", "Crowdfunding", "Recebíveis", "Direitos creditórios", "Royalties", "Franquia", "Negócio próprio"],
};
