import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, MessageCircle, Sparkles } from "lucide-react";
import { gravarDesafio, ipDaRequisicao, membroAtual, mensagemMembro, obterMembros } from "../../lib/membros";

export const metadata = { title: "Criar conta grátis" };

async function cadastrar(form: FormData) {
  "use server";
  const banco = obterMembros();
  try {
    banco.checarIp(await ipDaRequisicao());
    banco.cadastrar({
      nome: String(form.get("nome") ?? ""),
      telefone: String(form.get("telefone") ?? ""),
      senha: String(form.get("senha") ?? ""),
      consentiu: form.get("consentimento") === "sim",
    });
    const { desafio } = banco.novoCodigo(String(form.get("telefone") ?? ""), "cadastro");
    await gravarDesafio(desafio);
  } catch (e) {
    redirect(`/cadastro?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  redirect("/confirmar");
}

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if ((await membroAtual())?.verificado) redirect("/minha-area");
  const { erro } = await searchParams;
  return (
    <div className="caixa-auth">
      <span className="selo"><Sparkles className="icone" aria-hidden /> Grátis pra sempre</span>
      <h1>Crie sua conta</h1>
      <p className="suave">Salve seu progresso nos cursos. Seu login é o seu número de WhatsApp.</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <form action={cadastrar} className="formulario">
        <label>Seu nome<input name="nome" required minLength={2} maxLength={80} autoComplete="name" /></label>
        <label>WhatsApp (com DDD)
          <input name="telefone" required inputMode="tel" autoComplete="tel-national" placeholder="(11) 98765-4321" />
        </label>
        <label>Crie uma senha
          <input name="senha" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
          <small>Pelo menos 8 caracteres. Evite datas e sequências.</small>
        </label>
        <label className="check">
          <input type="checkbox" name="consentimento" value="sim" required />
          <span>Concordo em receber mensagens sobre cursos e novidades pelo WhatsApp. Posso sair quando quiser respondendo SAIR.</span>
        </label>
        <button type="submit"><MessageCircle size={18} aria-hidden /> Continuar</button>
      </form>
      <p className="suave pequeno"><Lock className="icone" aria-hidden /> No próximo passo você confirma o número mandando um código pro nosso WhatsApp. Sem SMS, sem custo.</p>
      <p>Já tem conta? <Link href="/entrar">Entrar</Link></p>
    </div>
  );
}
