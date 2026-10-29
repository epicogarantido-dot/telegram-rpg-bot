import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { ErroAgenda, formatarData, TEMAS, type Barbearia } from "@aprenda/agenda";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { exigirLogin } from "@/lib/painel";
import { linkWhatsapp, normalizarTelefone } from "@aprenda/prospeccao";
import { urlDoSite } from "@/lib/membros";
import { criarSitesDeExemplo, fotosNovasParaExemplos, porFotosPadrao, sitesDeExemplo } from "@/lib/exemplos";
import { avisarPagamento } from "@/lib/avisos";
import { soEntrega, soVenda } from "@/lib/modo";
import { porCardapio } from "@/lib/cardapio";
import { prazoDaConta } from "@/lib/prazo";
import { mensagemDeAcesso, variaveisDoApp } from "@/lib/app-do-barbeiro";
import { BotaoCopiar } from "@/componentes/BotaoCopiar";

export const metadata = { title: "Assinaturas", robots: { index: false } };
export const dynamic = "force-dynamic";

/** 5555999991234 → (55) 99999-1234 */
function formatarTelefone(t: string): string {
  const local = t.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return local.length >= 10 ? `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}` : t;
}

/** Site de leads: confere o Pix. Confirmar só salva a assinatura com o prazo; não publica nada. */
async function decidir(form: FormData) {
  "use server";
  await exigirLogin();
  const id = Number(form.get("id"));
  const banco = obterAgenda();
  const confirmado = form.get("acao") === "confirmar";
  const p = banco.pagamento(id);
  const antes = p && banco.barbeariaPorId(p.barbeariaId);
  try {
    if (confirmado) banco.confirmarPagamento(id);
    else banco.recusarPagamento(id);
  } catch (e) {
    redirect(`/painel/assinaturas?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  // Um app só: avisa no celular do barbeiro (se ele ligou os avisos). No site de leads não há painel.
  if (p && antes && !soVenda()) {
    const depois = banco.barbeariaPorId(p.barbeariaId);
    await avisarPagamento(p.barbeariaId, { confirmado, publicou: antes.emMontagem, ate: depois?.acessoAte, nome: antes.nome });
  }
  revalidatePath("/painel/assinaturas");
}

async function bloquear(form: FormData) {
  "use server";
  await exigirLogin();
  obterAgenda().bloquear(Number(form.get("id")));
  revalidatePath("/painel/assinaturas");
}

/** SaaS: o barbeiro pagou (a cobrança é no site de vendas): soma mais um período ao prazo. */
async function renovar(form: FormData) {
  "use server";
  await exigirLogin();
  const banco = obterAgenda();
  try {
    banco.renovar(Number(form.get("id")), banco.plano.dias);
  } catch (e) {
    redirect(`/painel/assinaturas?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/painel/assinaturas");
}

/** SaaS: tira do ar ou põe de volta (site e painel). O prazo vencido sozinho não tira nada. */
async function suspender(form: FormData) {
  "use server";
  await exigirLogin();
  obterAgenda().suspender(Number(form.get("id")), form.get("suspensa") === "1");
  revalidatePath("/painel/assinaturas");
}

/**
 * Esqueceu a senha: gera um link de troca (24 h, uso único) e abre o SEU WhatsApp com a
 * mensagem pronta pro número da barbearia. Quem envia é você.
 */
async function linkDeSenha(form: FormData) {
  "use server";
  await exigirLogin();
  const banco = obterAgenda();
  const b = banco.barbeariaPorId(Number(form.get("id")));
  const usuario = b && banco.usuariosDaBarbearia(b.id)[0];
  if (!b || !usuario) redirect(`/painel/assinaturas?erro=${encodeURIComponent("Barbearia sem conta de acesso.")}`);
  const link = `${urlDoSite()}/app/senha/${banco.criarLinkDeSenha(usuario.id)}`;
  const onde = soVenda() ? `pra acompanhar a assinatura da ${b.nome}` : `do painel da ${b.nome}`;
  const texto = `Oi, ${usuario.nome.split(" ")[0]}! Aqui está o link pra criar uma senha nova ${onde}. Ele vale por 24 horas e funciona uma vez:\n\n${link}`;
  redirect(linkWhatsapp(b.telefone, texto));
}

/** Senha inicial fácil de ditar: sem 0/O, 1/l/I. O barbeiro troca no painel. */
function senhaInicial(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(10), (n) => letras[n % letras.length]).join("");
}

/**
 * SaaS: o cliente pagou no site de vendas. Cria o site dele já no ar por um período (fotos padrão
 * do estilo e cardápio de barbearia, que ele troca no painel) e abre o SEU WhatsApp com o link
 * do site, o do painel, o e-mail e a senha. Quem envia é você.
 */
async function criarSite(form: FormData) {
  "use server";
  await exigirLogin();
  const campo = (n: string) => String(form.get(n) ?? "").trim();
  const banco = obterAgenda();
  const telefone = normalizarTelefone(campo("telefone"));
  const senha = campo("senha") || senhaInicial();
  let b: Barbearia;
  try {
    if (!telefone) throw new ErroAgenda("WhatsApp inválido.");
    b = banco.criarContaPeloAdmin({
      nomeBarbearia: campo("barbearia"), telefone, tema: campo("tema"), cidade: campo("cidade"),
      nome: campo("nome"), email: campo("email"), senha, dias: banco.plano.dias,
    });
    porFotosPadrao(b.id, b.tema);
    porCardapio(b.id);
  } catch (e) {
    redirect(`/painel/assinaturas?erro=${encodeURIComponent(mensagemDeErro(e))}#novo`);
  }
  const usuario = banco.usuariosDaBarbearia(b.id)[0]!;
  const texto = `Oi, ${usuario.nome.split(" ")[0]}! O site da ${b.nome} está no ar:\n${urlDoSite()}/b/${b.slug}\n\n` +
    `Seu painel, pra trocar fotos, preços, horários e o que quiser:\n${urlDoSite()}/app/entrar\n` +
    `E-mail: ${usuario.email}\nSenha: ${senha}\n\nDá pra trocar a senha no painel, em Configurações.`;
  redirect(linkWhatsapp(b.telefone, texto));
}

/** Cria os 6 sites de exemplo (um por estilo) que faltarem. */
async function criarExemplos() {
  "use server";
  await exigirLogin();
  await criarSitesDeExemplo();
  revalidatePath("/painel/assinaturas");
  revalidatePath("/");
}

/** Situação de uma assinatura do site de leads, da mais urgente (0) pra mais tranquila. */
function situacaoDaAssinatura(b: Barbearia) {
  if (b.emMontagem) return { ordem: 2, etiqueta: "aguardando o 1º Pix", alerta: false, texto: `pedido feito; sem pagamento confirmado` };
  const prazo = prazoDaConta(b);
  const data = formatarData(b.acessoAte);
  if (prazo.situacao === "acabou") {
    return { ordem: 0, etiqueta: "atrasada", alerta: true, texto: `venceu em ${data}, há ${prazo.atraso} ${prazo.atraso === 1 ? "dia" : "dias"}` };
  }
  if (prazo.situacao === "acabando") return { ordem: 1, etiqueta: "vence logo", alerta: false, texto: `vai até ${data} (faltam ${prazo.dias} ${prazo.dias === 1 ? "dia" : "dias"})` };
  return { ordem: 3, etiqueta: "em dia", alerta: false, texto: `até ${data}` };
}

export default async function Assinaturas({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await exigirLogin();
  const { erro } = await searchParams;
  const banco = obterAgenda();
  // Só quem tem conta (e-mail de acesso). Exemplos e demonstrações não têm dono.
  const clientes = banco.todasBarbearias().filter((b) => b.email);

  if (soEntrega()) {
    return (
      <>
        <p><strong>Barbearias</strong> · <a href="#novo">Criar site de cliente</a> · <a href="/painel/backup">Baixar backup</a></p>
        <h1>Barbearias</h1>
        <p><small>
          Sites de quem já pagou (a cobrança é no site de vendas). Cada um começa com {banco.plano.dias} dias; quando o prazo
          acaba, o barbeiro só recebe o aviso no painel e o site continua no ar. Recebeu a mensalidade? Toque em
          &quot;+{banco.plano.dias} dias&quot;. Pra tirar do ar, &quot;Suspender&quot;.
        </small></p>
        {erro && <p className="erro">{erro}</p>}

        <h2>Clientes ({clientes.length})</h2>
        {clientes.length === 0 && <p>Nenhuma barbearia ainda. Crie a primeira aqui embaixo.</p>}
        {clientes.map((b) => {
          const prazo = prazoDaConta(b);
          return (
            <div key={b.id} className="item-config">
              <span>
                <span className={`etiqueta ${b.suspensa || prazo.situacao === "acabou" ? "etiqueta-alerta" : ""}`}>
                  {b.suspensa ? "suspensa" : prazo.situacao === "acabou" ? "prazo acabou" : prazo.situacao === "acabando" ? "acabando" : "em dia"}
                </span>{" "}
                <a href={`/b/${b.slug}`} target="_blank" rel="noopener noreferrer">{b.nome}</a> · {b.email} · {formatarTelefone(b.telefone)}
                <br /><small>{prazo.frase}</small>
              </span>
              <span className="acoes">
                <form action={renovar}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="botao-sec">+{banco.plano.dias} dias</button>
                </form>
                <a className="botao-sec" target="_blank" rel="noopener noreferrer"
                  href={linkWhatsapp(b.telefone, prazo.situacao === "em dia" ? `Oi! Tudo certo com o site da ${b.nome}?` : `Oi! ${prazo.frase} Quer renovar o site da ${b.nome}?`)}>
                  WhatsApp
                </a>
                <form action={linkDeSenha}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="botao-sec">Link de nova senha</button>
                </form>
                <form action={suspender}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="suspensa" value={b.suspensa ? "0" : "1"} />
                  <button className="botao-sec">{b.suspensa ? "Reativar" : "Suspender"}</button>
                </form>
              </span>
            </div>
          );
        })}

        <section id="novo">
          <h2>Criar site de cliente</h2>
          <p><small>
            Pra quem pagou no site de vendas. O site já nasce no ar por {banco.plano.dias} dias, com as fotos padrão do estilo e
            os cortes de barbearia; o cliente troca tudo no painel. Ao criar, abre o seu WhatsApp com o link e a senha prontos
            pra mandar.
          </small></p>
          <form action={criarSite} className="formulario">
            <input name="barbearia" placeholder="Nome da barbearia" required maxLength={80} />
            <input name="telefone" placeholder="WhatsApp do cliente (com DDD)" required inputMode="tel" />
            <input name="nome" placeholder="Nome do responsável" required maxLength={80} />
            <input name="email" type="email" placeholder="E-mail pra entrar no painel" required />
            <input name="cidade" placeholder="Cidade (opcional)" maxLength={60} />
            <label>Estilo
              <select name="tema" defaultValue="cerimonia">
                {TEMAS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </label>
            <input name="senha" placeholder="Senha (vazio = gerar uma)" minLength={8} maxLength={60} />
            <button className="botao">Criar o site e abrir o WhatsApp</button>
          </form>
        </section>
      </>
    );
  }

  const fotosNovas = await fotosNovasParaExemplos();
  const pendentes = banco.pagamentosPendentes();
  const assinaturas = clientes.map((b) => ({ b, s: situacaoDaAssinatura(b) })).sort((x, y) => x.s.ordem - y.s.ordem);
  const contar = (etiqueta: string, um: string, varios: string) => {
    const n = assinaturas.filter((a) => a.s.etiqueta === etiqueta).length;
    return `${n} ${n === 1 ? um : varios}`;
  };
  // "Já paguei" primeiro; QR só gerado (a pessoa abriu o Pix e não avisou) fica recolhido.
  const informados = pendentes.filter((p) => p.status === "informado");
  const soQr = pendentes.filter((p) => p.status !== "informado");

  const cartaoPagamento = (p: (typeof pendentes)[number]) => (
    <div key={p.id} className="cartao lead">
      <div>
        <span className="etiqueta">{p.comprovante ? "mandou comprovante" : p.status === "informado" ? "disse que pagou" : "QR gerado"}</span>{" "}
        <strong>{p.barbearia}</strong> · {reais(p.valorCentavos)} · {p.dias} dias
        <br />
        <small>Identificador <code>{p.txid}</code> · pagador: {p.pagador ?? "-"} · {p.criadoEm.slice(0, 16).replace("T", " ")}</small>
        {p.comprovante ? (
          <div className="comprovante">
            <a href={`/painel/comprovante/${p.comprovante}`} target="_blank" rel="noopener noreferrer">
              {p.comprovante.endsWith(".pdf")
                ? "Abrir o comprovante (PDF)"
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={`/painel/comprovante/${p.comprovante}`} alt={`Comprovante de ${p.barbearia}`} loading="lazy" />}
            </a>
          </div>
        ) : p.status === "informado" && <p><small>Sem comprovante: confira só pelo extrato.</small></p>}
        {(() => {
          const b = banco.barbeariaPorId(p.barbeariaId);
          return b?.telefone && (
            <p><a href={linkWhatsapp(b.telefone, `Oi! Aqui é da equipe do Aprenda Livre. Recebemos o pedido do site da ${b.nome}.`)} target="_blank" rel="noopener noreferrer">
              Chamar {b.nome} no WhatsApp
            </a></p>
          );
        })()}
      </div>
      <div className="acoes">
        <form action={decidir}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="acao" value="confirmar" />
          <button className="botao">{soVenda() ? "Confirmar pagamento" : "Confirmar e liberar"}</button>
        </form>
        <form action={decidir}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="acao" value="recusar" />
          <button className="botao-sec">Recusar</button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <p><Link href="/painel">Leads</Link> · <a href="/painel/divulgacao">Divulgação</a> · <strong>Assinaturas</strong> · <a href="/painel/backup">Baixar backup</a></p>
      <h1>Assinaturas</h1>
      {soVenda() && (
        <p><small>
          Quem comprou pelo site. Confira o Pix no extrato e confirme: a assinatura fica salva com o prazo. Quando o prazo
          acaba, ela aparece como atrasada (nada é bloqueado). Cada barbeiro ganha um app só dele na Square: em &quot;App do
          barbeiro&quot;, na linha da assinatura, estão as variáveis pra colar e a mensagem com o link e a senha.
        </small></p>
      )}
      {erro && <p className="erro">{erro}</p>}

      <h2>Pagamentos a conferir ({informados.length})</h2>
      <p><small>Confira no extrato do banco se o Pix com o valor e o identificador caiu antes de confirmar.</small></p>
      {informados.length === 0 && <p>Nada pendente.</p>}
      {informados.map(cartaoPagamento)}
      {soQr.length > 0 && (
        <details>
          <summary>QR gerado sem aviso de pagamento ({soQr.length})</summary>
          <p><small>A pessoa abriu o Pix mas não tocou em &quot;Já paguei&quot;. Se o Pix caiu no extrato, dá pra confirmar daqui.</small></p>
          {soQr.map(cartaoPagamento)}
        </details>
      )}

      <h2>Assinaturas ({clientes.length})</h2>
      {soVenda() && clientes.length > 0 && (
        <p><small>
          {contar("atrasada", "atrasada", "atrasadas")} · {contar("vence logo", "vencendo", "vencendo")} · {contar("em dia", "em dia", "em dia")} · {contar("aguardando o 1º Pix", "aguardando o 1º Pix", "aguardando o 1º Pix")}
        </small></p>
      )}
      {clientes.length === 0 && <p>Nenhuma assinatura ainda.</p>}
      {soVenda()
        ? assinaturas.map(({ b, s }) => (
          <div key={b.id} className="item-config">
            <span>
              <span className={`etiqueta ${s.alerta ? "etiqueta-alerta" : ""}`}>{s.etiqueta}</span>{" "}
              <strong>{b.nome}</strong> · {formatarTelefone(b.telefone)} · {b.email}
              <br /><small>{s.texto}</small>
            </span>
            <span className="acoes">
              <a className="botao-sec" target="_blank" rel="noopener noreferrer" href={linkWhatsapp(b.telefone,
                s.etiqueta === "atrasada" ? `Oi! A mensalidade do site da ${b.nome} venceu em ${formatarData(b.acessoAte)}. Quer que eu te mande o Pix?`
                : b.emMontagem ? `Oi! Vi o seu pedido do site da ${b.nome}. Posso te ajudar com o pagamento?`
                : `Oi! Recebemos o pagamento do site da ${b.nome}. Vamos montar o seu site?`)}>
                WhatsApp
              </a>
              <form action={linkDeSenha}>
                <input type="hidden" name="id" value={b.id} />
                <button className="botao-sec">Link de nova senha</button>
              </form>
            </span>
            {/* Pago: o app do barbeiro (um por cliente) sobe na Square com estas variáveis. */}
            {!b.emMontagem && (
              <details className="app-do-barbeiro">
                <summary>App do barbeiro: variáveis e acesso</summary>
                <p><small>
                  1. Suba o <code>saas-square.zip</code> como app novo na Square e troque o subdomínio pro sugerido. 2. Cole estas
                  variáveis em Configurações → Variáveis de ambiente e reinicie. 3. Mande o acesso pro barbeiro.
                  Renovou aqui? Atualize o <code>PAGO_ATE</code> no app dele.
                </small></p>
                <pre>{variaveisDoApp(b)}</pre>
                <span className="acoes">
                  <BotaoCopiar texto={variaveisDoApp(b)} rotulo="Copiar variáveis" />
                  <a className="botao-sec" target="_blank" rel="noopener noreferrer" href={linkWhatsapp(b.telefone, mensagemDeAcesso(b))}>Mandar o acesso pelo WhatsApp</a>
                </span>
              </details>
            )}
          </div>
        ))
        : clientes.map((b) => {
          const ativo = banco.acessoAtivo(b);
          return (
            <div key={b.id} className="item-config">
              <span>
                {ativo ? "🟢" : "🔴"} <a href={`/b/${b.slug}`} target="_blank" rel="noopener noreferrer">{b.nome}</a> · {b.email} ·{" "}
                {b.emMontagem ? (ativo ? `pedido aberto até ${formatarData(b.acessoAte)} (ainda não publicado)` : `não pagou; pedido venceu em ${formatarData(b.acessoAte)}`) : ativo ? `até ${formatarData(b.acessoAte)}` : `bloqueada desde ${formatarData(b.acessoAte)}`}
              </span>
              <span className="acoes">
                <form action={linkDeSenha}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="botao-sec">Link de nova senha</button>
                </form>
                {ativo && (
                  <form action={bloquear}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="botao-sec">Bloquear agora</button>
                  </form>
                )}
              </span>
            </div>
          );
        })}

      <h2>Sites de exemplo</h2>
      <p><small>Um por estilo, pra mostrar um site de verdade. Sem login (ninguém mexe), a marcação não grava e o topo avisa que é exemplo. Aparecem nos carrosséis de estilos.</small></p>
      {(() => {
        const exemplos = sitesDeExemplo();
        const faltam = TEMAS.filter((t) => !exemplos[t.id]).length;
        return (
          <>
            <ul>
              {TEMAS.filter((t) => exemplos[t.id]).map((t) => (
                <li key={t.id}>{t.nome}: <a href={`/b/${exemplos[t.id]}`} target="_blank" rel="noopener noreferrer">/b/{exemplos[t.id]}</a></li>
              ))}
            </ul>
            {faltam > 0 ? (
              <form action={criarExemplos}>
                <button className="botao">Criar {faltam === TEMAS.length ? "os" : "os que faltam:"} {faltam} sites de exemplo</button>
              </form>
            ) : (
              // Pode rodar quantas vezes quiser: só põe o que falta (fotos novas, cardápio, fotos da equipe).
              <form action={criarExemplos}>
                <button className="botao">{fotosNovas > 0 ? `Pôr ${fotosNovas} fotos novas nos exemplos` : "Atualizar os sites de exemplo"}</button>
              </form>
            )}
          </>
        );
      })()}
    </>
  );
}
