import Link from "next/link";
import { redirect } from "next/navigation";
import { ErroAgenda } from "@aprenda/agenda";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { chaveDoAparelho, chaveDoEmail } from "@/lib/protecao";
import { contatoResponsavel } from "@/lib/contato";
import { senhaConfere } from "@/lib/painel";
import { barbeariaDoApp, prepararBarbeariaDoApp } from "@/lib/barbearia-do-app";
import { soEntrega, soVenda } from "@/lib/modo";

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

/**
 * SaaS (um app por barbeiro): o admin entra só com a senha do .env (PAINEL_SENHA), sem e-mail.
 * Errar conta 10 por aparelho e 100 no total a cada 15 min (a senha gerada é longa: o limite só
 * segura robô).
 */
async function entrarComSenha(form: FormData) {
  "use server";
  const banco = obterAgenda();
  const chaves = [`login:ip:${await chaveDoAparelho()}`, "login:admin"];
  let token: string;
  try {
    if (banco.contarTentativas(chaves[0]!, 15) >= 10 || banco.contarTentativas(chaves[1]!, 15) >= 100) throw new ErroAgenda(MUITAS);
    if (!senhaConfere(String(form.get("senha") ?? ""))) {
      for (const c of chaves) banco.consumirLimite(c, Number.MAX_SAFE_INTEGER, 15, "");
      throw new ErroAgenda("Senha incorreta.");
    }
    const b = barbeariaDoApp() ?? await prepararBarbeariaDoApp();
    token = banco.sessaoDoDono(b.id);
  } catch (e) {
    redirect(`/app/entrar?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  await gravarSessaoAgenda(token);
  redirect("/app");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const contato = contatoResponsavel();
  const esqueceu = (
    <p>
      Esqueceu a senha?{" "}
      {contato
        ? <a href={`${contato.link}?text=${encodeURIComponent("Oi! Esqueci a senha do painel da minha barbearia.")}`} target="_blank" rel="noopener noreferrer">Fale com a gente no WhatsApp</a>
        : "Fale com quem te vendeu o site"}
      {soEntrega() ? "." : <>{" "}e mandamos um link pra criar outra.</>}
    </p>
  );
  if (soEntrega()) {
    return (
      <>
        <h1>Painel da barbearia</h1>
        {erro && <p className="erro">{erro}</p>}
        <form action={entrarComSenha} className="formulario">
          <input name="senha" type="password" placeholder="Senha" required autoComplete="current-password" aria-label="Senha" />
          <button type="submit">Entrar</button>
        </form>
        {esqueceu}
      </>
    );
  }
  return (
    <>
      <h1>Entrar na agenda</h1>
      {erro && <p className="erro">{erro}</p>}
      <form action={entrar} className="formulario">
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Senha" required autoComplete="current-password" />
        <button type="submit">Entrar</button>
      </form>
      {esqueceu}
      <p>Ainda não fez o pedido? <Link href="/app/cadastro">Quero o meu site</Link></p>
    </>
  );
}
