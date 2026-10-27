import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { apagarComprovante, ErroAgenda, formatarData, gerarPixCopiaECola, gravarComprovante, MAX_BYTES_COMPROVANTE, prepararComprovante } from "@aprenda/agenda";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { CampoFoto } from "@/componentes/CampoFoto";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { configPix, exigirBarbeiro, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";

export const metadata = { title: "Assinatura", robots: { index: false } };
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

export default async function Assinatura({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { barbearia } = await exigirBarbeiro();
  const { erro } = await searchParams;
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

  return (
    <>
      {ativo && <p><Link href="/app">← Voltar pro painel</Link></p>}
      <h1>{barbearia.emMontagem ? "Publicar meu site" : "Assinatura"}</h1>
      {barbearia.emMontagem && ativo ? (
        <aside className="aviso-novo">
          Pague pelo Pix e mande o comprovante aqui embaixo. Assim que a gente conferir (normalmente no mesmo dia), o site da{" "}
          {barbearia.nome} vai pro ar e os clientes já podem marcar. Até lá você continua montando normalmente.
        </aside>
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
            <p>Identificador: <code>{pagamento.txid}</code></p>
            <p>2. Depois de pagar, mande o comprovante aqui. A gente confere, normalmente no mesmo dia, e você recebe um aviso no celular{barbearia.emMontagem ? " quando o site for pro ar" : ""}.</p>
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
              Quer saber na hora? Ligue os avisos no <Link href="/app">painel</Link>.
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
