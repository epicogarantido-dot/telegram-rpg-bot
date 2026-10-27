import Link from "next/link";
import { redirect } from "next/navigation";
import { ErroAgenda, planoDoAmbiente } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { chaveDoAparelho } from "@/lib/protecao";
import { obterBanco } from "@/lib/painel";
import { CampoOrigem } from "@/componentes/ContarOrigem";
import { porFotosPadrao } from "@/lib/exemplos";
import { contarCadastro } from "@/lib/modo";

export const metadata = { title: "Criar conta — Agenda" };

async function cadastrar(form: FormData) {
  "use server";
  const campo = (n: string) => String(form.get(n) ?? "");
  const telefone = normalizarTelefone(campo("telefone"));
  // Veio do "Quero este site" de uma demonstração: a conta assume aquele site em vez de criar outro.
  const demo = campo("demo") || undefined;
  let token: string;
  let montagem = false;
  try {
    // Até 3 contas novas por aparelho por dia: segura quem tenta criar barbearia em massa.
    const chave = `cadastro:ip:${await chaveDoAparelho()}`;
    if (obterAgenda().contarTentativas(chave, 24 * 60) >= 3) throw new ErroAgenda("Muitas contas criadas deste aparelho hoje. Tente amanhã ou fale com a gente.");
    if (!telefone) throw new ErroAgenda("WhatsApp inválido.");
    const dados = { nomeBarbearia: campo("barbearia"), telefone, nome: campo("nome"), email: campo("email"), senha: campo("senha") };
    const banco = obterAgenda();
    const conta = demo ? banco.assumirDemonstracao(demo, dados) : banco.criarConta(dados);
    token = conta.token;
    montagem = conta.barbearia.emMontagem;
    // Conta do zero já nasce com as fotos padrão (do acervo); a da prévia já tem as dela.
    if (!demo) porFotosPadrao(conta.barbearia.id, conta.barbearia.tema);
    obterAgenda().consumirLimite(chave, Number.MAX_SAFE_INTEGER, 24 * 60, "");
    // De onde veio quem virou cliente (link do grupo, cartão, convite, demonstração): só a contagem.
    await contarCadastro(campo("origem") || (demo ? "demonstracao" : "direto"), (o) => obterBanco().registrarOrigem(o, "cadastro"));
  } catch (e) {
    redirect(`/app/cadastro?${new URLSearchParams({ erro: mensagemDeErro(e), ...(demo ? { demo } : {}) })}`);
  }
  await gravarSessaoAgenda(token);
  // Sem teste grátis, o próximo passo é o pagamento; a equipe entra em contato pra pôr no ar.
  redirect(montagem ? "/app/assinatura?bemvindo=1" : "/app?novo=1");
}

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ erro?: string; demo?: string }> }) {
  const { erro, demo: convite } = await searchParams;
  const demo = obterAgenda().demonstracaoPorConvite(convite);
  const plano = planoDoAmbiente();
  return (
    <>
      {demo ? (
        <>
          <ol className="passos-compra" aria-label="Etapas">
            <li className="feito">Seu site</li>
            <li aria-current="step">Cadastro</li>
            <li>Pagamento</li>
          </ol>
          <h1>Falta pouco pro site da {demo.nome} ser seu</h1>
          <p>
            Você fica com <a href={`/b/${demo.slug}`} target="_blank" rel="noopener noreferrer">este site</a>, no mesmo endereço e no mesmo estilo.
            Crie seu acesso; no próximo passo é o pagamento pelo Pix, e a nossa equipe entra em contato com você pelo WhatsApp pra montar o site com as suas fotos e preços e colocar no ar.
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
        {plano.testeDias > 0
          ? <>Grátis por {plano.testeDias} dias. Depois, </>
          : <>Valor: </>}
        contratação de {reais(plano.adesaoCentavos || plano.valorCentavos)} (já inclui o primeiro mês) e {reais(plano.valorCentavos)} por mês, no Pix.
      </p>
      {erro && <p className="erro">{erro}</p>}
      <form action={cadastrar} className="formulario">
        {demo && <input type="hidden" name="demo" value={convite} />}
        <input name="barbearia" placeholder="Nome da barbearia" required maxLength={60} defaultValue={demo?.nome} />
        <input name="telefone" placeholder="WhatsApp da barbearia (com DDD)" required inputMode="tel" />
        <input name="nome" placeholder="Seu nome" required maxLength={60} />
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Senha (mín. 8 caracteres)" required minLength={8} autoComplete="new-password" />
        <CampoOrigem />
        <small className="suave">Ao criar a conta você concorda com os <a href="/termos" target="_blank">termos de uso</a> e a <a href="/privacidade" target="_blank">política de privacidade</a>.</small>
        <button type="submit">{plano.testeDias > 0 ? "Criar minha agenda" : "Continuar para o pagamento"}</button>
      </form>
      <p>Já tem conta? <Link href="/app/entrar">Entrar</Link></p>
    </>
  );
}
