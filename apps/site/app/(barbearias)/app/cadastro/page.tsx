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
  // Veio do "Quero este site" de uma demonstração: a conta assume aquele site em vez de criar outro.
  const demo = campo("demo") || undefined;
  let token: string;
  try {
    // Até 3 contas novas por aparelho por dia: segura quem tenta criar barbearia em massa.
    const chave = `cadastro:ip:${await chaveDoAparelho()}`;
    if (obterAgenda().contarTentativas(chave, 24 * 60) >= 3) throw new ErroAgenda("Muitas contas criadas deste aparelho hoje. Tente amanhã ou fale com a gente.");
    if (!telefone) throw new ErroAgenda("WhatsApp inválido.");
    const dados = { nomeBarbearia: campo("barbearia"), telefone, nome: campo("nome"), email: campo("email"), senha: campo("senha") };
    token = demo ? obterAgenda().assumirDemonstracao(demo, dados).token : obterAgenda().criarConta(dados).token;
    obterAgenda().consumirLimite(chave, Number.MAX_SAFE_INTEGER, 24 * 60, "");
  } catch (e) {
    redirect(`/app/cadastro?${new URLSearchParams({ erro: mensagemDeErro(e), ...(demo ? { demo } : {}) })}`);
  }
  await gravarSessaoAgenda(token);
  redirect("/app?novo=1");
}

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ erro?: string; demo?: string }> }) {
  const { erro, demo: convite } = await searchParams;
  const demo = obterAgenda().demonstracaoPorConvite(convite);
  const plano = planoDoAmbiente();
  return (
    <>
      {demo ? (
        <>
          <h1>Deixe o site da {demo.nome} no seu nome</h1>
          <p>
            Você fica com <a href={`/b/${demo.slug}`} target="_blank" rel="noopener noreferrer">este site</a>, no mesmo endereço e no mesmo estilo.
            Depois é só trocar as fotos de exemplo pelas suas e conferir serviços e horários no painel.
          </p>
        </>
      ) : (
        <>
          <h1>Agenda online para sua barbearia</h1>
          <p>Seu cliente marca pelo link, você vê tudo no celular.</p>
          {convite && <p className="erro">Esse link de demonstração venceu ou já foi usado. Dá pra criar a conta do zero aqui embaixo.</p>}
        </>
      )}
      <p className="suave">
        Contratação de {reais(plano.adesaoCentavos || plano.valorCentavos)} (já inclui o primeiro mês) e {reais(plano.valorCentavos)} por mês, no Pix. Você cria a conta agora e o site é liberado assim que o pagamento é confirmado.
      </p>
      {erro && <p className="erro">{erro}</p>}
      <form action={cadastrar} className="formulario">
        {demo && <input type="hidden" name="demo" value={convite} />}
        <input name="barbearia" placeholder="Nome da barbearia" required maxLength={60} defaultValue={demo?.nome} />
        <input name="telefone" placeholder="WhatsApp da barbearia (com DDD)" required inputMode="tel" />
        <input name="nome" placeholder="Seu nome" required maxLength={60} />
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Senha (mín. 8 caracteres)" required minLength={8} autoComplete="new-password" />
        <button type="submit">{demo ? "Quero este site" : "Criar minha agenda"}</button>
      </form>
      <p>Já tem conta? <Link href="/app/entrar">Entrar</Link></p>
    </>
  );
}
