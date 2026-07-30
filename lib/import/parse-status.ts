import { slugify } from "@/lib/slug";

/** seeds/seed_situacoes.csv — label_pt (normalizado) -> código. */
const LABEL_TO_CODE: Record<string, string> = {
  a_pagar: "A_PAGAR",
  pago: "PAGO",
  a_receber: "A_RECEBER",
  recebido: "RECEBIDO",
  isento: "ISENTO",
  aquisicao: "AQUISICAO",
  atualizacao: "ATUALIZACAO",
  estimativa: "ESTIMATIVA",
};

export function parseStatusLabel(raw: string): string {
  const code = LABEL_TO_CODE[slugify(raw)];
  if (!code) throw new Error(`situação desconhecida: "${raw}"`);
  return code;
}
