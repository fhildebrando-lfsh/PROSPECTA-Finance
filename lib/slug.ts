/**
 * Gera slug a partir de um rotulo em portugues, seguindo o algoritmo do
 * ESPECIFICACAO-SISTEMA-FINANCEIRO.md paragrafo 18.3, para que um item
 * criado pelo usuario receba slug pelo mesmo criterio dos seeds.
 */
export function slugify(label: string): string {
  const COMBINING_MARKS = /[̀-ͯ]/g;

  return label
    .replace(/º/g, "o")
    .replace(/ª/g, "a")
    .replace(/&/g, " e ")
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
