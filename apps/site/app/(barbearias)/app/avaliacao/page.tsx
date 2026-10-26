import Link from "next/link";
import QRCode from "qrcode";
import { exigirAcessoAtivo, obterAgenda } from "@/lib/agenda";
import { BotaoImprimir } from "@/componentes/BotaoImprimir";

export const metadata = { title: "Cartão de avaliação", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Plaquinha pro balcão com QR da página de avaliação no Google. Sem brinde: o Google proíbe. */
export default async function Avaliacao() {
  const { barbearia } = await exigirAcessoAtivo();
  const b = obterAgenda().barbeariaPorId(barbearia.id)!;
  if (!b.linkAvaliacao) {
    return (
      <>
        <p><Link href="/app">← Voltar pra agenda</Link></p>
        <h1>Cartão de avaliação</h1>
        <p>Primeiro cole o link da sua página de avaliação do Google em <Link href="/app/config#depois">Configurações</Link>.</p>
      </>
    );
  }
  const qr = await QRCode.toString(b.linkAvaliacao, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  return (
    <>
      <div className="so-tela">
        <p><Link href="/app/config#depois">← Voltar</Link></p>
        <h1>Cartão de avaliação</h1>
        <p>Imprima e deixe no balcão ou no espelho. O cliente aponta a câmera e cai direto na sua página de avaliação do Google.</p>
        <BotaoImprimir />
      </div>
      <div className="placa-avaliacao">
        <p className="placa-nome">{b.nome}</p>
        <p className="placa-pedido">Gostou do atendimento?</p>
        <div className="placa-qr" role="img" aria-label="QR code da página de avaliação no Google" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="placa-dica">Aponte a câmera e deixe sua avaliação no Google.<br />Obrigado!</p>
      </div>
    </>
  );
}
