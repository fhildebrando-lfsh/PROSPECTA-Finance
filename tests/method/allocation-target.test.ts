import { describe, expect, it } from "vitest";
import {
  MACRO_BLOCOS,
  compareToTargets,
  horizontesDefinidos,
  validateTargets,
  type TargetInput,
} from "@/lib/method/allocation-target";

const atual = { ESSENCIAL: 55, ESTILO_DE_VIDA: 25, OBRIGACAO: 15, POUPANCA: 5 } as const;

function alvo(macroBloco: TargetInput["macroBloco"], pct: number, horizonte: number | null = null): TargetInput {
  return { macroBloco, targetPercent: pct, horizonMonths: horizonte };
}

describe("compareToTargets", () => {
  it("mede a distância entre o que é hoje e a meta", () => {
    const r = compareToTargets({ ...atual }, [alvo("POUPANCA", 20)], null);
    const poupanca = r.find((x) => x.macroBloco === "POUPANCA")!;
    expect(poupanca.actualPercent).toBe(5);
    expect(poupanca.targetPercent).toBe(20);
    expect(poupanca.gapPp).toBe(-15);
  });

  it("gasto acima da meta aparece com folga positiva", () => {
    const r = compareToTargets({ ...atual }, [alvo("ESSENCIAL", 50)], null);
    expect(r.find((x) => x.macroBloco === "ESSENCIAL")!.gapPp).toBe(5);
  });

  /**
   * Zero afirmaria "a meta é não gastar nada aqui" — que para Essencial seria
   * absurdo. Sem meta é ausência de referência, não meta zero.
   */
  it("macrobloco sem meta fica nulo, nunca zero", () => {
    const r = compareToTargets({ ...atual }, [], null);
    for (const linha of r) {
      expect(linha.targetPercent).toBeNull();
      expect(linha.gapPp).toBeNull();
    }
  });

  it("sempre devolve os quatro macroblocos, mesmo sem meta nenhuma", () => {
    expect(compareToTargets({ ...atual }, [], null).map((r) => r.macroBloco)).toEqual(MACRO_BLOCOS);
  });

  /** §11.4 — a trajetória é o ponto: cada horizonte tem a sua meta. */
  it("cada horizonte enxerga só as próprias metas", () => {
    const metas = [alvo("POUPANCA", 10, null), alvo("POUPANCA", 15, 12), alvo("POUPANCA", 20, 24)];

    expect(compareToTargets({ ...atual }, metas, null).find((r) => r.macroBloco === "POUPANCA")!.targetPercent).toBe(10);
    expect(compareToTargets({ ...atual }, metas, 12).find((r) => r.macroBloco === "POUPANCA")!.targetPercent).toBe(15);
    expect(compareToTargets({ ...atual }, metas, 24).find((r) => r.macroBloco === "POUPANCA")!.targetPercent).toBe(20);
  });
});

describe("horizontesDefinidos", () => {
  it("hoje vem primeiro, depois os prazos em ordem", () => {
    const metas = [alvo("POUPANCA", 20, 24), alvo("POUPANCA", 10, null), alvo("POUPANCA", 15, 12)];
    expect(horizontesDefinidos(metas)).toEqual([null, 12, 24]);
  });

  it("sem metas, nenhum horizonte", () => {
    expect(horizontesDefinidos([])).toEqual([]);
  });
});

describe("validateTargets", () => {
  const completo = [
    alvo("ESSENCIAL", 50),
    alvo("ESTILO_DE_VIDA", 20),
    alvo("OBRIGACAO", 10),
    alvo("POUPANCA", 20),
  ];

  it("metas que fecham em 100% passam", () => {
    expect(validateTargets(completo, null).valida).toBe(true);
  });

  /** São fatias da mesma renda — não fechar em 100% é erro, não estilo. */
  it("soma diferente de 100% é erro", () => {
    const r = validateTargets([alvo("ESSENCIAL", 50), alvo("POUPANCA", 20)], null);
    expect(r.valida).toBe(false);
    expect(r.erros.join(" ")).toContain("fechar em 100%");
  });

  /** O documento avisa para não sugerir precisão que o dado não tem. */
  it("tolera arredondamento de meio ponto", () => {
    const quase = [
      alvo("ESSENCIAL", 50.2),
      alvo("ESTILO_DE_VIDA", 20),
      alvo("OBRIGACAO", 10),
      alvo("POUPANCA", 20),
    ];
    expect(validateTargets(quase, null).valida).toBe(true);
  });

  it("percentual fora de 0–100 é erro", () => {
    expect(validateTargets([alvo("ESSENCIAL", 120), alvo("POUPANCA", -20)], null).valida).toBe(false);
  });

  it("macrobloco faltando vira aviso, não erro", () => {
    const tres = [alvo("ESSENCIAL", 60), alvo("ESTILO_DE_VIDA", 20), alvo("OBRIGACAO", 20)];
    const r = validateTargets(tres, null);
    expect(r.valida).toBe(true);
    expect(r.avisos[0]).toContain("sem referência");
  });

  it("horizonte sem meta nenhuma não acusa nada", () => {
    expect(validateTargets(completo, 12).valida).toBe(true);
  });
});
