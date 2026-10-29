import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { apagarComprovante, ErroAgenda, formatarData, gerarPixCopiaECola, gravarComprovante, MAX_BYTES_COMPROVANTE, prepararComprovante, type Barbearia } from "@aprenda/agenda";
import { BotaoCopiar } from "@/componentes/BotaoCopiar";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { CampoFoto } from "@/componentes/CampoFoto";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { configPix, exigirBarbeiro, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { contatoResponsavel } from "@/lib/contato";
import { soEntrega, soVenda } from "@/lib/modo";
import { prazoDaConta } from "@/lib/prazo";

/** 5555999991234 → (55) 99999-1234 */
function formatarTelefone(t: string): string {
  const local = t.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return local.length >= 10 ? `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}` : t;
}

export const metadata = { title: "Plano", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROTULO = { aberto: "aguardando pagamento", informado: "aguardando confirmação", confirmado: "confirmado", recusado: "recusado" };

/**
 * "Já paguei", com ou sem comprovante. Não libera nada: põe na fila do admin, que confere o
 * extrato (e o comprovante, se veio) em /painel/assinaturas.
 */
async function jaPaguei(form: FormData) {
  "use server";
  const { barbearia } = await exigirBarbeiro();
  const banco = obterAgenda();
  const id = Number(form.get("id"));
  const pagador = String(form.get("pagador") ?? "");
  const arquivo = form.get("comprovante");
  try {
    if (arquivo instanceof File && arquivo.size > 0) {
      // Confere de quem é o pagamento ANTES de gravar: senão sobrava arquivo órfão no disco.
      if (banco.pagamentoAberto(barbearia.id).id !== id) throw new ErroAgenda("Pagamento não encontrado.");
      if (arquivo.size > MAX_BYTES_COMPROVANTE) throw new ErroAgenda("Arquivo grande demais (máximo 8 MB).");
      const nome = gravarComprovante(id, await prepararComprovante(Buffer.from(await arquivo.arrayBuffer())));
      const anterior = banco.anexarComprovante(barbearia.id, id, nome, pagador);
      if (anterior) apagarComprovante(anterior);
    } else {
      banco.informarPagamento(barbearia.id, id, pagador);
    }
  } catch (e) {
    redirect(`/app/assinatura?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/app/assinatura");
}

/**
 * SaaS: o barbeiro não paga por aqui (a cobrança é com a gente, fora do sistema). A página só
 * mostra até quando vai o período pago e o caminho pra renovar, que é falar no WhatsApp.
 */
function SeuPlano({ barbearia }: { barbearia: Barbearia }) {
  const prazo = prazoDaConta(barbearia);
  const contato = contatoResponsavel();
  return (
    <>
      {!barbearia.suspensa && <p><Link href="/app">← Voltar pro painel</Link></p>}
      <h1>Seu plano</h1>
      {barbearia.suspensa ? (
        <aside className="erro">
          O seu site e o painel estão pausados. Fale com a gente pra voltar ao ar: nada foi apagado.
        </aside>
      ) : prazo.situacao === "em dia" && (
        // Acabando ou acabou: a faixa do painel, logo acima, já diz.
        <aside className="aviso-novo">{prazo.frase}</aside>
      )}
      <p>
        O seu site, a agenda e o painel continuam funcionando normalmente. A renovação é com a gente:
        {contato ? <> é só chamar no WhatsApp.</> : <> fale com quem te vendeu o site.</>}
      </p>
      {contato && (
        <p>
          <a className="botao" target="_blank" rel="noopener noreferrer"
            href={`${contato.link}?text=${encodeURIComponent(`Olá! Quero renovar o site da ${barbearia.nome}.`)}`}>
            Renovar pelo WhatsApp
          </a>
        </p>
      )}
    </>
  );
}

export default async function Assinatura({ searchParams }: { searchParams: Promise<{ erro?: string; bemvindo?: string }> }) {
  const { barbearia } = await exigirBarbeiro();
  if (soEntrega()) return <SeuPlano barbearia={barbearia} />;
  const { erro, bemvindo } = await searchParams;
  const banco = obterAgenda();
  const ativo = banco.acessoAtivo(barbearia);
  const pagamento = banco.pagamentoAberto(barbearia.id);
  const nuncaPagou = !banco.jaContratou(barbearia.id);
  const contratacao = nuncaPagou && (banco.plano.adesaoCentavos ?? 0) > 0;
  const historico = banco.pagamentosDaBarbearia(barbearia.id).filter((p) => p.id !== pagamento.id);
  const pixConfigurado = !!(configPix.chave && configPix.nome && configPix.cidade);
  const copiaECola = pixConfigurado
    ? gerarPixCopiaECola({ ...configPix, valorCentavos: pagamento.valorCentavos, txid: pagamento.txid, descricao: `Agenda ${barbearia.nome}` })
    : "";
  const qr = copiaECola ? await QRCode.toString(copiaECola, { type: "svg", margin: 1, width: 240 }) : "";

  // Conta nova que já pagou (ou disse que pagou): agora é com a equipe, que chama no WhatsApp.
  if (barbearia.emMontagem && pagamento.status === "informado") {
    return (
      <>
        <ol className="passos-compra" aria-label="Etapas">
          <li className="feito">Seus dados</li>
          <li className="feito">Pagamento</li>
        </ol>
        <section className="pedido-recebido" aria-labelledby="recebido-titulo">
          <h1 id="recebido-titulo">Pedido recebido!</h1>
          <p>
            Obrigado, {barbearia.nome}. Nossa equipe vai conferir o pagamento e <strong>entrar em contato com você pelo
            WhatsApp</strong>, no número {formatarTelefone(barbearia.telefone)}. Em até 24 horas.
          </p>
          <p className="suave">
            Na conversa a gente pega as suas fotos, serviços, preços e horários e monta o seu site de verdade.
            Você não precisa fazer mais nada por aqui.
          </p>
          {!pagamento.comprovante && (
            <form action={jaPaguei} className="formulario">
              <input type="hidden" name="id" value={pagamento.id} />
              <label>
                Ainda não mandou o comprovante? <small>(ajuda a liberar mais rápido)</small>
                <CampoFoto name="comprovante" accept="image/*,application/pdf" ladoMaximo={2400} required />
              </label>
              <BotaoEnviar carregando="Enviando…">Enviar comprovante</BotaoEnviar>
            </form>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      {barbearia.emMontagem ? (
        <ol className="passos-compra" aria-label="Etapas">
          <li className="feito">Seus dados</li>
          <li aria-current="step">Pagamento</li>
        </ol>
      ) : ativo && !soVenda() && <p><Link href="/app">← Voltar pro painel</Link></p>}
      <h1>{barbearia.emMontagem ? (bemvindo ? "Último passo: o pagamento" : "Pagamento do seu site") : "Sua assinatura"}</h1>
      {barbearia.emMontagem && ativo ? (
        <aside className="aviso-novo">
          Pague pelo Pix e mande o comprovante aqui embaixo. Depois disso, nossa equipe confere e chama você no WhatsApp
          pra montar o site da {barbearia.nome} com as suas fotos e preços e colocar no ar.
        </aside>
      ) : soVenda() && !barbearia.emMontagem ? (
        // Site de leads: aqui fica só a assinatura (o site é entregue pelo WhatsApp). Atrasar não tira nada do ar por aqui.
        <>
          <aside className={ativo ? "aviso-novo" : "erro"}>
            {ativo
              ? <>✅ Assinatura em dia até <strong>{formatarData(barbearia.acessoAte)}</strong>. Pode pagar a próxima antes: os dias se somam.</>
              : <>Mensalidade atrasada desde <strong>{formatarData(barbearia.acessoAte)}</strong>. Pague pelo Pix aqui embaixo pra ficar em dia.</>}
          </aside>
          <p className="suave">
            O seu site e o painel: o link e a senha vão pelo WhatsApp, no número {formatarTelefone(barbearia.telefone)}.
          </p>
        </>
      ) : barbearia.emMontagem ? (
        <aside className="erro">
          O prazo pra montar o site acabou. Pague pelo Pix pra publicar: nada do que você montou foi apagado.
        </aside>
      ) : ativo ? (
        <p>✅ Acesso liberado até <strong>{formatarData(barbearia.acessoAte)}</strong>. Pode renovar antes: os dias se somam.</p>
      ) : nuncaPagou ? (
        <aside className="aviso-novo">
          Sua conta foi criada. Falta só o pagamento: assim que ele for confirmado, seu site e sua agenda
          ficam no ar e os clientes já podem marcar.
        </aside>
      ) : (
        <aside className="erro">
          🔒 Sua agenda está bloqueada (o acesso venceu em {formatarData(barbearia.acessoAte)}). Seus clientes não conseguem
          agendar até o pagamento ser confirmado.
        </aside>
      )}
      {erro && <p className="erro">{erro}</p>}

      <h2>Pagar com Pix — {reais(pagamento.valorCentavos)} {contratacao ? `(contratação, já inclui os primeiros ${pagamento.dias} dias)` : `por ${pagamento.dias} dias`}</h2>
      {contratacao && (
        <p className="suave">Depois, a mensalidade pra manter o site e a agenda é {reais(banco.plano.valorCentavos)} a cada {banco.plano.dias} dias.</p>
      )}
      {!pixConfigurado ? (
        <p>Pagamento ainda não configurado. Fale com o suporte.</p>
      ) : (
        <div className="pix">
          <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <div>
            <p>1. Abra o app do seu banco e escaneie o QR code, ou use o Pix copia e cola:</p>
            <textarea readOnly value={copiaECola} rows={4} aria-label="Pix copia e cola" />
            <p style={{ marginTop: 8 }}><BotaoCopiar texto={copiaECola} rotulo="Copiar código do Pix" /></p>
            <p>Identificador: <code>{pagamento.txid}</code></p>
            <p>2. Depois de pagar, mande o comprovante aqui. A gente confere em até 24 horas{barbearia.emMontagem ? ", e chama você no WhatsApp" : soVenda() ? "" : ", e você recebe um aviso no celular"}.</p>
            {pagamento.status === "informado" && (
              <p className="atribuicao">
                ⏳ {pagamento.comprovante ? "Recebemos seu comprovante" : "Recebemos seu aviso"}
                {pagamento.pagador ? ` (pagador: ${pagamento.pagador})` : ""}. Aguardando confirmação.
              </p>
            )}
            {!pagamento.comprovante && (
              <form action={jaPaguei} className="formulario">
                <input type="hidden" name="id" value={pagamento.id} />
                <label>
                  Comprovante do Pix <small>(print da tela ou PDF)</small>
                  <CampoFoto name="comprovante" accept="image/*,application/pdf" ladoMaximo={2400} />
                </label>
                {pagamento.status !== "informado" && <input name="pagador" placeholder="Nome de quem pagou (ajuda a conferir)" maxLength={80} />}
                <BotaoEnviar carregando="Enviando…">{pagamento.status === "informado" ? "Enviar comprovante" : "Já paguei"}</BotaoEnviar>
              </form>
            )}
            <p className="suave pequeno">
              {!barbearia.emMontagem && !soVenda() && <>Quer saber na hora? Ligue os avisos no <Link href="/app">painel</Link>.</>}
              {configPix.whatsappAdmin && (
                <>{" "}Problema com o Pix?{" "}
                  <a target="_blank" rel="noopener noreferrer"
                    href={linkWhatsapp(configPix.whatsappAdmin, `Olá! Estou com dúvida no pagamento da ${barbearia.nome} (identificador ${pagamento.txid}).`)}>
                    Fale com a gente no WhatsApp
                  </a>.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {historico.length > 0 && (
        <>
          <h2>Histórico</h2>
          <ul>
            {historico.map((p) => (
              <li key={p.id}>{p.criadoEm.slice(0, 10)} · {reais(p.valorCentavos)} · {ROTULO[p.status]}</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
