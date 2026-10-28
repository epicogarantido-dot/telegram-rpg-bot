import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { ErroAgenda, formatarData } from "@aprenda/agenda";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { exigirLogin } from "@/lib/painel";
import { linkWhatsapp, normalizarTelefone } from "@aprenda/prospeccao";
import { urlDoSite } from "@/lib/membros";
import { criarSitesDeExemplo, fotosNovasParaExemplos, porFotosPadrao, sitesDeExemplo } from "@/lib/exemplos";
import { avisarPagamento } from "@/lib/avisos";
import { soEntrega, soVenda, urlSaas } from "@/lib/modo";
import { porCardapio } from "@/lib/cardapio";
import { TEMAS } from "@aprenda/agenda";

export const metadata = { title: "Assinaturas", robots: { index: false } };

/** 5555999991234 → (55) 99999-1234 */
function formatarTelefone(t: string): string {
  const local = t.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return local.length >= 10 ? `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}` : t;
}
export const dynamic = "force-dynamic";

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
  // Avisa no celular do barbeiro (se ele ligou os avisos): site no ar, renovação ou Pix não achado.
  if (p && antes) {
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

/**
 * Barbeiro esqueceu a senha: gera um link de troca (24 h, uso único) e abre o SEU WhatsApp
 * com a mensagem pronta pro número da barbearia. Quem envia é você.
 */
async function linkDeSenha(form: FormData) {
  "use server";
  await exigirLogin();
  const banco = obterAgenda();
  const b = banco.barbeariaPorId(Number(form.get("id")));
  const usuario = b && banco.usuariosDaBarbearia(b.id)[0];
  if (!b || !usuario) redirect(`/painel/assinaturas?erro=${encodeURIComponent("Barbearia sem conta de acesso.")}`);
  const link = `${urlDoSite()}/app/senha/${banco.criarLinkDeSenha(usuario.id)}`;
  const texto = `Oi, ${usuario.nome.split(" ")[0]}! Aqui está o link pra criar uma senha nova na agenda da ${b.nome}. Ele vale por 24 horas e funciona uma vez:\n\n${link}`;
  redirect(linkWhatsapp(b.telefone, texto));
}

/** Senha inicial fácil de ditar: sem 0/O, 1/l/I. O barbeiro troca no painel. */
function senhaInicial(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(10), (n) => letras[n % letras.length]).join("");
}

/**
 * SaaS: o cliente pagou no site de leads e você conferiu o Pix lá. Cria o site dele já no ar
 * (fotos padrão do estilo e cardápio de barbearia, que ele troca no painel) e abre o SEU
 * WhatsApp com o link do site, o do painel, o e-mail e a senha. Quem envia é você.
 */
async function criarSite(form: FormData) {
  "use server";
  await exigirLogin();
  const campo = (n: string) => String(form.get(n) ?? "").trim();
  const banco = obterAgenda();
  const telefone = normalizarTelefone(campo("telefone"));
  const senha = campo("senha") || senhaInicial();
  let b;
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

export default async function Assinaturas({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await exigirLogin();
  const fotosNovas = await fotosNovasParaExemplos();
  const { erro } = await searchParams;
  const banco = obterAgenda();
  const pendentes = banco.pagamentosPendentes();
  const barbearias = banco.todasBarbearias();
  const clientes = barbearias.filter((b) => b.email);
  const semDono = barbearias.length - clientes.length;

  return (
    <>
      {soEntrega()
        ? <p><strong>Assinaturas</strong> · <a href="#novo">Criar site de cliente</a> · <a href="/painel/backup">Baixar backup</a></p>
        : <p><Link href="/painel">Leads</Link> · <a href="/painel/divulgacao">Divulgação</a> · <strong>{soVenda() ? "Vendas" : "Assinaturas"}</strong> · <a href="/painel/backup">Baixar backup</a></p>}
      <h1>{soVenda() ? "Vendas" : "Assinaturas"}</h1>
      {soVenda() ? (
        <p><small>
          Compras feitas aqui (prévia, cadastro e o primeiro Pix). Confira o Pix e confirme. Depois crie o site do cliente
          no {urlSaas() ? <a href={`${urlSaas()}/painel/assinaturas#novo`}>painel do SaaS</a> : "painel do SaaS"} (&quot;Criar site
          de cliente&quot;) e mande o link e a senha no WhatsApp. Renovações e senha esquecida ficam lá.
        </small></p>
      ) : soEntrega() && (
        <p><small>Barbearias que já pagaram: renovações, senha esquecida e bloqueio. Cliente novo (que pagou no site de vendas): crie o site em <a href="#novo">Criar site de cliente</a>.</small></p>
      )}
      {erro && <p className="erro">{erro}</p>}

      <h2>Pagamentos a conferir ({pendentes.filter((p) => p.status === "informado").length})</h2>
      <p><small>Confira no extrato do banco se o Pix com o valor e o identificador caiu antes de confirmar.</small></p>
      {pendentes.length === 0 && <p>Nada pendente.</p>}
      {pendentes.map((p) => (
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
      ))}

      {/* No SaaS os exemplos não aparecem: ficam só como acervo de fotos padrão das contas. */}
      {!soEntrega() && <>
      <h2>Sites de exemplo</h2>
      <p><small>Um por estilo, pra mostrar um site de verdade na conversa. Sem login (ninguém mexe), a marcação não grava e o topo avisa que é exemplo. Aparecem nos carrosséis de estilos.</small></p>
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
      </>}

      {soEntrega() && (
        <section id="novo">
          <h2>Criar site de cliente</h2>
          <p><small>
            Pra quem pagou no site de vendas. O site já nasce no ar por {obterAgenda().plano.dias} dias, com as fotos padrão do
            estilo e os cortes de barbearia; o cliente troca tudo no painel. Ao criar, abre o seu WhatsApp com o link e a senha
            prontos pra mandar.
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
      )}

      {/* Só quem tem conta (e-mail de acesso). Exemplos e prévias de /montar não têm dono: ficam contados à parte. */}
      <h2>Barbearias ({clientes.length})</h2>
      {semDono > 0 && !soEntrega() && <p><small>Fora da lista: {semDono} {semDono === 1 ? "site sem dono" : "sites sem dono"} (exemplos e prévias de /montar, que vencem sozinhas).</small></p>}
      {clientes.length === 0 && <p>Nenhuma barbearia cadastrada ainda.</p>}
      {clientes.map((b) => {
        const ativo = banco.acessoAtivo(b);
        return (
          <div key={b.id} className="item-config">
            <span>
              {soVenda()
                ? <>{b.emMontagem ? "🟡" : "🟢"} <strong>{b.nome}</strong> · {b.email} · {formatarTelefone(b.telefone)} · estilo {TEMAS.find((t) => t.id === b.tema)?.nome ?? b.tema}{b.cidade ? ` · ${b.cidade}` : ""}</>
                : <>{ativo ? "🟢" : "🔴"} <a href={`/b/${b.slug}`} target="_blank" rel="noopener noreferrer">{b.nome}</a> · {b.email} ·{" "}</>}
              {soVenda() ? null : b.emMontagem ? (ativo ? `pedido aberto até ${formatarData(b.acessoAte)} (ainda não publicado)` : `não pagou; pedido venceu em ${formatarData(b.acessoAte)}`) : ativo ? `até ${formatarData(b.acessoAte)}` : `bloqueada desde ${formatarData(b.acessoAte)}`}
            </span>
            {soVenda() ? (
              <span className="acoes">
                {b.emMontagem
                  ? <small>aguardando o Pix</small>
                  : <a href={linkWhatsapp(b.telefone, `Oi! Recebemos o seu pagamento do site da ${b.nome}. Já já te mando o link e a senha do painel.`)} target="_blank" rel="noopener noreferrer">Pago: criar o site no SaaS e chamar no WhatsApp</a>}
              </span>
            ) : (
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
            )}
          </div>
        );
      })}
    </>
  );
}
