/**
 * O mesmo código sobe como um app só (padrão) ou como dois apps na Square:
 * - MODO_SITE=leads: MOSTRA E COBRA. Cursos, Revista, /barbeiros, painel de leads, sites de
 *   exemplo, prévia, cadastro e o 1º Pix. SAAS_URL (opcional) manda links velhos do painel pra lá.
 * - MODO_SITE=saas: ENTREGA. Só quem já pagou: site do cliente, agenda, painel e renovações.
 *   O admin cria a conta à mão (/painel/assinaturas) e manda link e senha no WhatsApp.
 *   Não sabe que o de leads existe: nenhum link nem chamada pra lá.
 */
export type Modo = "ambos" | "leads" | "saas";

const limpar = (url: string | undefined) => (url ?? "").trim().replace(/\/$/, "");

export function urlSaas(): string {
  return limpar(process.env.SAAS_URL);
}

/** App que só mostra e cobra (o de leads): conta paga não vira site aqui, quem entrega é o admin no SaaS. */
export function soVenda(): boolean {
  return modoSite() === "leads";
}

/** App que só entrega (o SaaS): sem venda, sem exemplo à mostra e sem link pro site de leads. */
export function soEntrega(): boolean {
  return modoSite() === "saas";
}

export function modoSite(): Modo {
  const modo = process.env.MODO_SITE;
  if (modo === "leads") return "leads";
  if (modo === "saas") return "saas";
  return "ambos";
}
