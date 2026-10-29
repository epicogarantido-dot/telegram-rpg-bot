import { existsSync } from "node:fs";
import { join } from "node:path";

/** WhatsApp do responsável (ADMIN_WHATSAPP) e o nome dele (RESPONSAVEL_NOME), pra venda, privacidade e termos. */
export function contatoResponsavel(): { link: string; texto: string; nome?: string } | undefined {
  const numero = process.env.ADMIN_WHATSAPP?.replace(/\D/g, "");
  if (!numero || numero.length < 12) return undefined;
  const local = numero.slice(2);
  const texto = `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}`;
  const nome = process.env.RESPONSAVEL_NOME?.trim().slice(0, 60) || undefined;
  return { link: `https://wa.me/${numero}`, texto, nome };
}

/** Foto de quem monta os sites, se existir em public/responsavel.webp (o app roda da raiz ou de apps/site). */
export function fotoDoResponsavel(): string | undefined {
  const achou = [join(process.cwd(), "public"), join(process.cwd(), "apps/site/public")].some((d) => existsSync(join(d, "responsavel.webp")));
  return achou ? "/responsavel.webp" : undefined;
}
