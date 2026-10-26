import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BancoMembros, ErroMembro, SESSAO_DIAS, type Membro } from "@aprenda/membros";

const COOKIE_SESSAO = "sessao_aluno";
const COOKIE_VOLTAR = "voltar_licao";

let banco: BancoMembros | undefined;
export function obterMembros(): BancoMembros {
  return (banco ??= new BancoMembros());
}

const seguro = () => process.env.NODE_ENV === "production";

export async function gravarSessaoMembro(token: string): Promise<void> {
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true, sameSite: "lax", secure: seguro(), maxAge: 60 * 60 * 24 * SESSAO_DIAS, path: "/",
  });
}

/**
 * Pra onde mandar o aluno depois de entrar pelo link do WhatsApp. Só aceita caminho de
 * curso do próprio site: nada de redirecionar pra fora com ?voltar=https://...
 */
export function destinoSeguro(valor: unknown): string | undefined {
  const s = String(valor ?? "");
  return /^\/cursos\/[a-z0-9-]+(\/[a-z0-9-]+){0,2}$/.test(s) ? s : undefined;
}

/** Guarda a lição que o aluno queria ler; sobrevive à ida e volta pelo WhatsApp. */
export async function guardarVolta(valor: unknown): Promise<void> {
  const destino = destinoSeguro(valor);
  if (destino) (await cookies()).set(COOKIE_VOLTAR, destino, {
    httpOnly: true, sameSite: "lax", secure: seguro(), maxAge: 60 * 60, path: "/",
  });
}

/** Lê e apaga o destino guardado. */
export async function tirarVolta(): Promise<string | undefined> {
  const jar = await cookies();
  const destino = destinoSeguro(jar.get(COOKIE_VOLTAR)?.value);
  jar.delete(COOKIE_VOLTAR);
  return destino;
}

export async function membroAtual(): Promise<Membro | undefined> {
  return obterMembros().membroDaSessao((await cookies()).get(COOKIE_SESSAO)?.value);
}

/** Página só pra aluno logado E com número confirmado. */
export async function exigirMembro(): Promise<Membro> {
  const m = await membroAtual();
  if (!m?.verificado) redirect("/entrar");
  return m;
}

export async function sairMembro(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) obterMembros().sair(token);
  jar.delete(COOKIE_SESSAO);
}

/**
 * IP de quem fez a requisição. Na Square Cloud o tráfego passa pela
 * Cloudflare, que põe o IP real em cf-connecting-ip.
 */
export async function ipDaRequisicao(): Promise<string> {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "desconhecido";
}

/** Bloqueia POST vindo de outro site (CSRF) nas rotas de API próprias. */
export function mesmaOrigem(req: Request): boolean {
  const origem = req.headers.get("origin");
  if (!origem) return false;
  try {
    return new URL(origem).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export function mensagemMembro(e: unknown): string {
  if (e instanceof ErroMembro) return e.message;
  console.error(e);
  return "Algo deu errado. Tente de novo.";
}

/** Número do bot (só dígitos com DDI): a pessoa escreve pra ele e recebe o link de entrada. */
export const whatsappBot = process.env.BOT_WHATSAPP ?? "";

/** Texto que já vem escrito quando a pessoa toca em "Entrar pelo WhatsApp". */
export const TEXTO_ENTRAR = "Quero entrar no Aprenda Livre";

export function linkWhatsappEntrar(): string | undefined {
  return whatsappBot ? `https://wa.me/${whatsappBot}?text=${encodeURIComponent(TEXTO_ENTRAR)}` : undefined;
}

/** Endereço público do site, pra montar o link que o bot manda. */
export function urlDoSite(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
