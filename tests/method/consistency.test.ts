import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  CONSISTENCY_WEIGHTS,
  coberturaDeCarteiras,
  coberturaTemporal,
  computeConsistencyIndex,
  conciliacao,
  filaDeIncidentes,
  qualidadeCategorizacao,
  type ConsistencyComponents,
} from "@/lib/method/consistency";

const JANEIRO_2026 = { start: new Date(Date.UTC(2026, 0, 1)), end: new Date(Date.UTC(2026, 0, 31)) }; // 31 dias

describe("coberturaTemporal", () => {
  it("100% quando todo dia do período tem pelo menos 1 lançamento", () => {
    const entries = Array.from({ length: 31 }, (_, i) => ({ dueDate: new Date(Date.UTC(2026, 0, i + 1)) }));
    expect(coberturaTemporal(entries, JANEIRO_2026)).toBe(1);
  });

  it("proporção de dias cobertos quando não é todo dia", () => {
    const entries = [
      { dueDate: new Date(Date.UTC(2026, 0, 1)) },
      { dueDate: new Date(Date.UTC(2026, 0, 2)) },
    ];
    // 2 dias cobertos de 31
    expect(coberturaTemporal(entries, JANEIRO_2026)).toBeCloseTo(2 / 31, 5);
  });

  it("múltiplos lançamentos no mesmo dia contam como 1 dia coberto", () => {
    const entries = [
      { dueDate: new Date(Date.UTC(2026, 0, 5)) },
      { dueDate: new Date(Date.UTC(2026, 0, 5)) },
      { dueDate: new Date(Date.UTC(2026, 0, 5)) },
    ];
    expect(coberturaTemporal(entries, JANEIRO_2026)).toBeCloseTo(1 / 31, 5);
  });

  it("zero lançamentos no período = 0 (não é null — é um resultado real, não falta de dado)", () => {
    expect(coberturaTemporal([], JANEIRO_2026)).toBe(0);
  });

  it("lançamento fora do período não conta", () => {
    const entries = [{ dueDate: new Date(Date.UTC(2026, 1, 1)) }];
    expect(coberturaTemporal(entries, JANEIRO_2026)).toBe(0);
  });
});

describe("qualidadeCategorizacao", () => {
  it("proporção de lançamentos com subcategoria preenchida", () => {
    const entries = [
      { dueDate: new Date(Date.UTC(2026, 0, 5)), subcategoryId: "sub-1" },
      { dueDate: new Date(Date.UTC(2026, 0, 6)), subcategoryId: "sub-2" },
      { dueDate: new Date(Date.UTC(2026, 0, 7)), subcategoryId: null },
      { dueDate: new Date(Date.UTC(2026, 0, 8)), subcategoryId: null },
    ];
    expect(qualidadeCategorizacao(entries, JANEIRO_2026)).toBe(0.5);
  });

  it("null (não avaliado) quando não há nenhum lançamento no período", () => {
    expect(qualidadeCategorizacao([], JANEIRO_2026)).toBeNull();
  });
});

describe("filaDeIncidentes", () => {
  const hoje = new Date(Date.UTC(2026, 5, 1));

  it("1 (perfeito) quando não há incidente aberto", () => {
    expect(filaDeIncidentes([], hoje)).toBe(1);
  });

  it("1 quando todos os incidentes abertos têm menos de 30 dias", () => {
    const incidentes = [{ createdAt: new Date(Date.UTC(2026, 4, 20)) }]; // 12 dias
    expect(filaDeIncidentes(incidentes, hoje)).toBe(1);
  });

  it("degrada proporcionalmente conforme incidentes passam de 30 dias", () => {
    const incidentes = [
      { createdAt: new Date(Date.UTC(2026, 4, 20)) }, // 12 dias — não vencido
      { createdAt: new Date(Date.UTC(2026, 3, 1)) }, // ~61 dias — vencido
    ];
    expect(filaDeIncidentes(incidentes, hoje)).toBe(0.5);
  });

  it("0 quando todos os incidentes abertos estão vencidos", () => {
    const incidentes = [{ createdAt: new Date(Date.UTC(2026, 2, 1)) }];
    expect(filaDeIncidentes(incidentes, hoje)).toBe(0);
  });

  it("limite exato de 30 dias ainda não conta como vencido (> 30, não >=)", () => {
    const incidentes = [{ createdAt: new Date(Date.UTC(2026, 4, 2)) }]; // exatamente 30 dias
    expect(filaDeIncidentes(incidentes, hoje)).toBe(1);
  });
});

describe("coberturaDeCarteiras", () => {
  it("proporção de carteiras ativas com movimento no período", () => {
    const entries = [{ walletId: "w1", dueDate: new Date(Date.UTC(2026, 0, 5)) }];
    expect(coberturaDeCarteiras(entries, ["w1", "w2"], JANEIRO_2026)).toBe(0.5);
  });

  it("null (não avaliado) quando o workspace não tem nenhuma carteira ativa", () => {
    expect(coberturaDeCarteiras([], [], JANEIRO_2026)).toBeNull();
  });

  it("movimento fora do período não conta como cobertura", () => {
    const entries = [{ walletId: "w1", dueDate: new Date(Date.UTC(2026, 1, 1)) }];
    expect(coberturaDeCarteiras(entries, ["w1"], JANEIRO_2026)).toBe(0);
  });
});

describe("conciliacao", () => {
  it("1 (perfeito) quando saldo declarado bate exatamente com o do sistema", () => {
    const reconciliations = [
      { walletId: "w1", declaredBalance: new Decimal(1000), systemBalance: new Decimal(1000), checkedAt: new Date() },
    ];
    expect(conciliacao(reconciliations, ["w1"])).toBe(1);
  });

  it("degrada proporcionalmente à diferença sobre o valor declarado", () => {
    const reconciliations = [
      { walletId: "w1", declaredBalance: new Decimal(1000), systemBalance: new Decimal(900), checkedAt: new Date() },
    ];
    expect(conciliacao(reconciliations, ["w1"])).toBeCloseTo(0.9, 5);
  });

  it("nunca fica negativo mesmo com diferença maior que o valor declarado", () => {
    const reconciliations = [
      { walletId: "w1", declaredBalance: new Decimal(100), systemBalance: new Decimal(500), checkedAt: new Date() },
    ];
    expect(conciliacao(reconciliations, ["w1"])).toBe(0);
  });

  it("usa só a conciliação mais recente de cada carteira", () => {
    const reconciliations = [
      {
        walletId: "w1",
        declaredBalance: new Decimal(500),
        systemBalance: new Decimal(0), // muito errado, mas é a checagem antiga
        checkedAt: new Date(Date.UTC(2026, 0, 1)),
      },
      {
        walletId: "w1",
        declaredBalance: new Decimal(1000),
        systemBalance: new Decimal(1000), // perfeito, é a checagem recente
        checkedAt: new Date(Date.UTC(2026, 1, 1)),
      },
    ];
    expect(conciliacao(reconciliations, ["w1"])).toBe(1);
  });

  it("null (não avaliado) quando nenhuma carteira ativa tem conciliação", () => {
    expect(conciliacao([], ["w1", "w2"])).toBeNull();
  });

  it("carteira sem conciliação fica de fora da média, não penaliza", () => {
    const reconciliations = [
      { walletId: "w1", declaredBalance: new Decimal(1000), systemBalance: new Decimal(1000), checkedAt: new Date() },
    ];
    // w2 nunca foi conciliada — média deve ser só de w1 (1), não (1+0)/2
    expect(conciliacao(reconciliations, ["w1", "w2"])).toBe(1);
  });

  it("evita divisão por zero quando o saldo declarado é zero", () => {
    const reconciliations = [
      { walletId: "w1", declaredBalance: new Decimal(0), systemBalance: new Decimal(0), checkedAt: new Date() },
    ];
    expect(conciliacao(reconciliations, ["w1"])).toBe(1);
  });
});

describe("computeConsistencyIndex", () => {
  it("pesos somam 100", () => {
    const total = Object.values(CONSISTENCY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it("média ponderada quando todos os componentes têm dado", () => {
    const components: ConsistencyComponents = {
      coberturaTemporal: 1,
      qualidadeCategorizacao: 1,
      filaDeIncidentes: 1,
      coberturaDeCarteiras: 1,
      conciliacao: 1,
    };
    expect(computeConsistencyIndex(components).overall).toBe(100);
  });

  it("componentes null são excluídos e o peso redistribuído — não penaliza falta de dado", () => {
    const components: ConsistencyComponents = {
      coberturaTemporal: 1,
      qualidadeCategorizacao: null,
      filaDeIncidentes: 1,
      coberturaDeCarteiras: null,
      conciliacao: null,
    };
    // só cobertura temporal (25) e fila de incidentes (20) têm dado, ambos = 1 → 100%
    expect(computeConsistencyIndex(components).overall).toBe(100);
  });

  it("overall é null só quando absolutamente nenhum componente tem dado", () => {
    const components: ConsistencyComponents = {
      coberturaTemporal: 0.5, // sempre calculável, nunca null na prática — mas o teste força o caso-limite via mock
      qualidadeCategorizacao: null,
      filaDeIncidentes: 1,
      coberturaDeCarteiras: null,
      conciliacao: null,
    };
    expect(computeConsistencyIndex(components).overall).not.toBeNull();

    const tudoNulo = {
      coberturaTemporal: null as unknown as number,
      qualidadeCategorizacao: null,
      filaDeIncidentes: null as unknown as number,
      coberturaDeCarteiras: null,
      conciliacao: null,
    } as ConsistencyComponents;
    expect(computeConsistencyIndex(tudoNulo).overall).toBeNull();
  });

  it("mistura de valores parciais pondera corretamente", () => {
    const components: ConsistencyComponents = {
      coberturaTemporal: 0.8, // peso 25
      qualidadeCategorizacao: 0.5, // peso 25
      filaDeIncidentes: 1, // peso 20
      coberturaDeCarteiras: null,
      conciliacao: null,
    };
    // pesos considerados: 25+25+20=70; soma ponderada: 25*0.8+25*0.5+20*1=20+12.5+20=52.5
    // 52.5/70 = 0.75 -> 75
    expect(computeConsistencyIndex(components).overall).toBe(75);
  });
});
