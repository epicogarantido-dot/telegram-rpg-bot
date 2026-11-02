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

/** Comunidade de donos de barbearia no WhatsApp (COMUNIDADE_LINK no .env troca). */
const COMUNIDADE_PADRAO = "https://chat.whatsapp.com/D3LDXM4B5DWGdtCTMhJf0D";

export const config = {
  /** Quem assina a 1ª mensagem: "o João, do Site da Barbearia" (REMETENTE no .env). */
  remetente: process.env.REMETENTE ?? "o pessoal do Site da Barbearia777",
  /** Endereço do site, pro presente dos cursos grátis (abertos, sem cadastro). */
  siteUrl: process.env.SITE_URL?.replace(/\/$/, "") || undefined,
  linkComunidade: process.env.COMUNIDADE_LINK ?? COMUNIDADE_PADRAO,
  /** Grupo pra mensagem "Site + grupo": só se o link de verdade estiver no .env. */
  linkGrupo: process.env.COMUNIDADE_LINK && !process.env.COMUNIDADE_LINK.includes("SEU-LINK") ? process.env.COMUNIDADE_LINK : COMUNIDADE_PADRAO,
  nichoPlural: process.env.NICHO_PLURAL ?? "barbeiros",
};
