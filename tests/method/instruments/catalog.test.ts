import { describe, expect, it } from "vitest";
import {
  DIMENSOES_C,
  INSTRUMENTS,
  INSTRUMENT_CODES,
  LIKERT_OPTIONS,
  allFields,
} from "@/lib/method/instruments/catalog";
import { checkAtrito, estimatedSeconds, isEmpty, validateAnswers } from "@/lib/method/instruments/validation";

describe("catálogo dos instrumentos (§12)", () => {
  it("entrega A1, A2 e C — B é interno e não vira formulário (§12.5)", () => {
    expect(INSTRUMENT_CODES).toEqual(["A1", "A2", "C"]);
  });

  it("cada instrumento tem propósito, fase e ao menos um bloco", () => {
    for (const code of INSTRUMENT_CODES) {
      const spec = INSTRUMENTS[code];
      expect(spec.purpose.length).toBeGreaterThan(0);
      expect(spec.blocks.length).toBeGreaterThan(0);
      expect(spec.phase).toBeGreaterThanOrEqual(0);
    }
  });

  it("A1 é da Fase 0; A2 e C são da Fase 1 (§12.8)", () => {
    expect(INSTRUMENTS.A1.phase).toBe(0);
    expect(INSTRUMENTS.A2.phase).toBe(1);
    expect(INSTRUMENTS.C.phase).toBe(1);
  });

  /**
   * Guarda contra o erro mais caro possível aqui: mudar a chave de um campo
   * depois de existir resposta gravada tornaria a resposta antiga ilegível,
   * porque `answers` é Json indexado por essas chaves.
   */
  it("as chaves são únicas dentro de cada instrumento", () => {
    for (const code of INSTRUMENT_CODES) {
      const keys = allFields(code).map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("todo campo de escolha oferece opções", () => {
    for (const code of INSTRUMENT_CODES) {
      for (const f of allFields(code)) {
        if (f.kind === "escolha" || f.kind === "escolha_multipla" || f.kind === "faixa" || f.kind === "likert") {
          expect(f.options, `${code}.${f.key}`).toBeDefined();
          expect(f.options!.length).toBeGreaterThan(1);
        }
      }
    }
  });

  /**
   * A redação pergunta a pergunta é decisão do dono do produto (Pendências
   * #6–8 da Metodologia v5.0). Este teste falha de propósito quando ela for
   * definida — mesmo mecanismo que fez PAN e AFF serem confirmados na Etapa 9,
   * em vez de um texto provisório passar despercebido para sempre.
   */
  it("a redação ainda não é a oficial, e isso está declarado", () => {
    const naoConfirmados = INSTRUMENT_CODES.filter((c) => !INSTRUMENTS[c].redacaoConfirmada);
    expect(naoConfirmados).toEqual(["A1", "A2", "C"]);
  });
});

describe("A1 — o que §12.3 exige", () => {
  const keys = allFields("A1").map((f) => f.key);

  it("cobre os dez itens listados no documento", () => {
    for (const k of [
      "nome_completo",
      "idade",
      "estado_civil",
      "regime_bens",
      "dependentes",
      "ocupacao",
      "natureza_vinculo",
      "renda_liquida_nucleo",
      "tem_dividas",
      "modalidades_divida",
      "faixa_patrimonio",
      "tem_pj_propria",
      "tres_preocupacoes",
      "consentimento_lgpd",
    ]) {
      expect(keys, k).toContain(k);
    }
  });

  /** §12.3, literal: "existência de patrimônio relevante (faixas, não valores)". */
  it("patrimônio é faixa, nunca valor", () => {
    const campo = allFields("A1").find((f) => f.key === "faixa_patrimonio")!;
    expect(campo.kind).toBe("faixa");
    expect(campo.kind).not.toBe("numero");
    expect(campo.options!.length).toBeGreaterThan(2);
  });

  it("o consentimento LGPD é obrigatório", () => {
    const campo = allFields("A1").find((f) => f.key === "consentimento_lgpd")!;
    expect(campo.kind).toBe("consentimento");
    expect(campo.required).toBe(true);
  });

  /**
   * §12.1: "o A1 nunca deve passar de 10 minutos. Tudo que puder esperar vai
   * para o A2." Este teste é o que impede a regra de virar letra morta: quem
   * acrescentar campos ao A1 no futuro descobre aqui, não em produção.
   */
  it("cabe no teto de dez minutos", () => {
    const atrito = checkAtrito("A1")!;
    expect(atrito.maxMinutes).toBe(10);
    expect(atrito.withinBudget, `estimado ${atrito.estimatedMinutes.toFixed(1)} min`).toBe(true);
  });

  /**
   * A âncora da calibração. §12.3 declara "8 a 10 minutos" para exatamente
   * estes campos — se a estimativa não pousar nessa faixa, o medidor está
   * descalibrado e o teto acima deixa de proteger de verdade. Este teste é o
   * que impede o guard-rail de virar decoração.
   */
  it("a estimativa bate com os 8–10 minutos que o documento declara", () => {
    const { estimatedMinutes } = checkAtrito("A1")!;
    expect(estimatedMinutes).toBeGreaterThanOrEqual(8);
    expect(estimatedMinutes).toBeLessThanOrEqual(10);
  });

  it("só o A1 tem teto — A2 e C não têm na Metodologia", () => {
    expect(checkAtrito("A2")).toBeNull();
    expect(checkAtrito("C")).toBeNull();
  });

  it("a estimativa cresce quando se acrescenta campo", () => {
    // Sanidade do próprio medidor: se ele não reagisse, o teto não protegeria nada.
    const base = estimatedSeconds(INSTRUMENTS.A1);
    const maior = estimatedSeconds({
      ...INSTRUMENTS.A1,
      blocks: [...INSTRUMENTS.A1.blocks, { title: "extra", fields: [{ key: "x", label: "x", kind: "texto_longo", required: false }] }],
    });
    expect(maior).toBeGreaterThan(base);
  });
});

describe("C — o que §12.6 exige", () => {
  it("tem as oito dimensões, na ordem do documento", () => {
    expect(DIMENSOES_C.map((d) => d.key)).toEqual([
      "tolerancia_perda",
      "horizonte",
      "conhecimento_previo",
      "necessidade_liquidez",
      "aversao_complexidade",
      "disciplina",
      "locus_controle",
      "propensao_endividamento",
    ]);
  });

  it("toda dimensão é Likert de cinco pontos", () => {
    expect(LIKERT_OPTIONS).toHaveLength(5);
    for (const f of allFields("C")) {
      expect(f.kind).toBe("likert");
      expect(f.options).toEqual(LIKERT_OPTIONS);
      expect(f.required).toBe(true);
    }
  });
});

describe("isEmpty", () => {
  it("trata em branco, nulo e lista vazia como vazio", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("   ")).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty([])).toBe(true);
  });

  it("não confunde resposta legítima com vazio", () => {
    expect(isEmpty("não")).toBe(false);
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty(["cartão"])).toBe(false);
  });
});

describe("validateAnswers", () => {
  const a1Completo = {
    nome_completo: "Fulano de Tal",
    idade: 40,
    estado_civil: "Casado(a)",
    dependentes: 2,
    ocupacao: "Analista",
    natureza_vinculo: "CLT",
    renda_liquida_nucleo: 12000,
    tem_dividas: true,
    faixa_patrimonio: "R$ 100 mil a R$ 500 mil",
    tem_pj_propria: false,
    tres_preocupacoes: "aposentadoria, dívida do carro, faculdade dos filhos",
    consentimento_lgpd: true,
  };

  it("aponta quais campos faltam, não só que está incompleto", () => {
    const r = validateAnswers("A1", { nome_completo: "Fulano" });
    expect(r.isComplete).toBe(false);
    expect(r.missing.length).toBeGreaterThan(1);
    expect(r.missing).not.toContain("Nome completo");
  });

  it("completo quando todo obrigatório está respondido", () => {
    const r = validateAnswers("A1", a1Completo);
    expect(r.missing).toEqual([]);
    expect(r.isComplete).toBe(true);
  });

  it("campo opcional em branco não impede o envio", () => {
    // regime_bens e modalidades_divida são opcionais de propósito.
    expect(validateAnswers("A1", { ...a1Completo, regime_bens: "", modalidades_divida: [] }).isComplete).toBe(true);
  });

  /** Zero dependentes é resposta, não ausência de resposta. */
  it("zero é resposta legítima num campo numérico", () => {
    expect(validateAnswers("A1", { ...a1Completo, dependentes: 0 }).isComplete).toBe(true);
  });

  /** "Não tenho dívidas" é resposta; o campo não pode ser cobrado de novo. */
  it("false é resposta legítima num sim/não", () => {
    expect(validateAnswers("A1", { ...a1Completo, tem_dividas: false }).isComplete).toBe(true);
  });

  /**
   * O único booleano em que `false` reprova: não consentir não é consentir.
   * Deixar passar aqui gravaria tratamento de dado sem base legal.
   */
  it("consentimento não dado reprova, mesmo sendo um booleano válido", () => {
    const r = validateAnswers("A1", { ...a1Completo, consentimento_lgpd: false });
    expect(r.isComplete).toBe(false);
    expect(r.missing.join(" ")).toContain("LGPD");
  });

  it("o C só está completo com as oito dimensões respondidas", () => {
    const parcial = Object.fromEntries(DIMENSOES_C.slice(0, 5).map((d) => [d.key, "Concordo"]));
    expect(validateAnswers("C", parcial).missing).toHaveLength(3);

    const completo = Object.fromEntries(DIMENSOES_C.map((d) => [d.key, "Neutro"]));
    expect(validateAnswers("C", completo).isComplete).toBe(true);
  });

  it("chave desconhecida no Json não atrapalha", () => {
    // Resposta gravada por uma versão anterior do catálogo pode ter campo a mais.
    expect(validateAnswers("A1", { ...a1Completo, campo_de_outra_versao: "x" }).isComplete).toBe(true);
  });
});
