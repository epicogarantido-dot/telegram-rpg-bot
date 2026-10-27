import { headers } from "next/headers";
import { BancoMembros, ErroMembro } from "@aprenda/membros";

/*
 * O site não tem mais login de aluno (os cursos são abertos). Do pacote de membros sobrou
 * o limite de tentativas por IP, que segura chute de senha no /painel/entrar.
 */

let banco: BancoMembros | undefined;
export function obterMembros(): BancoMembros {
  return (banco ??= new BancoMembros());
}

/**
 * IP de quem fez a requisição. Na Square Cloud o tráfego passa pela
 * Cloudflare, que põe o IP real em cf-connecting-ip.
 */
export async function ipDaRequisicao(): Promise<string> {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "desconhecido";
}

export function mensagemMembro(e: unknown): string {
  if (e instanceof ErroMembro) return e.message;
  console.error(e);
  return "Algo deu errado. Tente de novo.";
}

/** Endereço público do site (cartão com QR, links que saem do site). */
export function urlDoSite(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
