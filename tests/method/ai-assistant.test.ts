import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import { answerQuestion, type AiAssistantContext } from "@/lib/method/ai-assistant";

const HOJE = new Date(Date.UTC(2026, 5, 15));

let counter = 0;
function makeEntry(overrides: Partial<AiAssistantContext["entries"][number]> = {}) {
  counter += 1;
  return {
    id: `entry-${counter}`,
    walletId: "wallet-1",
    categoryId: "cat-alimentacao",
    nature: "DESPESA" as const,
    amount: new Decimal(-100),
    transactionDate: HOJE,
    dueDate: HOJE,
    status: "PAGO" as const,
    recurrenceKind: "UNICA" as const,
    ...overrides,
  };
}

function baseContext(overrides: Partial<AiAssistantContext> = {}): AiAssistantContext {
  return {
    entries: [],
    wallets: [{ id: "wallet-1", kindCode: "CONTA_BANCARIA" }],
    categories: [
      { id: "cat-alimentacao", name: "Alimentação" },
      { id: "cat-transporte", name: "Transporte" },
    ],
    openIncidentCount: 0,
    reserveGoal: null,
    today: HOJE,
    ...overrides,
  };
}

describe("answerQuestion", () => {
  it("recusa pedido de recomendação de investimento (P2)", () => {
    const result = answerQuestion("em que eu invisto esse dinheiro?", baseContext());
    expect(result.intent).toBe("RECOMENDACAO_RECUSADA");
    expect(result.answerQuery).toBeNull();
  });

  it("recusa pedido de qual ação comprar", () => {
    const result = answerQuestion("qual ação comprar esse mês?", baseContext());
    expect(result.intent).toBe("RECOMENDACAO_RECUSADA");
  });

  it("responde quantos incidentes pendentes existem", () => {
    const result = answerQuestion("quantos incidentes eu tenho?", baseContext({ openIncidentCount: 3 }));
    expect(result.intent).toBe("INCIDENTES_PENDENTES");
    expect(result.answerText).toContain("3");
  });

  it("responde sem incidentes quando a fila está vazia", () => {
    const result = answerQuestion("tenho algum incidente?", baseContext({ openIncidentCount: 0 }));
    expect(result.answerText).toContain("não tem nenhum incidente");
  });

  it("responde saldo total somando os blocos do dashboard", () => {
    const context = baseContext({
      entries: [makeEntry({ nature: "RECEITA", amount: new Decimal(1000) })],
    });
    const result = answerQuestion("qual meu saldo?", context);
    expect(result.intent).toBe("SALDO_TOTAL");
    expect(result.answerText).toContain("1.000");
  });

  it("responde quanto falta pra reserva quando há meta", () => {
    const context = baseContext({
      reserveGoal: { targetAmount: new Decimal(10000), currentBalance: new Decimal(4000) },
    });
    const result = answerQuestion("quanto falta pra minha reserva?", context);
    expect(result.intent).toBe("RESERVA_RESTANTE");
    expect(result.answerText).toContain("6.000");
  });

  it("avisa que reserva já foi atingida", () => {
    const context = baseContext({
      reserveGoal: { targetAmount: new Decimal(10000), currentBalance: new Decimal(12000) },
    });
    const result = answerQuestion("quanto falta pra reserva?", context);
    expect(result.answerText).toContain("já atingiu");
  });

  it("avisa que não há meta de reserva cadastrada", () => {
    const result = answerQuestion("quanto falta pra reserva?", baseContext({ reserveGoal: null }));
    expect(result.answerText).toContain("não tem uma meta de reserva");
  });

  it("responde gasto de uma categoria específica citada na pergunta", () => {
    const context = baseContext({
      entries: [
        makeEntry({ categoryId: "cat-alimentacao", amount: new Decimal(-300) }),
        makeEntry({ categoryId: "cat-transporte", amount: new Decimal(-50) }),
      ],
    });
    const result = answerQuestion("quanto eu gastei com Alimentação esse mês?", context);
    expect(result.intent).toBe("GASTO_CATEGORIA_MES");
    expect(result.answerText).toContain("Alimentação");
    expect(result.answerText).toContain("300");
    expect(result.answerText).not.toContain("350");
  });

  it("responde gasto total quando nenhuma categoria é citada", () => {
    const context = baseContext({
      entries: [
        makeEntry({ categoryId: "cat-alimentacao", amount: new Decimal(-300) }),
        makeEntry({ categoryId: "cat-transporte", amount: new Decimal(-50) }),
      ],
    });
    const result = answerQuestion("quanto eu gastei esse mês?", context);
    expect(result.answerText).toContain("350");
  });

  it("ignora despesa pendente no cálculo de gasto por categoria", () => {
    const context = baseContext({
      entries: [makeEntry({ categoryId: "cat-alimentacao", amount: new Decimal(-300), status: "A_PAGAR" })],
    });
    const result = answerQuestion("quanto gastei em Alimentação?", context);
    expect(result.answerText).toContain("0,00");
  });

  it("responde receita do mês", () => {
    const context = baseContext({
      entries: [makeEntry({ nature: "RECEITA", amount: new Decimal(5000), categoryId: "cat-salario" })],
    });
    const result = answerQuestion("quanto eu recebi esse mês?", context);
    expect(result.intent).toBe("RECEITA_MES");
    expect(result.answerText).toContain("5.000");
  });

  /**
   * Regressão de um defeito real visto em produção (2026-08-16): "Quanto eu
   * tenho de investimentos?" batia em "quanto eu tenho" e era respondida com o
   * SALDO TOTAL, enquanto "quais investimentos eu tenho?" respondia
   * corretamente "não sei". Duas formas da mesma pergunta, dois
   * comportamentos — e o errado era o que respondia com confiança.
   */
  it("não responde saldo para pergunta sobre investimentos", () => {
    const context = baseContext({
      entries: [makeEntry({ nature: "RECEITA", amount: new Decimal(1000) })],
    });
    const result = answerQuestion("Quanto eu tenho de investimentos?", context);

    expect(result.intent).toBe("NAO_RECONHECIDA");
    // A mensagem de recusa cita "saldo total" ao listar o que ele sabe responder;
    // o que não pode acontecer é ele de fato responder com o valor.
    expect(result.answerText).not.toContain("Seu saldo total hoje é");
    expect(result.answerQuery).toBeNull();
  });

  it("trata as duas formas da mesma pergunta igual", () => {
    const context = baseContext();
    const a = answerQuestion("Quanto eu tenho de investimentos?", context);
    const b = answerQuestion("quais investimentos eu tenho?", context);
    expect(a.intent).toBe(b.intent);
  });

  it.each([
    "quanto eu tenho de patrimônio?",
    "qual minha dívida hoje?",
    "quanto gastei no cartão?",
    "qual a rentabilidade da carteira?",
  ])("admite não saber em vez de responder outra coisa: %s", (pergunta) => {
    const result = answerQuestion(pergunta, baseContext());
    expect(result.intent).toBe("NAO_RECONHECIDA");
    expect(result.answerQuery).toBeNull();
  });

  it("continua respondendo saldo quando a pergunta é mesmo sobre saldo", () => {
    const context = baseContext({
      entries: [makeEntry({ nature: "RECEITA", amount: new Decimal(1000) })],
    });
    expect(answerQuestion("quanto eu tenho?", context).intent).toBe("SALDO_TOTAL");
    expect(answerQuestion("qual meu saldo?", context).intent).toBe("SALDO_TOTAL");
  });

  it("retorna intent não reconhecida para pergunta fora do catálogo", () => {
    const result = answerQuestion("qual é o sentido da vida?", baseContext());
    expect(result.intent).toBe("NAO_RECONHECIDA");
    expect(result.answerQuery).toBeNull();
  });
});
