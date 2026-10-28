import { NextResponse, type NextRequest } from "next/server";

/**
 * Leads e SaaS em apps separados (MODO_SITE, ver lib/modo.ts).
 *
 * O de leads VENDE: cursos, Revista, /barbeiros, exemplos, prévia (/montar), cadastro e o 1º Pix.
 * Quem pede ali uma página do painel (/app, fora cadastro, pagamento, entrar e senha) ou da agenda
 * assinada é mandado pro SaaS. Sem SAAS_URL, serve tudo, como um app só.
 *
 * O SaaS ENTREGA e não conhece o de leads: o que é de venda (início, cursos, Revista, exemplos,
 * montar, cadastro, painel de leads) cai na entrada do painel do barbeiro, aqui mesmo.
 */
const DO_SAAS = [
  /^\/app(\/(?!entrar|assinatura|senha|cadastro)[^]*)?$/, /^\/agenda\//,
];
const DE_VENDA = [
  /^\/$/, /^\/cursos(\/[^.]*)?$/, /^\/revista(\/[a-z0-9-]+)?\/?$/, /^\/barbeiros(\/obrigado)?\/?$/, /^\/licencas\/?$/,
  /^\/painel\/(buscar|cartao|divulgacao)(\/|$)/, /^\/montar\/?$/, /^\/app\/cadastro\/?$/, /^\/exemplo\//,
];

const limpar = (url: string | undefined) => (url ?? "").trim().replace(/\/$/, "");

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const modo = process.env.MODO_SITE;
  if (modo === "leads") {
    const saas = limpar(process.env.SAAS_URL);
    if (saas && DO_SAAS.some((r) => r.test(pathname))) return NextResponse.redirect(`${saas}${pathname}${search}`, 307);
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
