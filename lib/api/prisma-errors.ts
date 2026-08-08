/**
 * §20 — "validação de nome duplicado dentro do mesmo escopo". Em vez de
 * deixar o erro cru do Postgres (P2002 unique violation) estourar para o
 * usuário, converte para uma mensagem legível.
 */
export function rethrowFriendly(err: unknown, duplicateMessage: string): never {
  if (isUniqueConstraintError(err)) {
    throw new Error(duplicateMessage);
  }
  throw err;
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "P2002";
}
