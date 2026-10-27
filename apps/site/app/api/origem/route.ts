import { obterBanco } from "@/lib/painel";

/**
 * Conta uma visita vinda de um link divulgado (?origem=...). Só a contagem do dia por origem:
 * não guarda IP, cookie nem nada de quem visitou. Só aceita chamada do próprio site.
 */
export async function POST(req: Request) {
  const origemHttp = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (!origemHttp || new URL(origemHttp).host !== host) return new Response(null, { status: 403 });
  } catch {
    return new Response(null, { status: 403 });
  }
  const corpo = (await req.json().catch(() => ({}))) as { origem?: unknown };
  if (typeof corpo.origem === "string") obterBanco().registrarOrigem(corpo.origem, "visita");
  return new Response(null, { status: 204 });
}
