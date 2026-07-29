import { describe, expect, it } from "vitest";
import { addMonths, daysBetween, isSameOrBefore, isWithin } from "@/lib/finance/dates";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

describe("addMonths", () => {
  it("preserva o dia em meses de mesmo tamanho", () => {
    expect(iso(addMonths(new Date(Date.UTC(2026, 0, 15)), 1))).toBe("2026-02-15");
  });

  it("trava no último dia do mês de destino quando o dia não existe (31/jan + 1 mês)", () => {
    expect(iso(addMonths(new Date(Date.UTC(2026, 0, 31)), 1))).toBe("2026-02-28");
  });

  it("respeita ano bissexto", () => {
    expect(iso(addMonths(new Date(Date.UTC(2028, 0, 31)), 1))).toBe("2028-02-29");
  });

  it("funciona com múltiplos meses seguidos, como um parcelamento longo", () => {
    let date = new Date(Date.UTC(2026, 0, 31));
    const results = Array.from({ length: 5 }, () => {
      date = addMonths(date, 1);
      return iso(date);
    });
    // regra é sempre "mês seguinte ao anterior", não "mês 1 + N" — por
    // isso 31/jan -> 28/fev -> 28/mar (não 31/mar) é o comportamento correto.
    expect(results).toEqual(["2026-02-28", "2026-03-28", "2026-04-28", "2026-05-28", "2026-06-28"]);
  });

  it("virada de ano", () => {
    expect(iso(addMonths(new Date(Date.UTC(2026, 11, 15)), 2))).toBe("2027-02-15");
  });
});

describe("daysBetween / isSameOrBefore / isWithin", () => {
  it("ignora o horário do Date, só compara a data de calendário", () => {
    const a = new Date(Date.UTC(2026, 0, 1, 23, 59));
    const b = new Date(Date.UTC(2026, 0, 2, 0, 0));
    expect(daysBetween(a, b)).toBe(1);
  });

  it("isSameOrBefore inclui igualdade", () => {
    const a = new Date(Date.UTC(2026, 0, 1));
    expect(isSameOrBefore(a, a)).toBe(true);
  });

  it("isWithin é inclusivo nas duas pontas", () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    const end = new Date(Date.UTC(2026, 0, 31));
    expect(isWithin(start, start, end)).toBe(true);
    expect(isWithin(end, start, end)).toBe(true);
    expect(isWithin(new Date(Date.UTC(2026, 1, 1)), start, end)).toBe(false);
  });
});
