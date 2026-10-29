import Link from "next/link";
import { redirect } from "next/navigation";
import { ErroAgenda, planoDoAmbiente, TEMAS, temaValido } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { chaveDoAparelho } from "@/lib/protecao";
import { obterBanco } from "@/lib/painel";
import { CampoOrigem, Medir } from "@/componentes/ContarOrigem";
import { porFotosPadrao } from "@/lib/exemplos";
import { soVenda } from "@/lib/modo";

export const metadata = { title: "Quero o meu site" };

async function cadastrar(form: FormData) {
  "use server";
  const campo = (n: string) => String(form.get(n) ?? "");
  const telefone = normalizarTelefone(campo("telefone"));
  // Veio do "Quero este site" de uma demonstração: só conta de onde veio (o site não muda de dono).
  const demo = campo("demo") || undefined;
  let token: string;
  let montagem = false;
  try {
    // Até 3 contas novas por aparelho por dia: segura quem tenta criar barbearia em massa.
    const chave = `cadastro:ip:${await chaveDoAparelho()}`;
    if (obterAgenda().contarTentativas(chave, 24 * 60) >= 3) throw new ErroAgenda("Muitos pedidos feitos deste aparelho hoje. Tente amanhã ou fale com a gente.");
    if (!telefone) throw new ErroAgenda("WhatsApp inválido.");
    const conta = obterAgenda().criarConta({ nomeBarbearia: campo("barbearia"), telefone, nome: campo("nome"), email: campo("email"), senha: campo("senha") });
    token = conta.token;
    montagem = conta.barbearia.emMontagem;
    // Veio do "Quero esse" de um estilo: fica anotado pra montar o site nele (dá pra trocar depois).
    const estilo = campo("estilo");
    if (temaValido(estilo)) obterAgenda().atualizarSite(conta.barbearia.id, { tema: estilo });
    // No site de leads a conta é só a assinatura (o site do cliente é montado no SaaS): sem fotos.
    if (!soVenda()) porFotosPadrao(conta.barbearia.id, conta.barbearia.tema);
    obterAgenda().consumirLimite(chave, Number.MAX_SAFE_INTEGER, 24 * 60, "");
    // De onde veio quem virou cliente (link do grupo, cartão, convite, demonstração): só a contagem.
    obterBanco().registrarOrigem(campo("origem") || (demo ? "demonstracao" : "direto"), "cadastro");
    obterBanco().registrarEvento("cadastro");
    if (campo("lead")) obterBanco().registrarEventoDoLead(campo("lead"), "cadastro");
  } catch (e) {
    redirect(`/app/cadastro?${new URLSearchParams({ erro: mensagemDeErro(e), ...(demo ? { demo } : {}), ...(campo("estilo") ? { estilo: campo("estilo") } : {}) })}`);
  }
  await gravarSessaoAgenda(token);
  // Próximo passo é o pagamento. No site de leads (que só mostra e cobra) é sempre ele.
  redirect(montagem || soVenda() ? "/app/assinatura?bemvindo=1" : "/app?novo=1");
}

/**
 * "Quero meu site": o pedido. Nada de escolher estilo ou montar nada aqui: o barbeiro deixa o
 * contato e paga; depois a gente chama no WhatsApp, pega fotos, serviços e preços e monta o site.
 */
export default async function Cadastro({ searchParams }: { searchParams: Promise<{ erro?: string; demo?: string; estilo?: string }> }) {
  const { erro, demo: convite, estilo } = await searchParams;
  const tema = estilo && temaValido(estilo) ? TEMAS.find((t) => t.id === estilo) : undefined;
  const demo = obterAgenda().demonstracaoPorConvite(convite);
  const plano = planoDoAmbiente();
  return (
    <>
      <Medir evento="cadastro_inicio" />
      <ol className="passos-compra" aria-label="Etapas">
        <li aria-current="step">Seus dados</li>
        <li>Pagamento</li>
      </ol>
      <h1>Quero o meu site</h1>
      <p>
        Site da sua barbearia com agenda online e painel no celular. Depois do pagamento, a gente chama você no
        WhatsApp, pega as suas fotos, serviços e preços e entrega o site pronto, pra você mudar o que quiser.
      </p>
      <p className="suave">
        {plano.testeDias > 0
          ? <>Grátis por {plano.testeDias} dias. Depois, </>
          : <>Valor: </>}
        contratação de {reais(plano.adesaoCentavos || plano.valorCentavos)} (já inclui o primeiro mês) e {reais(plano.valorCentavos)} por mês, no Pix.
      </p>
      {erro && <p className="erro">{erro}</p>}
      <form action={cadastrar} className="formulario">
        {demo && <input type="hidden" name="demo" value={convite} />}
        {tema && <input type="hidden" name="estilo" value={tema.id} />}
        {tema && <p className="suave pequeno">Estilo escolhido: <strong>{tema.nome}</strong> (dá pra trocar depois). <a href="/#estilos">Ver os outros</a></p>}
        <input name="barbearia" placeholder="Nome da barbearia" required maxLength={60} defaultValue={demo?.nome} />
        <input name="telefone" placeholder="WhatsApp da barbearia (com DDD)" required inputMode="tel" />
        <input name="nome" placeholder="Seu nome" required maxLength={60} />
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Crie uma senha (mín. 8 caracteres)" required minLength={8} autoComplete="new-password" />
        <small className="suave">A senha é pra você acompanhar o pedido e a assinatura por aqui.</small>
        <CampoOrigem />
        <small className="suave">Ao continuar você concorda com os <a href="/termos" target="_blank">termos de uso</a> e a <a href="/privacidade" target="_blank">política de privacidade</a>.</small>
        <button type="submit">{plano.testeDias > 0 ? "Começar" : "Continuar para o pagamento"}</button>
      </form>
      <p>Já fez o pedido? <Link href="/app/entrar">Entrar</Link></p>
    </>
  );
}
