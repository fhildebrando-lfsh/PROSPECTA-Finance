/** Algoritmo padrão de validação de CPF (dígitos verificadores) — rejeita
 * sequências repetidas (000.000.000-00 etc.) e dígitos incorretos. */
export function isValidCPF(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (base: string) => {
    let sum = 0;
    let weight = base.length + 1;
    for (const d of base) {
      sum += Number(d) * weight;
      weight--;
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = checkDigit(digits.slice(0, 9));
  const d2 = checkDigit(digits.slice(0, 10));
  return digits[9] === String(d1) && digits[10] === String(d2);
}

/** 000.000.000-00, só pra exibição. */
export function formatCPF(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_m, a, b, c, e) =>
    [a, b && `.${b}`, c && `.${c}`, e && `-${e}`].filter(Boolean).join(""),
  );
}
