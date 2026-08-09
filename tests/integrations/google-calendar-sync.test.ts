import { describe, expect, it } from "vitest";
import { decideGoogleCalendarAction } from "@/lib/integrations/google-calendar/sync";

describe("decideGoogleCalendarAction", () => {
  it("cria quando está A_PAGAR e ainda não tem evento", () => {
    expect(decideGoogleCalendarAction({ statusCode: "A_PAGAR", googleEventId: null })).toBe("create");
  });

  it("cria quando está A_RECEBER e ainda não tem evento", () => {
    expect(decideGoogleCalendarAction({ statusCode: "A_RECEBER", googleEventId: null })).toBe("create");
  });

  it("atualiza quando está A_PAGAR e já tem evento", () => {
    expect(decideGoogleCalendarAction({ statusCode: "A_PAGAR", googleEventId: "evt-1" })).toBe("update");
  });

  it("atualiza quando está A_RECEBER e já tem evento", () => {
    expect(decideGoogleCalendarAction({ statusCode: "A_RECEBER", googleEventId: "evt-1" })).toBe("update");
  });

  it("apaga quando foi liquidado (PAGO) e tinha evento — some da agenda", () => {
    expect(decideGoogleCalendarAction({ statusCode: "PAGO", googleEventId: "evt-1" })).toBe("delete");
  });

  it("apaga quando foi liquidado (RECEBIDO) e tinha evento", () => {
    expect(decideGoogleCalendarAction({ statusCode: "RECEBIDO", googleEventId: "evt-1" })).toBe("delete");
  });

  it("apaga para qualquer outra situação com evento (ex.: ISENTO)", () => {
    expect(decideGoogleCalendarAction({ statusCode: "ISENTO", googleEventId: "evt-1" })).toBe("delete");
  });

  it("não faz nada quando já não está em aberto e nunca teve evento", () => {
    expect(decideGoogleCalendarAction({ statusCode: "PAGO", googleEventId: null })).toBe("noop");
  });
});
