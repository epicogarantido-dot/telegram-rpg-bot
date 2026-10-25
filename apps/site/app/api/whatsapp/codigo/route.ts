import { timingSafeEqual } from "node:crypto";
import { obterMembros } from "../../../../lib/membros";

/**
 * Chamado pelo bot de WhatsApp quando chega uma mensagem com código.
 * Protegido por segredo compartilhado (BOT_SEGREDO) — sem ele, ninguém de
 * fora consegue "confirmar" número nenhum.
 */
export async function POST(req: Request) {
  const segredo = process.env.BOT_SEGREDO ?? "";
  const recebido = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  if (segredo.length < 24 || a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ erro: "não autorizado" }, { status: 401 });
  }
  const corpo = (await req.json().catch(() => ({}))) as { telefone?: unknown; texto?: unknown };
  if (typeof corpo.telefone !== "string" || typeof corpo.texto !== "string" || !/^\d{12,13}$/.test(corpo.telefone)) {
    return Response.json({ erro: "dados inválidos" }, { status: 400 });
  }
  const r = obterMembros().confirmarPeloWhatsapp(corpo.telefone, corpo.texto.slice(0, 500));
  return Response.json(r ?? { ok: false, semCodigo: true });
}
