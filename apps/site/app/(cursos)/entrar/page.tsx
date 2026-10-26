import { redirect } from "next/navigation";
import { EntrarPeloWhatsapp } from "@/componentes/EntrarPeloWhatsapp";
import { destinoSeguro, membroAtual } from "@/lib/membros";
import { LINK_HORAS } from "@aprenda/membros";

export const metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ voltar?: string; expirado?: string }> }) {
  const { voltar, expirado } = await searchParams;
  const destino = destinoSeguro(voltar);
  if ((await membroAtual())?.verificado) redirect(destino ?? "/minha-area");
  return (
    <div className="caixa-auth entrar">
      {expirado ? (
        <>
          <h1>Esse link venceu</h1>
          <p className="suave">Ele já foi usado ou passou do prazo. Peça outro: é um toque.</p>
        </>
      ) : (
        <>
          <h1>Entre com o seu WhatsApp</h1>
          <p className="suave">Sem senha e sem formulário. É grátis.</p>
        </>
      )}
      <EntrarPeloWhatsapp voltar={destino} texto={expirado ? "Pedir link novo" : "Entrar pelo WhatsApp"} />
      <ol className="passos-entrar">
        <li>O WhatsApp abre com a mensagem pronta. Aperte <strong>enviar</strong>.</li>
        <li>Nosso WhatsApp responde na hora com o seu link.</li>
        <li>Toque no link e pronto: você já está dentro.</li>
      </ol>
      <p className="suave pequeno">
        O link vale {LINK_HORAS} horas e funciona uma vez. Depois de entrar, este aparelho fica conectado; pra entrar
        em outro, é só mandar <strong>entrar</strong> pro mesmo WhatsApp.
      </p>
    </div>
  );
}
