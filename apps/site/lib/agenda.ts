import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BancoAgenda, ErroAgenda, type Barbearia, type Usuario } from "@aprenda/agenda";

const COOKIE = "sessao_agenda";

let banco: BancoAgenda | undefined;
export function obterAgenda(): BancoAgenda {
  return (banco ??= new BancoAgenda());
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

/** Mensagem de erro amigável pra exibir; erros inesperados não vazam detalhes. */
export function mensagemDeErro(e: unknown): string {
  if (e instanceof ErroAgenda) return e.message;
  console.error(e);
  return "Algo deu errado. Tente de novo.";
}

export function reais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
