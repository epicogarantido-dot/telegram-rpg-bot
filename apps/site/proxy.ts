import { NextResponse, type NextRequest } from "next/server";

/**
 * Leads e SaaS em apps separados (MODO_SITE, ver lib/modo.ts). Um não manda ninguém pro outro.
 *
 * O de leads MOSTRA E COBRA: cursos, Revista, /barbeiros, exemplos, cadastro e Pix da assinatura.
 * O painel do barbeiro não existe lá: quem pede uma página dele (/app, fora cadastro, pagamento,
 * entrar e senha) vai pra página da assinatura.
 *
 * O SaaS ENTREGA: site do cliente, agenda e painel. O que é de venda (início, cursos, Revista,
 * exemplos, cadastro, painel de leads) cai na entrada do painel do barbeiro.
 */
const PAINEL_DO_BARBEIRO = /^\/app(\/(?!entrar|assinatura|senha|cadastro)[^]*)?$/;
const DE_VENDA = [
  /^\/$/, /^\/cursos(\/[^.]*)?$/, /^\/revista(\/[a-z0-9-]+)?\/?$/, /^\/barbeiros(\/obrigado)?\/?$/, /^\/licencas\/?$/,
  /^\/painel\/(buscar|cartao|divulgacao)(\/|$)/, /^\/montar\/?$/, /^\/app\/cadastro\/?$/, /^\/exemplo\//,
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const modo = process.env.MODO_SITE;
  if (modo === "leads") {
    if (PAINEL_DO_BARBEIRO.test(pathname)) return NextResponse.redirect(new URL("/app/assinatura", req.url), 307);
  } else if (modo === "saas") {
    // O admin cai no /painel depois de entrar: aqui o painel dele é o das assinaturas.
    if (/^\/painel\/?$/.test(pathname)) return NextResponse.redirect(new URL("/painel/assinaturas", req.url), 307);
    if (DE_VENDA.some((r) => r.test(pathname))) return NextResponse.redirect(new URL("/app/entrar", req.url), 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/versao|favicon|robots|sitemap|manifest|painel-sw).*)"],
};
