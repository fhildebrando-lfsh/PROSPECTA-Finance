import type { DiagnosticInstrument } from "@/app/generated/prisma/enums";

/**
 * Etapa 10 — catálogo dos instrumentos de diagnóstico (§12 da Metodologia v5.0).
 *
 * **De onde vêm os campos e de onde vem a redação.** Os *campos* que cada
 * instrumento coleta estão especificados literalmente em §12.3 (A1), §12.4 (A2)
 * e §12.6 (C) — reproduzidos aqui sem invenção. A *redação* pergunta a pergunta
 * eram as Pendências #6–8 da Metodologia; foi definida e aprovada pelo dono do
 * produto em 2026-08-17, e `redacaoConfirmada` passou a `true`.
 *
 * **Princípios que a redação segue**, para que uma pergunta nova acrescentada
 * depois não destoe:
 * - Segunda pessoa e linguagem de conversa — quem responde é o cliente, não um
 *   analista. "Quanto entra por mês" em vez de "renda líquida do núcleo".
 * - Uma pergunta por campo. Pergunta dupla produz resposta ambígua e obriga o
 *   consultor a desempatar na entrevista.
 * - Onde o dado exato exigiria procurar documento, a pergunta **autoriza a
 *   aproximação em voz alta** — no A1 isso é o que protege o teto de dez
 *   minutos; o número exato é justamente o que o A2 levanta depois.
 * - Nada de julgamento embutido. "Você tem alguma dívida hoje?" e não "Você
 *   está endividado?": §12.2 observa que no formulário a pessoa omite o que é
 *   constrangedor, e redação que constrange aumenta a omissão que o método
 *   quer justamente evitar.
 *
 * B não está aqui de propósito: §12.5 é explícito em que é "impresso, uso
 * interno exclusivo, nunca entregue ao cliente", preenchido pelo consultor
 * depois da reunião. O enum do banco já o prevê; o formulário dele não é
 * escopo da Etapa 10.
 */

/**
 * Sobe quando a redação ou os campos mudam — fica gravado em cada resposta.
 *
 * v2 (2026-08-17): redação definida e confirmada. A v1 nunca chegou a receber
 * resposta em produção, mas o número avança do mesmo jeito: reaproveitá-lo
 * faria duas redações diferentes se apresentarem como a mesma.
 */
export const CATALOG_VERSION = "2";

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
  redacaoConfirmada: true,
  blocks: [
    {
      title: "Identificação",
      fields: [
        { key: "nome_completo", label: "Qual o seu nome completo?", kind: "texto", required: true },
        { key: "idade", label: "Quantos anos você tem?", kind: "numero", required: true },
        {
          key: "estado_civil",
          label: "Qual o seu estado civil?",
          kind: "escolha",
          options: ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"],
          required: true,
        },
        {
          key: "regime_bens",
          label: "Se você é casado ou vive em união estável, qual o regime de bens?",
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
          hint: "Se não souber ou não se aplicar, deixe em branco — isso é confirmado depois.",
        },
        { key: "dependentes", label: "Quantas pessoas dependem financeiramente de você hoje?", kind: "numero", required: true },
      ],
    },
    {
      title: "Ocupação",
      fields: [
        { key: "ocupacao", label: "O que você faz hoje?", kind: "texto", required: true },
        {
          key: "natureza_vinculo",
          label: "Como é o seu vínculo de trabalho?",
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
          label: "Somando todo mundo da casa, quanto entra por mês já descontados os impostos?",
          kind: "numero",
          required: true,
          hint: "Pode ser por alto. O número exato entra depois, no A2 — aqui interessa a ordem de grandeza.",
        },
      ],
    },
    {
      title: "Dívidas",
      fields: [
        { key: "tem_dividas", label: "Você tem alguma dívida hoje?", kind: "sim_nao", required: true },
        {
          key: "modalidades_divida",
          label: "Quais destas você tem?",
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
          label: "Somando o que você tem — imóveis, veículos, aplicações —, em qual faixa isso cai?",
          kind: "faixa",
          options: FAIXAS_PATRIMONIO,
          required: true,
          hint: "Só a faixa. O levantamento item a item é feito depois, com calma.",
        },
        { key: "tem_pj_propria", label: "Você tem empresa própria (CNPJ)?", kind: "sim_nao", required: true },
      ],
    },
    {
      title: "Preocupações",
      fields: [
        {
          key: "tres_preocupacoes",
          label: "Quais são as três coisas que mais te preocupam hoje, quando você pensa em dinheiro?",
          kind: "texto_longo",
          required: true,
          hint: "Escreva com suas palavras, do jeito que vier. Não existe resposta certa aqui — e é uma das partes que o consultor mais lê.",
        },
      ],
    },
    {
      title: "Consentimento",
      fields: [
        {
          key: "consentimento_lgpd",
          label:
            "Autorizo a PROSPECTA a tratar as informações que eu fornecer aqui e os dados da minha conta para " +
            "executar a consultoria que contratei — elaborar meu diagnóstico, meus planos e acompanhar sua execução. " +
            "Sei que posso pedir acesso, correção ou eliminação desses dados a qualquer momento, e que retirar este " +
            "consentimento interrompe a consultoria daqui para a frente, sem apagar o que já foi entregue.",
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
  redacaoConfirmada: true,
  blocks: [
    {
      title: "Renda e estabilidade",
      fields: [
        { key: "fontes_por_pessoa", label: "Quais são as fontes de renda de cada pessoa da casa? Informe o valor bruto e o líquido de cada uma.", kind: "texto_longo", required: true },
        { key: "sazonalidade", label: "Sua renda varia ao longo do ano? Se varia, em quais meses ela sobe e em quais ela cai?", kind: "texto_longo", required: false },
        { key: "beneficios", label: "Que benefícios vocês recebem além do salário? (vale-refeição, plano de saúde, PLR, bônus, auxílios)", kind: "texto_longo", required: false },
        { key: "tempo_vinculo", label: "Há quanto tempo você está no vínculo de trabalho atual?", kind: "texto", required: false },
        { key: "perspectiva_mudanca", label: "Você espera alguma mudança na sua renda nos próximos doze meses?", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Despesas declaradas",
      fields: [
        { key: "fixos_por_categoria", label: "Quais são suas despesas fixas e quanto cada uma custa por mês?", kind: "texto_longo", required: true },
        { key: "variaveis_estimados", label: "E as despesas que mudam de mês para mês — quanto elas costumam somar?", kind: "texto_longo", required: false },
        { key: "despesas_anuais", label: "Que despesas aparecem só uma ou duas vezes por ano? (IPVA, IPTU, matrícula, seguro, férias)", kind: "texto_longo", required: false },
        { key: "gastos_dependentes_terceiros", label: "Você banca alguma despesa de dependentes ou de outras pessoas? Quais, e quanto?", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Patrimônio",
      fields: [
        { key: "imoveis", label: "Que imóveis vocês têm? Diga o uso de cada um e um valor aproximado.", kind: "texto_longo", required: false },
        { key: "veiculos", label: "Que veículos vocês têm, e quanto vale cada um aproximadamente?", kind: "texto_longo", required: false },
        { key: "aplicacoes", label: "Onde está o seu dinheiro aplicado hoje? Liste por instituição e tipo de aplicação.", kind: "texto_longo", required: false },
        { key: "previdencia_privada", label: "Vocês têm previdência privada? Em qual instituição, que tipo de plano e com qual saldo?", kind: "texto_longo", required: false },
        { key: "participacoes_societarias", label: "Você é sócio de alguma empresa? Qual a sua participação?", kind: "texto_longo", required: false },
        { key: "direitos_a_receber", label: "Há valores que você tem a receber? (aluguéis, precatórios, empréstimos a terceiros, acordos)", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Passivos e crédito",
      fields: [
        {
          key: "dividas_detalhadas",
          label: "Para cada dívida em aberto: quem é o credor, que tipo de dívida é, quanto falta, qual a parcela, o CET, o prazo restante, se há garantia e como está a situação.",
          kind: "texto_longo",
          required: false,
        },
        { key: "negativacao", label: "Existe negativação, protesto ou ação judicial no seu nome ou no de alguém da casa?", kind: "texto_longo", required: false },
        { key: "rotativo_cheque_especial", label: "Você usa rotativo do cartão ou cheque especial? Com que frequência?", kind: "texto_longo", required: false },
        { key: "fianca_aval", label: "Você é fiador ou avalista de alguém?", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Proteção",
      fields: [
        { key: "seguros", label: "Que seguros vocês têm hoje? (vida, residencial, automóvel, viagem, outros)", kind: "texto_longo", required: false },
        { key: "coberturas_empregador", label: "Seu empregador oferece alguma cobertura? (seguro de vida em grupo, auxílios, previdência)", kind: "texto_longo", required: false },
        { key: "plano_saude", label: "Vocês têm plano de saúde? Qual é, e o que ele cobre?", kind: "texto_longo", required: false },
        { key: "cobertura_cartao", label: "Seu cartão oferece alguma cobertura que você conhece ou já usou?", kind: "texto_longo", required: false },
        { key: "reserva_atual", label: "Quanto vocês têm guardado hoje para emergências, e onde esse dinheiro está?", kind: "texto_longo", required: false },
      ],
    },
    {
      title: "Previdência",
      fields: [
        { key: "regime_previdenciario", label: "Em qual regime previdenciário você contribui? (INSS, regime próprio, militar, nenhum)", kind: "texto", required: false },
        { key: "tempo_contribuicao", label: "Há quanto tempo você contribui?", kind: "texto", required: false },
        { key: "previdencia_complementar", label: "Você tem previdência complementar? Qual plano, de que tipo e com qual saldo?", kind: "texto_longo", required: false },
        {
          key: "acesso_cnis",
          label: "Você consegue acessar o seu extrato do CNIS?",
          kind: "sim_nao",
          required: false,
          hint: "É o extrato das suas contribuições ao INSS, no app ou site Meu INSS. Se nunca acessou, responda não — o consultor orienta.",
        },
      ],
    },
    {
      title: "Tributação",
      fields: [
        {
          key: "modelo_declaracao",
          label: "Como você declara imposto de renda?",
          kind: "escolha",
          options: ["Simplificada", "Completa", "Isento", "Não sei"],
          required: false,
        },
        { key: "rendimentos_tributaveis_isentos", label: "Que rendimentos você recebe, e como cada um é tributado?", kind: "texto_longo", required: false },
        { key: "pj_propria", label: "Se você tem empresa própria: qual o faturamento, o pró-labore, e como você se remunera?", kind: "texto_longo", required: false },
        {
          key: "mistura_pf_pj",
          label: "O quanto as contas da empresa se misturam com as suas contas pessoais?",
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
          label: "Quais são os seus objetivos financeiros? Para cada um, diga o valor e o prazo — e depois coloque-os em ordem, do mais importante para o menos.",
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

/**
 * §12.6 — as oito dimensões, na ordem em que a Metodologia as lista.
 *
 * `label` é o nome técnico da dimensão, que o consultor lê; `afirmacao` é o que
 * o cliente de fato vê. São separados porque "Locus de controle financeiro" não
 * é uma frase com a qual alguém concorda ou discorda.
 *
 * **Todas as afirmações apontam para o mesmo lado**: concordar sempre indica
 * mais capacidade de assumir risco. A alternativa clássica — misturar frases
 * invertidas para pegar quem responde tudo igual sem ler — foi deixada de fora
 * por ora, porque exigiria que o cálculo do perfil soubesse quais itens
 * inverter, e esse cálculo ainda não existe. Quando existir, é o momento de
 * reavaliar: uniformidade facilita responder, mas não detecta resposta
 * automática.
 *
 * A primeira afirmação usa **valores absolutos**, e não percentuais, porque
 * §12.6 é explícito quanto a isso: "tolerância à perda (cenários com valores
 * absolutos)". Perda em porcentagem é sistematicamente subestimada por quem
 * responde; em reais, a pessoa sente o tamanho.
 */
export const DIMENSOES_C = [
  {
    key: "tolerancia_perda",
    label: "Tolerância à perda",
    afirmacao:
      "Se eu tivesse R$ 50.000 aplicados e, num mês ruim, esse valor caísse para R$ 42.000, eu deixaria o dinheiro onde está.",
  },
  {
    key: "horizonte",
    label: "Horizonte",
    afirmacao: "Eu consigo deixar uma parte do meu dinheiro aplicada por mais de cinco anos sem precisar dela.",
  },
  {
    key: "conhecimento_previo",
    label: "Conhecimento prévio",
    afirmacao: "Antes de aplicar em alguma coisa, eu entendo sozinho como aquilo funciona e o que pode dar errado.",
  },
  {
    key: "necessidade_liquidez",
    label: "Necessidade de liquidez",
    afirmacao: "Eu conseguiria passar três meses sem sacar nada do que está investido.",
  },
  {
    key: "aversao_complexidade",
    label: "Aversão a complexidade",
    afirmacao: "Eu me sinto à vontade com um investimento de regras mais complicadas, que exige acompanhamento.",
  },
  {
    key: "disciplina",
    label: "Disciplina",
    afirmacao: "Quando eu me comprometo a guardar um valor todo mês, eu cumpro — inclusive nos meses apertados.",
  },
  {
    key: "locus_controle",
    label: "Locus de controle financeiro",
    afirmacao: "O resultado das minhas finanças depende muito mais das minhas decisões do que da sorte ou da economia.",
  },
  {
    key: "propensao_endividamento",
    label: "Propensão ao endividamento",
    afirmacao: "Eu evito usar crédito para antecipar consumo, mesmo quando as condições parecem boas.",
  },
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
  redacaoConfirmada: true,
  blocks: [
    {
      title: "Perfil comportamental",
      fields: DIMENSOES_C.map((d) => ({
        key: d.key,
        label: d.afirmacao,
        kind: "likert" as const,
        options: LIKERT_OPTIONS,
        required: true,
        hint: d.label,
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
