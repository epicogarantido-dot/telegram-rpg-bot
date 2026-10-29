import { soEntrega } from "@/lib/modo";
import Link from "next/link";
import { MONTAGEM_DIAS, planoDoAmbiente } from "@aprenda/agenda";
import { reais } from "@/lib/agenda";
import { contatoResponsavel } from "@/lib/contato";

export const metadata = {
  title: "Termos de uso",
  description: "As regras do site e agenda pra barbearias do Aprenda Livre: preço, pagamento por Pix, cancelamento e responsabilidades.",
};

// Preço vem do .env do servidor.
export const dynamic = "force-dynamic";

/** Termos do sistema das barbearias e do site de cursos. Só o que o sistema faz de verdade. */
export default function Termos() {
  const plano = planoDoAmbiente();
  const adesao = plano.adesaoCentavos || plano.valorCentavos;
  const contato = contatoResponsavel();
  return (
    <article className="texto-legal">
      <h1>Termos de uso</h1>
      <p className="suave">Atualizado em 28 de outubro de 2026.</p>

      {!soEntrega() && (
        <>
          <h2>Cursos e Revista</h2>
          <p>
            São grátis e abertos. Cada curso traduzido mantém a licença e o crédito do original (veja em{" "}
            <Link href="/licencas">Licenças e créditos</Link>). O conteúdo é educativo: preços, leis e regras mudam, então
            confira com seu contador ou com o órgão responsável antes de decidir algo importante.
          </p>
        </>
      )}

      <h2>Site e agenda pra barbearias</h2>
      <h3>O que você recebe</h3>
      <p>
        Um site da sua barbearia, num endereço do Aprenda Livre com o nome dela, onde o cliente vê seus trabalhos e marca
        horário, e um painel pra você cuidar de agenda, fotos, equipe, serviços e preços pelo celular.
      </p>

      <h3>Preço e pagamento</h3>
      <ul>
        <li>{reais(adesao)} na contratação, que já inclui os primeiros {plano.dias} dias.</li>
        <li>Depois, {reais(plano.valorCentavos)} a cada {plano.dias} dias.</li>
        <li>Depois do cadastro, o pedido fica aberto por {MONTAGEM_DIAS} dias esperando o pagamento. Confirmado o Pix, a nossa equipe chama você no WhatsApp pra montar o site com as suas fotos, serviços e preços.</li>
        <li>Pagamento só por Pix. O site vai pro ar em até 24 horas depois que a gente confere o Pix.</li>
        <li>Sem fidelidade e sem multa. Se o pagamento não vier, o painel e o site podem ser pausados até você pagar de novo; nada é apagado nesse tempo.</li>
        <li>Se o preço mudar, avisamos antes, e vale a partir do próximo pagamento.</li>
      </ul>

      <h3>O que é seu e o que é responsabilidade sua</h3>
      <ul>
        <li>Fotos, textos e preços que você publica são seus. Só publique fotos que você tirou ou tem permissão de usar, e de clientes que concordaram em aparecer.</li>
        <li>Os dados dos seus clientes (nome, WhatsApp, horários) são seus: você decide como usar, e deve usar só pra atender e falar com eles sobre a barbearia. Quem pedir pra não receber mensagem, respeite.</li>
        <li>Não use o sistema pra nada ilegal, pra enganar cliente ou pra mandar mensagem em massa.</li>
        <li>Cuide da sua senha. Se perder o acesso, fale com a gente que mandamos um link pra trocar.</li>
      </ul>

      <h3>O que é responsabilidade nossa</h3>
      <ul>
        <li>Manter o site e a agenda no ar e guardar seus dados com cuidado (veja <Link href="/privacidade">Privacidade</Link>).</li>
        <li>Fazer cópias de segurança e corrigir problemas o quanto antes. Mesmo assim, como todo serviço na internet, pode haver interrupções; nesses casos não respondemos por horários que deixaram de ser marcados.</li>
        <li>Não vender nem passar os seus dados ou os dos seus clientes pra ninguém.</li>
      </ul>

      <h3>Cancelar</h3>
      <p>
        É só não renovar. Se quiser que a gente apague a conta, o site, as fotos e os horários, peça{" "}
        {contato
          ? <>pelo WhatsApp <a href={contato.link} target="_blank" rel="noopener noreferrer">{contato.texto}</a></>
          : <>pelo WhatsApp do Aprenda Livre</>}
        . Antes de apagar, você pode pedir uma cópia da sua lista de clientes.
      </p>

      <p className="suave"><Link href="/privacidade">Privacidade</Link>{!soEntrega() && <> · <Link href="/licencas">Licenças e créditos</Link></>}</p>
    </article>
  );
}
