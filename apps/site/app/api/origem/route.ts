import { obterBanco } from "@/lib/painel";
import { chaveConfere } from "@/lib/modo";

/**
 * Conta uma visita vinda de um link divulgado (?origem=...). Só a contagem do dia por origem:
 * não guarda IP, cookie nem nada de quem visitou. Aceita chamada do próprio site (visita) ou do
 * app do SaaS com a chave entre os apps (cadastro feito lá, contado aqui junto das visitas).
 */
export async function POST(req: Request) {
  const doOutroApp = chaveConfere(req.headers.get("x-chave"));
  if (!doOutroApp) {
    const origemHttp = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    try {
      if (!origemHttp || new URL(origemHttp).host !== host) return new Response(null, { status: 403 });
    } catch {
      return new Response(null, { status: 403 });
    }
  }
  const corpo = (await req.json().catch(() => ({}))) as { origem?: unknown; tipo?: unknown };
  const tipo = doOutroApp && corpo.tipo === "cadastro" ? "cadastro" : "visita";
  if (typeof corpo.origem === "string") obterBanco().registrarOrigem(corpo.origem, tipo);
  return new Response(null, { status: 204 });
}
