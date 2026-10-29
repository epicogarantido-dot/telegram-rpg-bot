import { obterBanco } from "@/lib/painel";

/**
 * Funil de venda e origem dos links (?origem=). Só a contagem do dia: não guarda IP, cookie nem
 * nada de quem visitou. Com o código de um lead (?l=, link que você mandou pra ele), anota o
 * passo no lead, pro painel mostrar onde ele parou. Só aceita chamada do próprio site.
 */
export async function POST(req: Request) {
  const origemHttp = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (!origemHttp || new URL(origemHttp).host !== host) return new Response(null, { status: 403 });
  } catch {
    return new Response(null, { status: 403 });
  }
  const corpo = (await req.json().catch(() => ({}))) as { origem?: unknown; evento?: unknown; detalhe?: unknown; lead?: unknown };
  const texto = (v: unknown) => (typeof v === "string" ? v : undefined);
  const banco = obterBanco();
  const evento = texto(corpo.evento);
  if (!evento) {
    // Página antiga ainda aberta (antes do funil): só a visita da origem.
    if (texto(corpo.origem)) banco.registrarOrigem(texto(corpo.origem)!, "visita");
  } else if (banco.registrarEvento(evento)) {
    if (evento === "abriu" && texto(corpo.origem)) banco.registrarOrigem(texto(corpo.origem)!, "visita");
    if (texto(corpo.lead)) banco.registrarEventoDoLead(texto(corpo.lead)!, evento, texto(corpo.detalhe));
  }
  return new Response(null, { status: 204 });
}
