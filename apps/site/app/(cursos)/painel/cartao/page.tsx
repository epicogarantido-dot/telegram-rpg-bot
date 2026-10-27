import QRCode from "qrcode";
import { exigirLogin } from "@/lib/painel";
import { urlDoSite } from "@/lib/membros";
import { BotaoImprimir } from "@/componentes/BotaoImprimir";

export const metadata = { title: "Cartão pra visitas", robots: { index: false } };
export const dynamic = "force-dynamic";

const POR_FOLHA = 10;

/**
 * Cartão de visita com QR code pro site (cursos grátis e o site da barbearia), pra deixar na
 * barbearia quando a visita é em pessoa. O QR abre a página inicial: tudo aberto, sem cadastro.
 * Folha A4 com 10 cartões de 9 × 5 cm.
 */
export default async function Cartao() {
  await exigirLogin();
  const link = `${urlDoSite()}/?origem=cartao`;
  const qr = await QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  return (
    <>
      <div className="so-tela">
        <p><a href="/painel">Leads</a> · <strong>Cartão pra visitas</strong></p>
        <h1>Cartão pra visitas</h1>
        <p>
          Imprima em papel mais grosso (180 g ou mais), em 100% do tamanho, e corte nas linhas.
          O QR abre o site: os cursos grátis e o site com agenda pra barbearia, sem cadastro. Confira se o SITE_URL do app está certo antes de imprimir.
        </p>
        <BotaoImprimir />
      </div>
      <div className="folha-cartoes">
        {Array.from({ length: POR_FOLHA }, (_, i) => (
          <div key={i} className="cartao-visita">
            <div className="cartao-visita-texto">
              <strong>Aprenda Livre</strong>
              <span>Cursos grátis pra quem tem barbearia</span>
              <small>Preço e lucro, cliente que volta, dinheiro em ordem.</small>
              <small>Aponte a câmera do celular.</small>
            </div>
            <div className="cartao-visita-qr" role="img" aria-label="QR code do site do Aprenda Livre" dangerouslySetInnerHTML={{ __html: qr }} />
          </div>
        ))}
      </div>
    </>
  );
}
