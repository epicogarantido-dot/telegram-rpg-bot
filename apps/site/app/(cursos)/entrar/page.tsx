import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { LogIn } from "lucide-react";
import {
  destinoSeguro, gravarDesafio, gravarSessaoMembro, guardarVolta, ipDaRequisicao, membroAtual, mensagemMembro, obterMembros, tirarVolta,
} from "@/lib/membros";

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
    await guardarVolta(form.get("voltar"));
  } catch (e) {
    const voltar = destinoSeguro(form.get("voltar"));
    redirect(`/entrar?erro=${encodeURIComponent(mensagemMembro(e))}${voltar ? `&voltar=${encodeURIComponent(voltar)}` : ""}`);
  }
  if (!verificado) redirect("/confirmar");
  redirect((await tirarVolta()) ?? "/minha-area");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string; confirmar?: string; voltar?: string }> }) {
  const { erro, confirmar, voltar } = await searchParams;
  if ((await membroAtual())?.verificado) redirect(destinoSeguro(voltar) ?? "/minha-area");
  return (
    <div className="caixa-auth">
      <h1>Entrar</h1>
      {confirmar && <p className="atribuicao">Falta confirmar seu WhatsApp. Entre de novo pra receber um código.</p>}
      {erro && <p className="erro" role="alert">{erro}</p>}
      <form action={entrar} className="formulario">
        {destinoSeguro(voltar) && <input type="hidden" name="voltar" value={voltar} />}
        <label>WhatsApp (com DDD)
          <input name="telefone" required inputMode="tel" autoComplete="username" placeholder="(11) 98765-4321" />
        </label>
        <label>Senha
          <input name="senha" type="password" required autoComplete="current-password" />
        </label>
        <BotaoEnviar carregando="Entrando…"><LogIn size={18} aria-hidden /> Entrar</BotaoEnviar>
      </form>
      <p><Link href="/esqueci">Esqueci a senha</Link> · <Link href={destinoSeguro(voltar) ? `/cadastro?voltar=${encodeURIComponent(voltar!)}` : "/cadastro"}>Criar conta grátis</Link></p>
    </div>
  );
}
