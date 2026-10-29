import { NextResponse, type NextRequest } from "next/server";

/**
 * Leads e SaaS em apps separados (MODO_SITE, ver lib/modo.ts). Um não manda ninguém pro outro.
 *
 * O de leads MOSTRA E COBRA: cursos, Revista, /barbeiros, exemplos, cadastro e Pix da assinatura.
 * O painel do barbeiro não existe lá: quem pede uma página dele (/app, fora cadastro, pagamento,
 * entrar e senha) vai pra página da assinatura.
 *
 * O SaaS ENTREGA e é de UM barbeiro (um app por barbearia): o endereço principal abre o site dela,
 * /admin o painel dele. O que é de venda (cursos, Revista, exemplos, cadastro, painéis do dono)
 * volta pro site.
 */
const PAINEL_DO_BARBEIRO = /^\/app(\/(?!entrar|assinatura|senha|cadastro)[^]*)?$/;
const DE_VENDA = [
  /^\/cursos(\/[^.]*)?$/, /^\/revista(\/[a-z0-9-]+)?\/?$/, /^\/barbeiros(\/obrigado)?\/?$/, /^\/licencas\/?$/,
  /^\/montar\/?$/, /^\/app\/cadastro\/?$/, /^\/exemplo\//,
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const modo = process.env.MODO_SITE;
  if (modo === "leads") {
    if (PAINEL_DO_BARBEIRO.test(pathname)) return NextResponse.redirect(new URL("/app/assinatura", req.url), 307);
  } else if (modo === "saas") {
    if (pathname === "/") return NextResponse.rewrite(new URL("/inicio", req.url));
    // Link curto pro WhatsApp e pra bio: endereço do app + /agendar.
    if (/^\/agendar\/?$/.test(pathname)) return NextResponse.rewrite(new URL("/inicio/agendar", req.url));
    if (/^\/admin\/?$/.test(pathname)) return NextResponse.redirect(new URL("/app", req.url), 307);
    // Sem painel do dono no app do barbeiro: o admin é o /admin dele (os ícones em /painel/*.png seguem).
    if (/^\/painel(\/[^.]*)?$/.test(pathname)) return NextResponse.redirect(new URL("/admin", req.url), 307);
    if (DE_VENDA.some((r) => r.test(pathname))) return NextResponse.redirect(new URL("/", req.url), 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/versao|favicon|robots|sitemap|manifest|painel-sw).*)"],
};
