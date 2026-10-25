import { redirect } from "next/navigation";
import {
  apagarDesafio, gravarSessaoMembro, lerDesafio, mensagemMembro, obterMembros,
} from "../../../lib/membros";

export const metadata = { title: "Nova senha", robots: { index: false } };
export const dynamic = "force-dynamic";

async function trocar(form: FormData) {
  "use server";
  const nova = String(form.get("senha") ?? "");
  if (nova !== String(form.get("confirmacao") ?? "")) redirect("/esqueci/nova-senha?erro=As%20senhas%20n%C3%A3o%20batem.");
  let token: string;
  try {
    token = obterMembros().redefinirSenha(await lerDesafio(), nova);
  } catch (e) {
    redirect(`/esqueci/nova-senha?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  await apagarDesafio();
  await gravarSessaoMembro(token);
  redirect("/minha-area?senha=1");
}

export default async function NovaSenha({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const s = obterMembros().statusDoDesafio(await lerDesafio());
  if (!s || s.finalidade !== "senha" || !s.confirmado) redirect("/esqueci");
  const { erro } = await searchParams;
  return (
    <div className="caixa-auth">
      <h1>Crie a nova senha</h1>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <form action={trocar} className="formulario">
        <label>Nova senha<input name="senha" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
        <label>Repita a senha<input name="confirmacao" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
        <button type="submit">Salvar e entrar</button>
      </form>
      <p className="suave pequeno">Por segurança, todos os outros aparelhos conectados serão desconectados.</p>
    </div>
  );
}
