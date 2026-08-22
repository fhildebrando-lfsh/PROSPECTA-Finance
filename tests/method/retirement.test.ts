import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  IDADE_FINAL_PADRAO,
  SCENARIOS,
  TAXA_REAL_PADRAO,
  aporteNecessario,
  capitalParaRenda,
  nextVersion,
  projectAll,
  projectScenario,
  type Assumptions,
  type ProjectionInput,
} from "@/lib/method/retirement";

const premissas: Assumptions = {
  taxaRealAnual: 0.04,
  idadeFinal: 90,
  rendaJaExistenteMensal: "0",
};

function entrada(over: Partial<ProjectionInput> = {}): ProjectionInput {
  return {
    idadeAtual: 40,
    idadeAlvo: 65,
    rendaDesejadaMensal: new Decimal(10000),
    capitalAtual: new Decimal(0),
    aporteMensalAtual: new Decimal(0),
    ...over,
  };
}

describe("premissas declaradas", () => {
  it("os três cenários existem e crescem em retorno", () => {
    expect(SCENARIOS).toEqual(["conservador", "base", "otimista"]);
    expect(TAXA_REAL_PADRAO.conservador).toBeLessThan(TAXA_REAL_PADRAO.base);
    expect(TAXA_REAL_PADRAO.base).toBeLessThan(TAXA_REAL_PADRAO.otimista);
  });

  /**
   * Horizonte bem acima da expectativa média é deliberado: o risco tratado aqui
   * é o de **viver mais** que o dinheiro, e planejar pela média deixaria metade
   * das pessoas descoberta.
   */
  it("o horizonte de longevidade é conservador", () => {
    expect(IDADE_FINAL_PADRAO).toBeGreaterThanOrEqual(85);
  });
});

describe("capitalParaRenda", () => {
  /**
   * Com taxa zero o capital é exatamente o que será sacado. Tratar como caso à
   * parte evita divisão por zero e mantém o número honesto em vez de infinito.
   */
  it("sem rendimento, é a soma simples dos saques", () => {
    expect(capitalParaRenda(new Decimal(1000), 120, 0).toFixed(2)).toBe("120000.00");
  });

  it("com rendimento, exige menos capital que a soma dos saques", () => {
    const semJuros = capitalParaRenda(new Decimal(1000), 120, 0);
    const comJuros = capitalParaRenda(new Decimal(1000), 120, 0.04);
    expect(comJuros.lessThan(semJuros)).toBe(true);
  });

  it("quanto maior a taxa, menor o capital necessário", () => {
    const a = capitalParaRenda(new Decimal(5000), 300, 0.02);
    const b = capitalParaRenda(new Decimal(5000), 300, 0.06);
    expect(b.lessThan(a)).toBe(true);
  });

  it("sem prazo ou sem renda, não há capital a acumular", () => {
    expect(capitalParaRenda(new Decimal(5000), 0, 0.04).toFixed(2)).toBe("0.00");
    expect(capitalParaRenda(ZERO(), 120, 0.04).toFixed(2)).toBe("0.00");
  });
});

function ZERO() {
  return new Decimal(0);
}

describe("aporteNecessario", () => {
  it("sem juros, é a diferença dividida pelos meses", () => {
    // 120.000 em 120 meses, partindo do zero e sem rendimento = 1.000/mês.
    expect(aporteNecessario(new Decimal(120000), ZERO(), 120, 0).toFixed(2)).toBe("1000.00");
  });

  it("capital já existente reduz o aporte", () => {
    const semCapital = aporteNecessario(new Decimal(500000), ZERO(), 240, 0.04);
    const comCapital = aporteNecessario(new Decimal(500000), new Decimal(100000), 240, 0.04);
    expect(comCapital.lessThan(semCapital)).toBe(true);
  });

  /** Zero, e não negativo: número negativo leria como "pode sacar". */
  it("objetivo já alcançado devolve zero, nunca negativo", () => {
    const r = aporteNecessario(new Decimal(100000), new Decimal(500000), 240, 0.04);
    expect(r.toFixed(2)).toBe("0.00");
  });

  it("sem prazo, devolve zero em vez de dividir por zero", () => {
    expect(aporteNecessario(new Decimal(100000), ZERO(), 0, 0.04).toFixed(2)).toBe("0.00");
  });
});

describe("projectScenario", () => {
  it("calcula anos de acumulação e de renda a partir das idades", () => {
    const r = projectScenario(entrada(), "base", premissas);
    expect(r.anosAteAlvo).toBe(25);
    expect(r.anosDeRenda).toBe(25);
    expect(r.alertas).toEqual([]);
  });

  /** §5 — "fontes já existentes" abatem o que o capital precisa produzir. */
  it("renda já existente reduz o que o capital precisa cobrir", () => {
    const semINSS = projectScenario(entrada(), "base", premissas);
    const comINSS = projectScenario(entrada(), "base", { ...premissas, rendaJaExistenteMensal: "4000" });

    expect(comINSS.rendaACobrirMensal.toFixed(2)).toBe("6000.00");
    expect(comINSS.requiredCapital.lessThan(semINSS.requiredCapital)).toBe(true);
  });

  it("fontes que cobrem tudo zeram a necessidade, e a tela é avisada", () => {
    const r = projectScenario(entrada(), "base", { ...premissas, rendaJaExistenteMensal: "15000" });
    expect(r.rendaACobrirMensal.toFixed(2)).toBe("0.00");
    expect(r.requiredCapital.toFixed(2)).toBe("0.00");
    expect(r.alertas.join(" ")).toContain("cobrem a renda desejada");
  });

  it("idade-alvo no passado é avisada em vez de produzir número silencioso", () => {
    const r = projectScenario(entrada({ idadeAtual: 70, idadeAlvo: 65 }), "base", premissas);
    expect(r.anosAteAlvo).toBe(0);
    expect(r.alertas.join(" ")).toContain("não é maior que a idade atual");
  });

  it("idade final menor que a alvo é avisada", () => {
    const r = projectScenario(entrada(), "base", { ...premissas, idadeFinal: 60 });
    expect(r.anosDeRenda).toBe(0);
    expect(r.alertas.join(" ")).toContain("período de renda");
  });

  describe("suficiência (indicador Longevidade do PSF)", () => {
    it("aporte zero com necessidade positiva é zero por cento", () => {
      expect(projectScenario(entrada(), "base", premissas).suficienciaPct).toBe(0);
    });

    /** Necessário zero é objetivo alcançado — não uma divisão por zero. */
    it("nada a aportar significa cem por cento", () => {
      const r = projectScenario(
        entrada({ capitalAtual: new Decimal(10_000_000) }),
        "base",
        premissas,
      );
      expect(r.requiredMonthlyContribution.toFixed(2)).toBe("0.00");
      expect(r.suficienciaPct).toBe(100);
    });

    it("aporte acima do necessário não passa de cem", () => {
      const base = projectScenario(entrada(), "base", premissas);
      const generoso = projectScenario(
        entrada({ aporteMensalAtual: base.requiredMonthlyContribution.times(3) }),
        "base",
        premissas,
      );
      expect(generoso.suficienciaPct).toBe(100);
    });

    it("metade do aporte necessário dá cerca de cinquenta por cento", () => {
      const base = projectScenario(entrada(), "base", premissas);
      const metade = projectScenario(
        entrada({ aporteMensalAtual: base.requiredMonthlyContribution.dividedBy(2) }),
        "base",
        premissas,
      );
      expect(metade.suficienciaPct).toBeGreaterThan(49);
      expect(metade.suficienciaPct).toBeLessThan(51);
    });
  });
});

describe("projectAll", () => {
  it("devolve os três cenários, e o otimista exige menos", () => {
    const rs = projectAll(entrada(), { idadeFinal: 90, rendaJaExistenteMensal: "0" });

    expect(rs.map((r) => r.scenario)).toEqual(["conservador", "base", "otimista"]);

    const [cons, , otim] = rs;
    // Retorno maior significa capital menor e aporte menor — a intuição que o
    // cliente precisa ver: a premissa muda o tamanho do problema.
    expect(otim.requiredCapital.lessThan(cons.requiredCapital)).toBe(true);
    expect(otim.requiredMonthlyContribution.lessThan(cons.requiredMonthlyContribution)).toBe(true);
  });

  it("cada cenário grava a premissa que o produziu", () => {
    const rs = projectAll(entrada(), { idadeFinal: 90, rendaJaExistenteMensal: "0" });
    for (const r of rs) {
      expect(r.assumptions.taxaRealAnual).toBe(TAXA_REAL_PADRAO[r.scenario]);
      expect(r.assumptions.idadeFinal).toBe(90);
    }
  });
});

describe("nextVersion", () => {
  it("começa em zero e nunca reaproveita número", () => {
    expect(nextVersion([])).toBe(0);
    expect(nextVersion([0, 1])).toBe(2);
    expect(nextVersion([0, 3])).toBe(4);
  });
});
