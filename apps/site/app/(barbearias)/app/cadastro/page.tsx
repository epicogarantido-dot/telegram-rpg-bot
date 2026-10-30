import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { contatoResponsavel } from "@/lib/contato";
import { ErroAgenda, planoDoAmbiente, TEMAS, temaValido } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { chaveDoAparelho } from "@/lib/protecao";
import { obterBanco } from "@/lib/painel";
import { CampoOrigem, Medir } from "@/componentes/ContarOrigem";
import { porFotosPadrao } from "@/lib/exemplos";
import { soVenda } from "@/lib/modo";

export const metadata = { title: "Quero o meu site" };

const RASCUNHO = "pedido_rascunho";

function lerRascunho(valor: string | undefined): { barbearia?: string; telefone?: string; nome?: string } {
  try { return valor ? JSON.parse(valor) : {}; } catch { return {}; }
}

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
    if (obterAgenda().contarTentativas(chave, 24 * 60) >= 3) throw new ErroAgenda("Este aparelho já fez pedidos hoje. Pra fazer mais um, mande pelo WhatsApp: a gente faz por lá na hora.");
    if (!telefone) throw new ErroAgenda("WhatsApp inválido.");
    // No site de leads o pedido é só barbearia, WhatsApp e nome: e-mail e senha não seguram ninguém antes do Pix.
    const conta = soVenda()
      ? obterAgenda().criarPedido({ nomeBarbearia: campo("barbearia"), telefone, nome: campo("nome") })
      : obterAgenda().criarConta({ nomeBarbearia: campo("barbearia"), telefone, nome: campo("nome"), email: campo("email"), senha: campo("senha") });
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
    // O que a pessoa digitou volta preenchido (cookie de 10 min, só neste aparelho; nada na URL).
    (await cookies()).set(RASCUNHO, JSON.stringify({ barbearia: campo("barbearia").slice(0, 60), telefone: campo("telefone").slice(0, 20), nome: campo("nome").slice(0, 60) }),
      { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/app/cadastro" });
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
  // Só com erro na tela: senão um pedido antigo apareceria preenchido.
  const rascunho = erro ? lerRascunho((await cookies()).get(RASCUNHO)?.value) : {};
  const contato = contatoResponsavel();
  const pedirNoWhats = contato && `${contato.link}?text=${encodeURIComponent(
    `Oi! Quero o site com agenda pra minha barbearia${rascunho.barbearia ? ` (${rascunho.barbearia})` : ""}. Tentei fazer o pedido pelo site e não consegui.` +
    `${rascunho.nome ? ` Meu nome é ${rascunho.nome}.` : ""}`)}`;
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
      {erro && (
        <div className="erro" role="alert">
          <p>{erro}</p>
          {pedirNoWhats && <p><a href={pedirNoWhats} target="_blank" rel="noopener noreferrer" data-evento="whatsapp" data-detalhe="erro-pedido">Fazer o pedido pelo WhatsApp</a></p>}
        </div>
      )}
      <form action={cadastrar} className="formulario">
        {demo && <input type="hidden" name="demo" value={convite} />}
        {tema && <input type="hidden" name="estilo" value={tema.id} />}
        {tema && <p className="suave pequeno">Estilo escolhido: <strong>{tema.nome}</strong> (dá pra trocar depois). <a href="/#estilos">Ver os outros</a></p>}
        <label>Nome da barbearia<input name="barbearia" required maxLength={60} defaultValue={rascunho.barbearia ?? demo?.nome} autoComplete="organization" /></label>
        <label>WhatsApp (com DDD)<input name="telefone" required inputMode="tel" autoComplete="tel" placeholder="(19) 99999-0000" defaultValue={rascunho.telefone}
          pattern="^\D*(\d\D*){10,13}$" title="DDD e número, ex.: (19) 98765-4321" /></label>
        <label>Seu nome<input name="nome" required maxLength={60} autoComplete="name" defaultValue={rascunho.nome} /></label>
        {soVenda()
          ? <small className="suave">É por esse WhatsApp que a gente fala com você pra montar o site.</small>
          : <>
            <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
            <input name="senha" type="password" placeholder="Crie uma senha (mín. 8 caracteres)" required minLength={8} autoComplete="new-password" />
            <small className="suave">A senha é pra você acompanhar o pedido e a assinatura por aqui.</small>
          </>}
        <CampoOrigem />
        <small className="suave">Ao continuar você concorda com os <a href="/termos" target="_blank">termos de uso</a> e a <a href="/privacidade" target="_blank">política de privacidade</a>.</small>
        <button type="submit">{plano.testeDias > 0 ? "Começar" : "Continuar para o pagamento"}</button>
      </form>
      <p className="suave">Já fez o pedido? <Link href="/app/entrar">Ver o meu pedido</Link></p>
    </>
  );
}
