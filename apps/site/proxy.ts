import { NextResponse, type NextRequest } from "next/server";

/**
 * Leads e SaaS em apps separados (MODO_SITE, ver lib/modo.ts): quem pede uma página do outro
 * lado é mandado pro endereço certo, com o mesmo caminho e a mesma busca. Sem MODO_SITE (ou sem
 * a URL do outro lado), não faz nada e o app serve tudo, como antes.
 */
const DO_SAAS = [
  /^\/app(\/|$)/, /^\/b\//, /^\/agenda\//, /^\/f\//, /^\/montar\/?$/, /^\/exemplo\//,
  /^\/painel\/(assinaturas|backup|comprovante)(\/|$)/, /^\/api\/demonstracao$/,
];
const DO_LEADS = [
  /^\/$/, /^\/cursos(\/[^.]*)?$/, /^\/revista(\/[a-z0-9-]+)?\/?$/, /^\/barbeiros(\/obrigado)?\/?$/, /^\/licencas\/?$/,
  /^\/painel\/?$/, /^\/painel\/(buscar|cartao|divulgacao)(\/|$)/,
];

const limpar = (url: string | undefined) => (url ?? "").trim().replace(/\/$/, "");

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const modo = process.env.MODO_SITE;
  if (modo === "leads") {
    const saas = limpar(process.env.SAAS_URL);
    if (saas && DO_SAAS.some((r) => r.test(pathname))) return NextResponse.redirect(`${saas}${pathname}${search}`, 307);
  } else if (modo === "saas" && DO_LEADS.some((r) => r.test(pathname))) {
    const leads = limpar(process.env.LEADS_URL);
    // A porta de entrada do SaaS é a montagem do site; o resto vai pro site de leads.
    if (pathname === "/" || !leads) return NextResponse.redirect(new URL(`/montar${search}`, req.url), 307);
    return NextResponse.redirect(`${leads}${pathname}${search}`, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/versao|favicon|robots|sitemap|manifest|painel-sw).*)"],
};
