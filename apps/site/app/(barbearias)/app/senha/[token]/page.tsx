import Link from "next/link";
import { redirect } from "next/navigation";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";

export const metadata = { title: "Nova senha — Agenda", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Link que o admin manda pelo WhatsApp pro barbeiro que esqueceu a senha. Abrir a página não
 * gasta o link (a prévia do WhatsApp abre links sozinha); só salvar a senha nova gasta.
 */
async function salvar(form: FormData) {
  "use server";
  const token = String(form.get("token") ?? "");
  const nova = String(form.get("senha") ?? "");
  let sessao: string;
  try {
    if (nova !== String(form.get("confirmar") ?? "")) throw new Error("As duas senhas não são iguais.");
    sessao = obterAgenda().trocarSenhaComLink(token, nova);
  } catch (e) {
    const msg = e instanceof Error && e.message === "As duas senhas não são iguais." ? e.message : mensagemDeErro(e);
    redirect(`/app/senha/${token}?erro=${encodeURIComponent(msg)}`);
  }
  await gravarSessaoAgenda(sessao);
  redirect("/app?senha=1");
}

export default async function NovaSenha({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { token } = await params;
  const { erro } = await searchParams;
  const usuario = obterAgenda().usuarioDoLinkDeSenha(token);
  if (!usuario) {
    return (
      <>
        <h1>Link vencido</h1>
        <p>Esse link de troca de senha venceu ou já foi usado. Peça outro pra quem te mandou.</p>
        <p><Link href="/app/entrar">Voltar pra entrar</Link></p>
      </>
    );
  }
  return (
    <>
      <h1>Nova senha</h1>
      <p className="suave">Conta de {usuario.nome} ({usuario.email}). Depois de salvar, você já entra no painel e os outros aparelhos saem.</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <form action={salvar} className="formulario">
        <input type="hidden" name="token" value={token} />
        <label>Nova senha<input name="senha" type="password" required minLength={8} autoComplete="new-password" /></label>
        <label>Repita a nova senha<input name="confirmar" type="password" required minLength={8} autoComplete="new-password" /></label>
        <BotaoEnviar carregando="Salvando…">Salvar e entrar</BotaoEnviar>
      </form>
    </>
  );
}
