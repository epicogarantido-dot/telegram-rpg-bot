/**
 * O mesmo código sobe como um app só (padrão) ou como dois apps na Square:
 * - MODO_SITE=leads: MOSTRA E COBRA. Cursos, Revista, /barbeiros, painel de leads, sites de
 *   exemplo, cadastro e o Pix da assinatura (o admin confirma e vê quem está atrasado).
 * - MODO_SITE=saas: ENTREGA. Só quem já pagou: site do cliente, agenda e painel. O admin cria a
 *   conta à mão (/painel/assinaturas) com 30 dias e manda link e senha no WhatsApp; vencer só avisa.
 * Os dois não se ligam: nenhum link nem chamada de um pro outro.
 */
export type Modo = "ambos" | "leads" | "saas";

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
