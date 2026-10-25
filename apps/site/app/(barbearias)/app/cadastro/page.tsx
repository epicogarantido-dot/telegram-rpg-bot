import Link from "next/link";
import { redirect } from "next/navigation";
import { ErroAgenda, planoDoAmbiente } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { chaveDoAparelho } from "@/lib/protecao";

export const metadata = { title: "Criar conta — Agenda" };

async function cadastrar(form: FormData) {
  "use server";
  const campo = (n: string) => String(form.get(n) ?? "");
  const telefone = normalizarTelefone(campo("telefone"));
  let token: string;
  try {
    // Até 3 contas novas por aparelho por dia: segura quem tenta criar barbearia em massa.
    const chave = `cadastro:ip:${await chaveDoAparelho()}`;
    if (obterAgenda().contarTentativas(chave, 24 * 60) >= 3) throw new ErroAgenda("Muitas contas criadas deste aparelho hoje. Tente amanhã ou fale com a gente.");
    if (!telefone) throw new ErroAgenda("WhatsApp inválido.");
    token = obterAgenda().criarConta({
      nomeBarbearia: campo("barbearia"), telefone, nome: campo("nome"), email: campo("email"), senha: campo("senha"),
    }).token;
    obterAgenda().consumirLimite(chave, Number.MAX_SAFE_INTEGER, 24 * 60, "");
  } catch (e) {
    redirect(`/app/cadastro?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  await gravarSessaoAgenda(token);
  redirect("/app?novo=1");
}

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const plano = planoDoAmbiente();
  return (
    <>
      <h1>Agenda online para sua barbearia</h1>
      <p>Seu cliente marca pelo link, você vê tudo no celular.</p>
      <p className="suave">
        {plano.testeDias > 0 && `Teste grátis por ${plano.testeDias} dias. `}Pra continuar: contratação de {reais(plano.adesaoCentavos || plano.valorCentavos)} (já inclui o primeiro mês) e {reais(plano.valorCentavos)} por mês, no Pix.
      </p>
      {erro && <p className="erro">{erro}</p>}
      <form action={cadastrar} className="formulario">
        <input name="barbearia" placeholder="Nome da barbearia" required maxLength={60} />
        <input name="telefone" placeholder="WhatsApp da barbearia (com DDD)" required inputMode="tel" />
        <input name="nome" placeholder="Seu nome" required maxLength={60} />
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Senha (mín. 8 caracteres)" required minLength={8} autoComplete="new-password" />
        <button type="submit">Criar minha agenda</button>
      </form>
      <p>Já tem conta? <Link href="/app/entrar">Entrar</Link></p>
    </>
  );
}
