import Link from "next/link";
import { redirect } from "next/navigation";
import { ErroAgenda } from "@aprenda/agenda";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { chaveDoAparelho, chaveDoEmail } from "@/lib/protecao";
import { contatoResponsavel } from "@/lib/contato";
import { soVenda } from "@/lib/modo";
import { soEntrega } from "@/lib/modo";

export const metadata = { title: "Entrar — Agenda" };

const MUITAS = "Muitas tentativas. Espere 15 minutos e tente de novo.";

/** Senha errada conta: 5 por e-mail e 20 por aparelho a cada 15 min. Acertar zera o do e-mail. */
async function entrar(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "");
  const banco = obterAgenda();
  const chaves = [`login:email:${chaveDoEmail(email)}`, `login:ip:${await chaveDoAparelho()}`];
  let token: string;
  try {
    if (banco.contarTentativas(chaves[0]!, 15) >= 5 || banco.contarTentativas(chaves[1]!, 15) >= 20) throw new ErroAgenda(MUITAS);
    try {
      token = banco.entrar(email, String(form.get("senha") ?? ""));
    } catch (e) {
      for (const c of chaves) banco.consumirLimite(c, Number.MAX_SAFE_INTEGER, 15, "");
      throw e;
    }
    banco.limparTentativas(chaves[0]!);
  } catch (e) {
    redirect(`/app/entrar?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  await gravarSessaoAgenda(token);
  // No site de leads a conta só acompanha o pedido; o painel de verdade fica no SaaS.
  redirect(soVenda() ? "/app/assinatura" : "/app");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const contato = contatoResponsavel();
  return (
    <>
      <h1>Entrar na agenda</h1>
      {erro && <p className="erro">{erro}</p>}
      <form action={entrar} className="formulario">
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Senha" required autoComplete="current-password" />
        <button type="submit">Entrar</button>
      </form>
      <p>
        Esqueceu a senha?{" "}
        {contato
          ? <a href={`${contato.link}?text=${encodeURIComponent("Oi! Esqueci a senha do painel da minha barbearia.")}`} target="_blank" rel="noopener noreferrer">Fale com a gente no WhatsApp</a>
          : "Fale com quem te vendeu o site"}
        {" "}e mandamos um link pra criar outra.
      </p>
      {!soEntrega() && <p>Ainda não tem? <Link href="/app/cadastro">Criar conta</Link></p>}
    </>
  );
}
