import { createHash, timingSafeEqual } from "node:crypto";

/**
 * O mesmo código sobe como um app só (padrão) ou como dois apps na Square:
 * - MODO_SITE=leads: VENDE. Cursos, Revista, /barbeiros, painel de leads, sites de exemplo,
 *   prévia, cadastro e o 1º Pix. Precisa de SAAS_URL (pra onde entrega a barbearia paga).
 * - MODO_SITE=saas: ENTREGA. Só quem já pagou: site do cliente, agenda, painel e renovações.
 *   Não sabe que o de leads existe: nenhum link nem chamada pra lá.
 * Sem SAAS_URL, o de leads volta a ter tudo junto: nada fica fora do ar por falta de config.
 */
export type Modo = "ambos" | "leads" | "saas";

const limpar = (url: string | undefined) => (url ?? "").trim().replace(/\/$/, "");

export function urlSaas(): string {
  return limpar(process.env.SAAS_URL);
}

/** App que só entrega (o SaaS): sem venda, sem exemplo à mostra e sem link pro site de leads. */
export function soEntrega(): boolean {
  return modoSite() === "saas";
}

export function modoSite(): Modo {
  const modo = process.env.MODO_SITE;
  if (modo === "leads" && urlSaas()) return "leads";
  if (modo === "saas") return "saas";
  return "ambos";
}

/** Chave pra conversa servidor a servidor entre os dois apps: deriva da PAINEL_SENHA, a mesma nos dois. */
export function chaveEntreApps(): string | undefined {
  const senha = process.env.PAINEL_SENHA;
  return senha ? createHash("sha256").update(`entre-apps:${senha}`).digest("hex") : undefined;
}

export function chaveConfere(recebida: string | null): boolean {
  const chave = chaveEntreApps();
  if (!chave || !recebida) return false;
  const a = Buffer.from(chave);
  const b = Buffer.from(recebida);
  return a.length === b.length && timingSafeEqual(a, b);
}
