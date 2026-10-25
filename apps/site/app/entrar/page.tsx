import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import {
  gravarDesafio, gravarSessaoMembro, ipDaRequisicao, membroAtual, mensagemMembro, obterMembros,
} from "../../lib/membros";

export const metadata = { title: "Entrar" };

async function entrar(form: FormData) {
  "use server";
  const banco = obterMembros();
  const telefone = String(form.get("telefone") ?? "");
  let verificado: boolean;
  try {
    banco.checarIp(await ipDaRequisicao());
    const r = banco.entrar(telefone, String(form.get("senha") ?? ""));
    verificado = r.verificado;
    await gravarSessaoMembro(r.token);
    if (!verificado) await gravarDesafio(banco.novoCodigo(telefone, "cadastro").desafio);
  } catch (e) {
    redirect(`/entrar?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  redirect(verificado ? "/minha-area" : "/confirmar");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string; confirmar?: string }> }) {
  if ((await membroAtual())?.verificado) redirect("/minha-area");
  const { erro, confirmar } = await searchParams;
  return (
    <div className="caixa-auth">
      <h1>Entrar</h1>
      {confirmar && <p className="atribuicao">Falta confirmar seu WhatsApp. Entre de novo pra receber um código.</p>}
      {erro && <p className="erro" role="alert">{erro}</p>}
      <form action={entrar} className="formulario">
        <label>WhatsApp (com DDD)
          <input name="telefone" required inputMode="tel" autoComplete="username" placeholder="(11) 98765-4321" />
        </label>
        <label>Senha
          <input name="senha" type="password" required autoComplete="current-password" />
        </label>
        <button type="submit"><LogIn size={18} aria-hidden /> Entrar</button>
      </form>
      <p><Link href="/esqueci">Esqueci a senha</Link> · <Link href="/cadastro">Criar conta grátis</Link></p>
    </div>
  );
}
