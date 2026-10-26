import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

export type EstadoBot =
  | { estado: "desligado" }
  | { estado: "conectando" | "pareamento" | "conectado" | "caiu" | "desconectado"; em: string; codigo?: string; motivo?: string };

/**
 * Como está o bot que roda junto com o site (o bot grava em BOT_PASTA/estado.json).
 * "desligado" quando o site sobe sem BOT_NUMERO.
 */
export function estadoDoBot(): EstadoBot {
  const pasta = process.env.BOT_PASTA;
  if (!pasta) return { estado: "desligado" };
  try {
    return JSON.parse(readFileSync(join(pasta, "estado.json"), "utf8")) as EstadoBot;
  } catch {
    return { estado: "conectando", em: new Date().toISOString() };
  }
}
