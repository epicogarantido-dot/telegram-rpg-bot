import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { formatarData, gerarPixCopiaECola } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { configPix, exigirBarbeiro, mensagemDeErro, obterAgenda, reais } from "../../../lib/agenda";

export const metadata = { title: "Assinatura", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROTULO = { aberto: "aguardando pagamento", informado: "aguardando confirmação", confirmado: "confirmado", recusado: "recusado" };

async function jaPaguei(form: FormData) {
  "use server";
  const { barbearia } = await exigirBarbeiro();
  try {
    obterAgenda().informarPagamento(barbearia.id, Number(form.get("id")), String(form.get("pagador") ?? ""));
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
  const historico = banco.pagamentosDaBarbearia(barbearia.id).filter((p) => p.id !== pagamento.id);
  const pixConfigurado = !!(configPix.chave && configPix.nome && configPix.cidade);
  const copiaECola = pixConfigurado
    ? gerarPixCopiaECola({ ...configPix, valorCentavos: pagamento.valorCentavos, txid: pagamento.txid, descricao: `Agenda ${barbearia.nome}` })
    : "";
  const qr = copiaECola ? await QRCode.toString(copiaECola, { type: "svg", margin: 1, width: 240 }) : "";

  return (
    <>
      {ativo && <p><Link href="/app">← Voltar pra agenda</Link></p>}
      <h1>Assinatura</h1>
      {ativo ? (
        <p>✅ Acesso liberado até <strong>{formatarData(barbearia.acessoAte)}</strong>. Pode renovar antes: os dias se somam.</p>
      ) : (
        <aside className="erro">
          🔒 Sua agenda está bloqueada (o acesso venceu em {formatarData(barbearia.acessoAte)}). Seus clientes não conseguem
          agendar até o pagamento ser confirmado.
        </aside>
      )}
      {erro && <p className="erro">{erro}</p>}

      <h2>Pagar com Pix — {reais(pagamento.valorCentavos)} por {pagamento.dias} dias</h2>
      {!pixConfigurado ? (
        <p>Pagamento ainda não configurado. Fale com o suporte.</p>
      ) : (
        <div className="pix">
          <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <div>
            <p>1. Abra o app do seu banco e escaneie o QR code, ou use o Pix copia e cola:</p>
            <textarea readOnly value={copiaECola} rows={4} aria-label="Pix copia e cola" />
            <p>Identificador: <code>{pagamento.txid}</code></p>
            <p>2. Depois de pagar, avise aqui. A liberação é feita após conferência, normalmente no mesmo dia.</p>
            {pagamento.status === "informado" ? (
              <p className="atribuicao">⏳ Recebemos seu aviso{pagamento.pagador ? ` (pagador: ${pagamento.pagador})` : ""}. Aguardando confirmação.</p>
            ) : (
              <form action={jaPaguei} className="formulario">
                <input type="hidden" name="id" value={pagamento.id} />
                <input name="pagador" placeholder="Nome de quem pagou (ajuda a conferir)" maxLength={80} />
                <button>Já paguei</button>
              </form>
            )}
            {configPix.whatsappAdmin && (
              <p>
                <a target="_blank" rel="noopener noreferrer"
                  href={linkWhatsapp(configPix.whatsappAdmin, `Olá! Paguei a assinatura da ${barbearia.nome} (identificador ${pagamento.txid}). Segue o comprovante:`)}>
                  Enviar comprovante pelo WhatsApp
                </a>
              </p>
            )}
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
