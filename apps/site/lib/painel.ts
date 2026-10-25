import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BancoProspeccao } from "@aprenda/prospeccao";

const COOKIE = "painel";

function hashSenha(senha: string): string {
  return createHash("sha256").update(`aprenda-livre:${senha}`).digest("hex");
}

export function senhaConfere(tentativa: string): boolean {
  const senha = process.env.PAINEL_SENHA;
  if (!senha) return false;
  const a = Buffer.from(hashSenha(tentativa));
  const b = Buffer.from(hashSenha(senha));
  return timingSafeEqual(a, b);
}

export async function gravarSessao(): Promise<void> {
  (await cookies()).set(COOKIE, hashSenha(process.env.PAINEL_SENHA!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

/** Chame no topo de toda página/ação do painel. Sem PAINEL_SENHA o painel fica desligado. */
export async function exigirLogin(): Promise<void> {
  const senha = process.env.PAINEL_SENHA;
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!senha || valor !== hashSenha(senha)) redirect("/painel/entrar");
}

let banco: BancoProspeccao | undefined;
export function obterBanco(): BancoProspeccao {
  return (banco ??= new BancoProspeccao());
}

export const config = {
  remetente: process.env.REMETENTE ?? "a equipe do Aprenda Livre",
  linkComunidade: process.env.COMUNIDADE_LINK ?? "https://chat.whatsapp.com/SEU-LINK",
  nichoPlural: process.env.NICHO_PLURAL ?? "barbeiros",
  /** Contatos manuais por dia. Passar disso em número novo é pedir banimento. */
  limiteDiario: Number(process.env.LIMITE_DIARIO ?? 20),
};
