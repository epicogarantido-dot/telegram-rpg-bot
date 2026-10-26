import Link from "next/link";
import { redirect } from "next/navigation";
import { ErroAgenda } from "@aprenda/agenda";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { chaveDoAparelho, chaveDoEmail } from "@/lib/protecao";

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
  redirect("/app");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <h1>Entrar na agenda</h1>
      {erro && <p className="erro">{erro}</p>}
      <form action={entrar} className="formulario">
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Senha" required autoComplete="current-password" />
        <button type="submit">Entrar</button>
      </form>
      <p>Ainda não tem? <Link href="/app/cadastro">Criar conta</Link></p>
    </>
  );
}
