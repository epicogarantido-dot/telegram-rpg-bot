import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoEnviar } from "../../componentes/BotaoEnviar";
import { gravarDesafio, ipDaRequisicao, mensagemMembro, obterMembros } from "../../lib/membros";

export const metadata = { title: "Esqueci a senha" };

async function pedir(form: FormData) {
  "use server";
  try {
    obterMembros().checarIp(await ipDaRequisicao());
    await gravarDesafio(obterMembros().novoCodigo(String(form.get("telefone") ?? ""), "senha").desafio);
  } catch (e) {
    redirect(`/esqueci?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  redirect("/confirmar");
}

export default async function Esqueci({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="caixa-auth">
      <h1>Esqueci a senha</h1>
      <p className="suave">Digite seu WhatsApp. Você vai confirmar que o número é seu mandando um código pro nosso WhatsApp, e então cria uma senha nova.</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <form action={pedir} className="formulario">
        <label>WhatsApp (com DDD)
          <input name="telefone" required inputMode="tel" autoComplete="username" placeholder="(11) 98765-4321" />
        </label>
        <BotaoEnviar carregando="Gerando código…">Continuar</BotaoEnviar>
      </form>
      <p><Link href="/entrar">Voltar</Link></p>
    </div>
  );
}
