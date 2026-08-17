import type { DiagnosticInstrument } from "@/app/generated/prisma/enums";

/**
 * Etapa 10 — catálogo dos instrumentos de diagnóstico (§12 da Metodologia v5.0).
 *
 * **O que vem do documento e o que ainda não vem.** Os *campos* que cada
 * instrumento coleta estão especificados literalmente em §12.3 (A1), §12.4 (A2)
 * e §12.6 (C) — eles são reproduzidos aqui sem invenção. O que **não** está
 * definido é a redação pergunta a pergunta: são as Pendências #6–8 da própria
 * Metodologia, decisão do dono do produto. Por isso cada instrumento carrega
 * `redacaoConfirmada`, hoje `false` — mesmo mecanismo que fez PAN e AFF serem
 * confirmados na Etapa 9, em vez de um texto provisório passar despercebido
 * para sempre.
 *
 * O rótulo aqui é, portanto, **trabalho em cima do campo especificado**, não
 * a pergunta oficial. A tela diz isso ao consultor.
 *
 * B não está aqui de propósito: §12.5 é explícito em que é "impresso, uso
 * interno exclusivo, nunca entregue ao cliente", preenchido pelo consultor
 * depois da reunião. O enum do banco já o prevê; o formulário dele não é
 * escopo da Etapa 10.
 */

/** Sobe quando a redação ou os campos mudam — fica gravado em cada resposta. */
export const CATALOG_VERSION = "1";

export type FieldKind = "texto" | "texto_longo" | "numero" | "data" | "escolha" | "escolha_multipla" | "sim_nao" | "faixa" | "likert" | "consentimento";

export interface InstrumentField {
  /** Chave estável no `answers: Json`. Nunca muda depois de existir resposta gravada. */
  key: string;
  label: string;
  kind: FieldKind;
  /** Opções para `escolha`, `escolha_multipla` e `faixa`. */
  options?: string[];
  required: boolean;
  /** Texto de apoio, quando o próprio documento justifica a forma do campo. */
  hint?: string;
}

export interface InstrumentBlock {
  title: string;
  fields: InstrumentField[];
}

export interface InstrumentSpec {
  code: DiagnosticInstrument;
  name: string;
  /** Fase do método em que é aplicado (§12.8). */
  phase: number;
  /** Quem preenche — muda quem vê a tela. */
  respondent: "CLIENTE" | "CONSULTOR";
  purpose: string;
  /** Minutos previstos no documento; null quando ele não fixa. */
  estimatedMinutes: number | null;
  /** §12.3 fixa um teto duro para o A1; os demais não têm. */
  maxMinutes: number | null;
  /** false enquanto a redação oficial não for definida (Pendências #6–8). */
  redacaoConfirmada: boolean;
  blocks: InstrumentBlock[];
}

// --- A1 (§12.3) -------------------------------------------------------------
// "Digital, 8 a 10 minutos, enviado na Fase 0: identificação, idade, estado
// civil, regime de bens, dependentes · ocupação e natureza do vínculo · renda
// líquida aproximada do núcleo · existência de dívidas e modalidades ·
// existência de patrimônio relevante (faixas, não valores) · existência de PJ
// própria · três maiores preocupações financeiras em texto livre ·
// consentimento LGPD."

/**
 * §12.3 manda **faixas, não valores** no patrimônio do A1. É decisão de método,
 * não de UI: pedir valor exato antes da entrevista aumenta o atrito e convida à
 * omissão, e o valor preciso é justamente o que o A2 coleta depois.
 */
const FAIXAS_PATRIMONIO = [
  "Não tenho patrimônio relevante",
  "Até R$ 100 mil",
  "R$ 100 mil a R$ 500 mil",
  "R$ 500 mil a R$ 1 milhão",
  "R$ 1 milhão a R$ 5 milhões",
  "Acima de R$ 5 milhões",
  "Prefiro não informar",
];

const A1: InstrumentSpec = {
  code: "A1",
  name: "Pré-Diagnóstico",
  phase: 0,
  respondent: "CLIENTE",
  purpose:
    "Hard facts essenciais, antes da entrevista. Serve para o consultor chegar na conversa já sabendo o " +
    "essencial — não para substituir a entrevista.",
  estimatedMinutes: 9,
  // §12.1, regra de atrito: "o A1 nunca deve passar de 10 minutos. Tudo que
  // puder esperar vai para o A2." O teto é verificável — ver checkA1Atrito().
  maxMinutes: 10,
  redacaoConfirmada: false,
  blocks: [
    {
      title: "Identificação",
      fields: [
        { key: "nome_completo", label: "Nome completo", kind: "texto", required: true },
        { key: "idade", label: "Idade", kind: "numero", required: true },
        {
          key: "estado_civil",
          label: "Estado civil",
          kind: "escolha",
          options: ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"],
          required: true,
        },
        {
          key: "regime_bens",
          label: "Regime de bens",
          kind: "escolha",
          options: [
            "Não se aplica",
            "Comunhão parcial",
            "Comunhão universal",
            "Separação total",
            "Separação obrigatória",
            "Participação final nos aquestos",
            "Não sei",
          ],
          required: false,
          hint: "Se não souber, deixe em branco — isso é confirmado no A2.",
        },
        { key: "dependentes", label: "Quantos dependentes financeiros você tem?", kind: "numero", required: true },
      ],
    },
    {
      title: "Ocupação",
      fields: [
        { key: "ocupacao", label: "Ocupação", kind: "texto", required: true },
        {
          key: "natureza_vinculo",
          label: "Natureza do vínculo",
          kind: "escolha",
          options: [
            "CLT",
            "Servidor público efetivo",
            "Militar",
            "Empregado público",
            "Cargo comissionado",
            "Temporário",
            "Profissional liberal",
            "Autônomo",
            "Empresário",
            "MEI",
            "Informal",
            "Aposentado",
            "Pensionista",
            "Desempregado",
            "Outro",
          ],
          required: true,
        },
      ],
    },
    {
      title: "Renda",
      fields: [
        {
          key: "renda_liquida_nucleo",
          label: "Renda líquida aproximada do núcleo familiar (por mês)",
          kind: "numero",
          required: true,
          hint: "Aproximada mesmo — o valor exato é levantado depois, no A2.",
        },
      ],
    },
    {
      title: "Dívidas",
      fields: [
        { key: "tem_dividas", label: "Você tem dívidas hoje?", kind: "sim_nao", required: true },
        {
          key: "modalidades_divida",
          label: "De que tipo?",
          kind: "escolha_multipla",
          options: [
            "Cartão de crédito rotativo",
            "Cheque especial",
            "Empréstimo pessoal",
            "Consignado",
            "Financiamento de veículo",
            "Financiamento imobiliário",
            "Crédito estudantil",
            "Dívida com pessoa física",
            "Outra",
          ],
          required: false,
        },
      ],
    },
    {
      title: "Patrimônio",
      fields: [
        {
          key: "faixa_patrimonio",
          label: "Faixa aproximada do seu patrimônio",
          kind: "faixa",
          options: FAIXAS_PATRIMONIO,
          required: true,
          hint: "Faixa, não valor — o levantamento detalhado é feito no A2.",
        },
        { key: "tem_pj_propria", label: "Você tem empresa própria (PJ)?", kind: "sim_nao", required: true },
      ],
    },
    {
      title: "Preocupações",
      fields: [
        {
          key: "tres_preocupacoes",
          label: "Quais são suas três maiores preocupações financeiras hoje?",
          kind: "texto_longo",
          required: true,
          hint: "Escreva com suas palavras. Não há resposta certa.",
        },
      ],
    },
    {
      title: "Consentimento",
      fields: [
        {
          key: "consentimento_lgpd",
          label: "Autorizo o tratamento dos meus dados para fins da consultoria contratada (LGPD).",
          kind: "consentimento",
          required: true,
        },
      ],
    },
  ],
};

// --- A2 (§12.4) -------------------------------------------------------------
// Os oito blocos e seus itens são transcritos do documento. O A2 é "guiado pelo
// sistema após a entrevista, com prazo e lembretes automáticos" — é o
// instrumento longo, e é para cá que §12.1 manda empurrar tudo que puder
// esperar.

const A2: InstrumentSpec = {
  code: "A2",
  name: "Complementação Documental",
  phase: 1,
  respondent: "CLIENTE",
  purpose:
    "Hard facts detalhados, depois da entrevista. É o instrumento longo do método — para cá vai tudo que " +
    "puder esperar, justamente para o A1 caber em dez minutos.",
  estimatedMinutes: null,
  maxMinutes: null,
  redacaoConfirmada: false,
  blocks: [
    {
      title: "Renda e estabilidade",
      fields: [
        { key: "fontes_por_pessoa", label: "Fontes de renda por pessoa (bruta e líquida)", kind: "texto_longo", required: true },
        { key: "sazonalidade", label: "Há sazonalidade na renda?", kind: "texto_longo", required: false },
        { key: "beneficios", label: "Benefícios recebidos", kind: "texto_longo", required: false },
        { key: "tempo_vinculo", label: "Tempo de vínculo atual", kind: "texto", required: false },
        { key: "perspectiva_mudanca", label: "Perspectiva de mudança na renda", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Despesas declaradas",
      fields: [
        { key: "fixos_por_categoria", label: "Despesas fixas por categoria", kind: "texto_longo", required: true },
        { key: "variaveis_estimados", label: "Despesas variáveis estimadas", kind: "texto_longo", required: false },
        { key: "despesas_anuais", label: "Despesas anuais (IPVA, IPTU, matrículas…)", kind: "texto_longo", required: false },
        { key: "gastos_dependentes_terceiros", label: "Gastos com dependentes e terceiros", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Patrimônio",
      fields: [
        { key: "imoveis", label: "Imóveis", kind: "texto_longo", required: false },
        { key: "veiculos", label: "Veículos", kind: "texto_longo", required: false },
        { key: "aplicacoes", label: "Aplicações por instituição e classe", kind: "texto_longo", required: false },
        { key: "previdencia_privada", label: "Previdência privada", kind: "texto_longo", required: false },
        { key: "participacoes_societarias", label: "Participações societárias", kind: "texto_longo", required: false },
        { key: "direitos_a_receber", label: "Direitos a receber", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Passivos e crédito",
      fields: [
        {
          key: "dividas_detalhadas",
          label: "Por dívida: credor, modalidade, saldo, parcela, CET, prazo restante, garantia, situação",
          kind: "texto_longo",
          required: false,
        },
        { key: "negativacao", label: "Negativação, protesto ou ação judicial", kind: "texto_longo", required: false },
        { key: "rotativo_cheque_especial", label: "Uso de rotativo e cheque especial", kind: "texto_longo", required: false },
        { key: "fianca_aval", label: "Fiança ou aval a terceiros", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Proteção",
      fields: [
        { key: "seguros", label: "Seguros contratados", kind: "texto_longo", required: false },
        { key: "coberturas_empregador", label: "Coberturas do empregador", kind: "texto_longo", required: false },
        { key: "plano_saude", label: "Plano de saúde", kind: "texto_longo", required: false },
        { key: "cobertura_cartao", label: "Coberturas do cartão", kind: "texto_longo", required: false },
        { key: "reserva_atual", label: "Reserva atual", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Previdência",
      fields: [
        { key: "regime_previdenciario", label: "Regime previdenciário", kind: "texto", required: false },
        { key: "tempo_contribuicao", label: "Tempo de contribuição", kind: "texto", required: false },
        { key: "previdencia_complementar", label: "Previdência complementar", kind: "texto_longo", required: false },
        { key: "acesso_cnis", label: "Tem acesso ao extrato do CNIS?", kind: "sim_nao", required: false },
      ],
    },
    {
      title: "Tributação",
      fields: [
        {
          key: "modelo_declaracao",
          label: "Modelo de declaração de IR",
          kind: "escolha",
          options: ["Simplificada", "Completa", "Isento", "Não sei"],
          required: false,
        },
        { key: "rendimentos_tributaveis_isentos", label: "Rendimentos tributáveis e isentos", kind: "texto_longo", required: false },
        { key: "pj_propria", label: "PJ própria e pró-labore", kind: "texto_longo", required: false },
        {
          key: "mistura_pf_pj",
          label: "Grau de mistura entre pessoa física e jurídica",
          kind: "escolha",
          options: ["Não se aplica", "Totalmente separados", "Alguma mistura", "Muito misturados"],
          required: false,
        },
      ],
    },
    {
      title: "Objetivos",
      fields: [
        {
          key: "objetivos",
          label: "Seus objetivos: valor, prazo e priorização",
          kind: "texto_longo",
          required: true,
          hint: "A priorização é forçada de propósito — ordenar objetivos é o que revela o que de fato importa.",
        },
      ],
    },
  ],
};

// --- C (§12.6) --------------------------------------------------------------
// "Digital, escala Likert, respondido individualmente e sem companhia."
// As oito dimensões são as do documento, nesta ordem.

/** §12.6 — as oito dimensões, na ordem em que a Metodologia as lista. */
export const DIMENSOES_C = [
  { key: "tolerancia_perda", label: "Tolerância à perda" },
  { key: "horizonte", label: "Horizonte" },
  { key: "conhecimento_previo", label: "Conhecimento prévio" },
  { key: "necessidade_liquidez", label: "Necessidade de liquidez" },
  { key: "aversao_complexidade", label: "Aversão a complexidade" },
  { key: "disciplina", label: "Disciplina" },
  { key: "locus_controle", label: "Locus de controle financeiro" },
  { key: "propensao_endividamento", label: "Propensão ao endividamento" },
] as const;

/** Likert de 5 pontos. */
export const LIKERT_OPTIONS = [
  "Discordo totalmente",
  "Discordo",
  "Neutro",
  "Concordo",
  "Concordo totalmente",
];

const C: InstrumentSpec = {
  code: "C",
  name: "Perfil Comportamental e Tolerância a Risco",
  phase: 1,
  respondent: "CLIENTE",
  purpose:
    "A camada comportamental. §12.6 é explícito: respondido individualmente e sem companhia — em família, " +
    "cada pessoa responde a sua, sozinha. Não substitui o suitability regulatório, que é aplicado pela " +
    "instituição onde o cliente opera.",
  estimatedMinutes: null,
  maxMinutes: null,
  redacaoConfirmada: false,
  blocks: [
    {
      title: "Perfil comportamental",
      fields: DIMENSOES_C.map((d) => ({
        key: d.key,
        label: d.label,
        kind: "likert" as const,
        options: LIKERT_OPTIONS,
        required: true,
      })),
    },
  ],
};

export const INSTRUMENTS: Record<"A1" | "A2" | "C", InstrumentSpec> = { A1, A2, C };

/** Só os que a Etapa 10 entrega como formulário — B é interno (§12.5). */
export const INSTRUMENT_CODES = ["A1", "A2", "C"] as const;
export type FormInstrumentCode = (typeof INSTRUMENT_CODES)[number];

export function instrumentSpec(code: FormInstrumentCode): InstrumentSpec {
  return INSTRUMENTS[code];
}

/** Todos os campos de um instrumento, achatados — usado por validação e tela. */
export function allFields(code: FormInstrumentCode): InstrumentField[] {
  return INSTRUMENTS[code].blocks.flatMap((b) => b.fields);
}
