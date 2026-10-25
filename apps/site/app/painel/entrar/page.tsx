import { redirect } from "next/navigation";
import { gravarSessao, senhaConfere } from "../../../lib/painel";
import { ipDaRequisicao, mensagemMembro, obterMembros } from "../../../lib/membros";

export const metadata = { title: "Entrar", robots: { index: false } };

async function entrar(form: FormData) {
  "use server";
  try {
    // Mesmo limite por IP das telas públicas: sem isso dava pra chutar a senha do admin à vontade.
    obterMembros().checarIp(`admin:${await ipDaRequisicao()}`);
  } catch (e) {
    redirect(`/painel/entrar?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  if (!senhaConfere(String(form.get("senha") ?? ""))) redirect("/painel/entrar?erro=1");
  await gravarSessao();
  redirect("/painel");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <h1>Painel</h1>
      {!process.env.PAINEL_SENHA && <p>Defina PAINEL_SENHA no ambiente para ativar o painel.</p>}
      {erro && <p className="erro">{erro === "1" ? "Senha incorreta." : erro}</p>}
      <form action={entrar} className="busca">
        <input type="password" name="senha" placeholder="Senha" aria-label="Senha" required />
        <button type="submit">Entrar</button>
      </form>
    </>
  );
}
