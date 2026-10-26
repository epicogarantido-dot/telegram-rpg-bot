import { pedidoDoBot } from "@/lib/bot";
import { obterBanco } from "@/lib/painel";

/**
 * Chamado pelo bot quando alguém responde SAIR. O número vem do próprio WhatsApp.
 * Bloqueia no banco de leads do site (o mesmo que o painel usa): o opt-out é permanente
 * e vale mesmo com o bot rodando em outro servidor.
 */
export async function POST(req: Request) {
  if (!pedidoDoBot(req)) return Response.json({ erro: "não autorizado" }, { status: 401 });
  const corpo = (await req.json().catch(() => ({}))) as { telefone?: unknown };
  if (typeof corpo.telefone !== "string" || !/^\d{10,13}$/.test(corpo.telefone)) {
    return Response.json({ erro: "dados inválidos" }, { status: 400 });
  }
  obterBanco().bloquear(corpo.telefone);
  return Response.json({ ok: true });
}
