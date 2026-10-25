import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

export function hashSenha(senha: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(senha, sal, 64);
  return `scrypt:${sal.toString("hex")}:${hash.toString("hex")}`;
}

export function conferirSenha(senha: string, guardado: string): boolean {
  const [alg, salHex, hashHex] = guardado.split(":");
  if (alg !== "scrypt" || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const obtido = scryptSync(senha, Buffer.from(salHex, "hex"), esperado.length);
  return timingSafeEqual(esperado, obtido);
}

/** Token de sessão: o cookie leva o token; o banco guarda só o hash. */
export function novoToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
