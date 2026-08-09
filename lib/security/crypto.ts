import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * `TOKEN_ENCRYPTION_KEY` é um segredo de tamanho livre (não precisa já vir
 * como 32 bytes) — passa por scrypt com salt fixo pra virar sempre uma chave
 * de 32 bytes válida pra AES-256. Salt fixo é aceitável aqui porque a "senha"
 * já é um segredo de alta entropia gerado uma vez (não uma senha de usuário
 * sujeita a força bruta por dicionário).
 */
function deriveKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY não configurada.");
  return scryptSync(secret, "prospecta-finance-token-encryption", 32);
}

/** Criptografa um texto em repouso (ex.: refresh token do Google). Formato: iv:tag:cipher, tudo em base64. */
export function encrypt(plainText: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

/** Desfaz `encrypt`. Lança se o texto foi adulterado (falha de autenticação do GCM) ou o formato é inválido. */
export function decrypt(cipherText: string): string {
  const [ivB64, authTagB64, dataB64] = cipherText.split(":");
  if (!ivB64 || !authTagB64 || !dataB64) throw new Error("Texto cifrado em formato inválido.");

  const key = deriveKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
