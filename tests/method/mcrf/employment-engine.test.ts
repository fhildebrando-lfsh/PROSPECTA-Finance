import { describe, expect, it } from "vitest";
import {
  computePortability,
  recoveryCurve,
  segundaAtividadeEhResiliente,
  type EmploymentProfile,
} from "@/lib/method/mcrf/employment-engine";

function perfil(overrides: Partial<EmploymentProfile> = {}): EmploymentProfile {
  return {
    regime: "CLT",
    experienceTotalMonths: 120,
    tenureCurrentMonths: 24,
    segundaAtividadeNivel: null,
    ...overrides,
  };
}

describe("computePortability — IPP", () => {
  /**
   * §20: "Graduação nunca utilizada profissionalmente deverá receber peso
   * inferior a atividade secundária efetivamente exercida."
   */
  it("atividade exercida vale mais que capacidade teórica", () => {
    const ativa = computePortability(perfil({ segundaAtividadeNivel: "RENDA_SECUNDARIA_ATIVA" })).ipp;
    const adormecida = computePortability(perfil({ segundaAtividadeNivel: "RENDA_SECUNDARIA_ADORMECIDA" })).ipp;
    const potencial = computePortability(perfil({ segundaAtividadeNivel: "CAPACIDADE_POTENCIAL" })).ipp;
    const teorica = computePortability(perfil({ segundaAtividadeNivel: "POSSIBILIDADE_TEORICA" })).ipp;

    expect(ativa).toBeGreaterThan(adormecida);
    expect(adormecida).toBeGreaterThan(potencial);
    expect(potencial).toBeGreaterThan(teorica);
  });

  it("possibilidade teórica não vale ponto nenhum (§21.4)", () => {
    const semNada = computePortability(perfil({ segundaAtividadeNivel: null })).ipp;
    const teorica = computePortability(perfil({ segundaAtividadeNivel: "POSSIBILIDADE_TEORICA" })).ipp;
    expect(teorica).toBe(semNada);
  });

  /**
   * §23 — o ponto central: estabilidade e portabilidade são eixos independentes.
   * O militar tem a renda mais estável do sistema e a menor portabilidade.
   */
  it("militar e servidor têm portabilidade menor que CLT e autônomo", () => {
    const militar = computePortability(perfil({ regime: "MILITAR" })).ipp;
    const servidor = computePortability(perfil({ regime: "SERVIDOR_EFETIVO" })).ipp;
    const clt = computePortability(perfil({ regime: "CLT" })).ipp;
    const autonomo = computePortability(perfil({ regime: "AUTONOMO" })).ipp;

    expect(militar).toBeLessThan(clt);
    expect(servidor).toBeLessThan(clt);
    expect(autonomo).toBeGreaterThan(clt);
  });

  it("uma segunda atividade ativa compensa boa parte da baixa portabilidade do militar", () => {
    // É exatamente a recomendação que §23 manda dar em vez de inflar reserva.
    const semSegunda = computePortability(perfil({ regime: "MILITAR" })).ipp;
    const comSegunda = computePortability(
      perfil({ regime: "MILITAR", segundaAtividadeNivel: "RENDA_SECUNDARIA_ATIVA" }),
    ).ipp;
    expect(comSegunda).toBeGreaterThan(semSegunda + 25);
  });

  it("experiência tem retorno decrescente", () => {
    const doisAnos = computePortability(perfil({ experienceTotalMonths: 24 })).ipp;
    const dezAnos = computePortability(perfil({ experienceTotalMonths: 120 })).ipp;
    const vinteAnos = computePortability(perfil({ experienceTotalMonths: 240 })).ipp;

    const ganhoInicial = dezAnos - doisAnos;
    const ganhoTardio = vinteAnos - dezAnos;
    expect(ganhoInicial).toBeGreaterThan(ganhoTardio);
  });

  it("muito tempo no mesmo vínculo reduz um pouco a portabilidade", () => {
    const recente = computePortability(perfil({ tenureCurrentMonths: 24 })).ipp;
    const longo = computePortability(perfil({ tenureCurrentMonths: 200 })).ipp;
    expect(longo).toBeLessThan(recente);
  });

  it("fica sempre entre 0 e 100", () => {
    const pior = computePortability({
      regime: "MILITAR",
      experienceTotalMonths: 0,
      tenureCurrentMonths: 400,
      segundaAtividadeNivel: "POSSIBILIDADE_TEORICA",
    }).ipp;
    const melhor = computePortability({
      regime: "AUTONOMO",
      experienceTotalMonths: 480,
      tenureCurrentMonths: 1,
      segundaAtividadeNivel: "RENDA_SECUNDARIA_ATIVA",
    }).ipp;

    expect(pior).toBeGreaterThanOrEqual(0);
    expect(melhor).toBeLessThanOrEqual(100);
  });

  it("avisa quando não há dado suficiente, em vez de fingir precisão", () => {
    const vazio = computePortability({
      regime: null,
      experienceTotalMonths: null,
      tenureCurrentMonths: null,
      segundaAtividadeNivel: null,
    });
    expect(vazio.hasEnoughData).toBe(false);
  });

  it("explica os fatores que pesaram", () => {
    const r = computePortability(perfil({ regime: "MILITAR", segundaAtividadeNivel: "RENDA_SECUNDARIA_ATIVA" }));
    expect(r.drivers.length).toBeGreaterThan(0);
    expect(r.drivers.join(" ")).toContain("outra atividade");
  });
});

describe("recoveryCurve", () => {
  it("o mês da interrupção é sempre 0% — nenhuma recolocação acontece nele", () => {
    expect(recoveryCurve(80)[0]).toBe(0);
    expect(recoveryCurve(10)[0]).toBe(0);
  });

  it("IPP alto recupera antes que IPP baixo", () => {
    const alto = recoveryCurve(90);
    const baixo = recoveryCurve(10);
    const mesPlenoAlto = alto.findIndex((v) => v === 1);
    const mesPlenoBaixo = baixo.findIndex((v) => v === 1);
    expect(mesPlenoAlto).toBeLessThan(mesPlenoBaixo);
  });

  it("é monotônica — a renda não regride ao longo da recuperação", () => {
    const curva = recoveryCurve(50);
    for (let i = 1; i < curva.length; i++) {
      expect(curva[i]).toBeGreaterThanOrEqual(curva[i - 1]);
    }
  });

  it("nunca passa de 100% da renda original", () => {
    expect(Math.max(...recoveryCurve(100))).toBe(1);
  });

  it("respeita o horizonte pedido", () => {
    expect(recoveryCurve(50, 6)).toHaveLength(7); // mês 0 até 6
  });
});

describe("segundaAtividadeEhResiliente", () => {
  it("só conta o que tem evidência prática (§21.4)", () => {
    expect(segundaAtividadeEhResiliente("RENDA_SECUNDARIA_ATIVA")).toBe(true);
    expect(segundaAtividadeEhResiliente("RENDA_SECUNDARIA_ADORMECIDA")).toBe(true);
    expect(segundaAtividadeEhResiliente("CAPACIDADE_POTENCIAL")).toBe(false);
    expect(segundaAtividadeEhResiliente("POSSIBILIDADE_TEORICA")).toBe(false);
    expect(segundaAtividadeEhResiliente(null)).toBe(false);
  });
});
