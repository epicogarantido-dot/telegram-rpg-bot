import { timingSafeEqual } from "node:crypto";

/**
 * Pedidos do bot de WhatsApp ao site vêm com o segredo compartilhado (BOT_SEGREDO)
 * no cabeçalho Authorization. Sem ele, ninguém de fora fala em nome do bot.
 */
export function pedidoDoBot(req: Request): boolean {
  const segredo = process.env.BOT_SEGREDO ?? "";
  const recebido = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  return segredo.length >= 24 && a.length === b.length && timingSafeEqual(a, b);
}
