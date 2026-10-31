import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BancoAgenda, ErroAgenda, planoDoAmbiente, type Barbearia, type Usuario } from "@aprenda/agenda";
import { soEntrega } from "./modo";

const COOKIE = "sessao_agenda";

let banco: BancoAgenda | undefined;
export function obterAgenda(): BancoAgenda {
  // No SaaS o prazo de 30 dias só avisa o barbeiro: o site e o painel seguem no ar até o admin suspender.
  return (banco ??= new BancoAgenda(undefined, { ...planoDoAmbiente(), vencerBloqueia: !soEntrega() }));
}

export async function gravarSessaoAgenda(token: string): Promise<void> {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function encerrarSessaoAgenda(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) obterAgenda().sair(token);
  jar.delete(COOKIE);
}

/** Usuário logado e a barbearia DELE. Toda página/ação do painel começa por aqui. */
export async function exigirBarbeiro(): Promise<{ usuario: Usuario; barbearia: Barbearia }> {
  const usuario = obterAgenda().usuarioDaSessao((await cookies()).get(COOKIE)?.value);
  if (!usuario) redirect("/app/entrar");
  return { usuario, barbearia: obterAgenda().barbeariaPorId(usuario.barbeariaId)! };
}

/**
 * Como exigirBarbeiro, mas manda pra página da assinatura se a conta está fora do ar: em
 * montagem (ainda não pagou), suspensa pelo admin ou, fora do SaaS, com o prazo vencido. No SaaS
 * o prazo vencido só avisa (faixa no painel).
 */
export async function exigirAcessoAtivo(): Promise<{ usuario: Usuario; barbearia: Barbearia }> {
  const sessao = await exigirBarbeiro();
  if (sessao.barbearia.emMontagem || !obterAgenda().acessoAtivo(sessao.barbearia)) redirect("/app/assinatura");
  return sessao;
}

/**
 * Páginas e ações só do dono (configurações, fotos, site, números, clientes...). Quem entrou com a
 * senha de um profissional da equipe volta pra agenda dele.
 */
export async function exigirDono(): Promise<{ usuario: Usuario; barbearia: Barbearia }> {
  const sessao = await exigirAcessoAtivo();
  if (sessao.usuario.profissionalId) redirect("/app");
  return sessao;
}

/** Profissional da equipe só mexe nos horários dele; o dono, em todos. */
export function podeMexer(usuario: Usuario, a: { profissionalId: number } | undefined): boolean {
  return !!a && (!usuario.profissionalId || a.profissionalId === usuario.profissionalId);
}

export const configPix = {
  chave: process.env.PIX_CHAVE ?? "",
  nome: process.env.PIX_NOME ?? "",
  cidade: process.env.PIX_CIDADE ?? "",
  /** WhatsApp do admin (só dígitos com DDI) pra receber comprovantes. */
  whatsappAdmin: process.env.ADMIN_WHATSAPP ?? "",
};

/** Mensagem de erro amigável pra exibir; erros inesperados não vazam detalhes. */
export function mensagemDeErro(e: unknown): string {
  if (e instanceof ErroAgenda) return e.message;
  console.error(e);
  return "Algo deu errado. Tente de novo.";
}

export function reais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
