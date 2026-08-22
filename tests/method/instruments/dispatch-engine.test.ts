import { describe, expect, it } from "vitest";
import {
  MAX_LEMBRETES,
  PRAZO_DIAS,
  addDays,
  diasEntre,
  planDispatches,
  type DispatchState,
} from "@/lib/method/instruments/dispatch-engine";

const D0 = new Date(Date.UTC(2026, 7, 1));

function base(over: Partial<Parameters<typeof planDispatches>[0]> = {}) {
  return {
    engagementStartsAt: D0,
    phasesStarted: [0],
    dispatches: [] as DispatchState[],
    submitted: [] as ("A1" | "A2" | "C")[],
    today: D0,
    ...over,
  };
}

function envio(over: Partial<DispatchState> = {}): DispatchState {
  return {
    instrument: "A1",
    dispatchedAt: D0,
    dueAt: addDays(D0, 5),
    remindersSent: 0,
    lastReminderAt: null,
    completedAt: null,
    ...over,
  };
}

describe("prazos do protocolo (§12.8)", () => {
  it("A1 tem cinco dias; A2 e C, oito", () => {
    expect(PRAZO_DIAS.A1).toBe(5);
    expect(PRAZO_DIAS.A2).toBe(8);
    expect(PRAZO_DIAS.C).toBe(8);
  });
});

describe("planDispatches — o que enviar", () => {
  it("envia o A1 assim que o contrato abre", () => {
    const acoes = planDispatches(base());
    expect(acoes).toHaveLength(1);
    expect(acoes[0]).toMatchObject({ kind: "ENVIAR", instrument: "A1" });
  });

  /**
   * A âncora do A2/C é o início da Fase 1, não "D8 corridos": se a entrevista
   * atrasa, mandar o A2 antes dela entregaria um formulário que a conversa
   * ainda não preparou.
   */
  it("não envia A2 nem C enquanto a Fase 1 não começou", () => {
    const acoes = planDispatches(base({ today: addDays(D0, 30) }));
    expect(acoes.map((a) => a.kind === "ENVIAR" && a.instrument)).toEqual(["A1"]);
  });

  it("envia A2 e C quando a Fase 1 começa", () => {
    const acoes = planDispatches(
      base({ phasesStarted: [0, 1], dispatches: [envio()], today: addDays(D0, 8) }),
    );
    const enviados = acoes.filter((a) => a.kind === "ENVIAR").map((a) => a.instrument);
    expect(enviados.sort()).toEqual(["A2", "C"]);
  });

  it("nunca reenvia o que já foi enviado", () => {
    const acoes = planDispatches(base({ dispatches: [envio()] }));
    expect(acoes.filter((a) => a.kind === "ENVIAR")).toHaveLength(0);
  });

  /** O cliente pode ter entrado na tela e respondido sem ter sido cobrado. */
  it("não pede o que o cliente já respondeu por conta própria", () => {
    const acoes = planDispatches(base({ submitted: ["A1"] }));
    expect(acoes.filter((a) => a.kind === "ENVIAR")).toHaveLength(0);
  });

  it("contrato com início no futuro não dispara nada ainda", () => {
    const acoes = planDispatches(base({ engagementStartsAt: addDays(D0, 3) }));
    expect(acoes).toEqual([]);
  });
});

describe("planDispatches — lembretes", () => {
  it("não lembra antes da metade do prazo", () => {
    expect(planDispatches(base({ dispatches: [envio()], today: addDays(D0, 2) }))).toEqual([]);
  });

  it("primeiro lembrete na metade do prazo", () => {
    const acoes = planDispatches(base({ dispatches: [envio()], today: addDays(D0, 3) }));
    expect(acoes).toEqual([{ kind: "LEMBRAR", instrument: "A1", numero: 1, diasParaPrazo: 2 }]);
  });

  it("segundo lembrete só no vencimento", () => {
    const jaLembrado = envio({ remindersSent: 1, lastReminderAt: addDays(D0, 3) });
    expect(planDispatches(base({ dispatches: [jaLembrado], today: addDays(D0, 4) }))).toEqual([]);

    const acoes = planDispatches(base({ dispatches: [jaLembrado], today: addDays(D0, 5) }));
    expect(acoes).toEqual([{ kind: "LEMBRAR", instrument: "A1", numero: 2, diasParaPrazo: 0 }]);
  });

  /**
   * O limite existe para o sistema não virar spam. Cliente que marca a
   * PROSPECTA como remetente indesejado deixa de receber o que importa, e o
   * atraso vira assunto do consultor — que vê na tela.
   */
  it("para depois do limite, mesmo muito atrasado", () => {
    const esgotado = envio({ remindersSent: MAX_LEMBRETES, lastReminderAt: addDays(D0, 5) });
    expect(planDispatches(base({ dispatches: [esgotado], today: addDays(D0, 90) }))).toEqual([]);
  });

  /** Protege contra o cron rodar duas vezes no mesmo dia. */
  it("não manda dois lembretes no mesmo dia", () => {
    const hoje = addDays(D0, 3);
    const jaHoje = envio({ remindersSent: 1, lastReminderAt: hoje });
    expect(planDispatches(base({ dispatches: [jaHoje], today: hoje }))).toEqual([]);
  });

  it("envio já concluído não gera lembrete", () => {
    const concluido = envio({ completedAt: addDays(D0, 1) });
    expect(planDispatches(base({ dispatches: [concluido], today: addDays(D0, 90) }))).toEqual([]);
  });

  it("respondido vira conclusão, não lembrete", () => {
    const acoes = planDispatches(
      base({ dispatches: [envio()], submitted: ["A1"], today: addDays(D0, 5) }),
    );
    expect(acoes).toEqual([{ kind: "CONCLUIR", instrument: "A1" }]);
  });
});

describe("auxiliares de data", () => {
  it("diasEntre trunca em dias inteiros", () => {
    expect(diasEntre(D0, addDays(D0, 3))).toBe(3);
    expect(diasEntre(D0, new Date(D0.getTime() + 3.9 * 86_400_000))).toBe(3);
  });
});
