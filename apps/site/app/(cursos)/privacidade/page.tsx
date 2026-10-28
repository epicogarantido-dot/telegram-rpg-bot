import { soEntrega } from "@/lib/modo";
import Link from "next/link";
import { contatoResponsavel } from "@/lib/contato";

// O SaaS e o site de leads mostram coisas diferentes (MODO_SITE só existe no servidor rodando).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacidade",
  description: "Quais dados o Aprenda Livre guarda, pra quê, por quanto tempo e como pedir pra ver ou apagar.",
};

/**
 * Política de privacidade (LGPD). Só diz o que o sistema faz de verdade: se mudar o que é
 * guardado (tabela nova com dado pessoal, serviço de fora), atualize esta página e a data.
 */
export default function Privacidade() {
  const contato = contatoResponsavel();
  return (
    <article className="texto-legal">
      <h1>Privacidade</h1>
      <p className="suave">Atualizado em 28 de outubro de 2026.</p>

      <p>
        Esta página explica, em português simples, quais dados o Aprenda Livre guarda, pra quê, e o que você pode
        pedir. Vale pro site de cursos e Revista, e pro sistema de site e agenda das barbearias.
      </p>

      <h2>Cursos e Revista</h2>
      <p>
        Você lê tudo sem cadastro. Não usamos ferramenta de anúncio nem de rastreamento de terceiros. Contamos, de forma
        agregada, quantas visitas chegam por cada link que divulgamos (por exemplo, &quot;veio do grupo&quot;): só o
        número, sem guardar quem você é, seu IP ou cookie de rastreio.
      </p>

      <h2>Comunidade de barbeiros</h2>
      <p>
        Se você se inscreve na comunidade, guardamos nome, WhatsApp e, se informar, o nome do negócio e a cidade, com a sua
        autorização. Usamos só pra mandar o convite e novidades do projeto. Pra sair, responda SAIR: o número entra numa
        lista de bloqueio e não recebe mais nada.
      </p>

      <h2>Contato com barbearias</h2>
      <p>
        Pra oferecer o sistema, uma pessoa da nossa equipe pode mandar uma mensagem pro número comercial de uma barbearia,
        achado em dados públicos (cadastro de CNPJ da Receita Federal, perfil público ou indicação). Toda mensagem diz
        quem está falando e como sair. Quem responde SAIR nunca mais é procurado.
      </p>

      <h2>Sistema de site e agenda (barbearias)</h2>
      <ul>
        <li><strong>Conta do barbeiro:</strong> nome, e-mail, WhatsApp e senha (guardada só como código embaralhado, ninguém consegue ler).</li>
        <li><strong>Site da barbearia:</strong> o que o barbeiro publica (nome, endereço, fotos, equipe, serviços e preços). Fotos enviadas têm a localização e outros dados escondidos do arquivo apagados antes de ir pro ar.</li>
        <li><strong>Pagamentos:</strong> valor, data, o nome de quem pagou o Pix e, se o barbeiro mandar, o comprovante (imagem ou PDF), pra confirmar a mensalidade. Só o administrador vê o comprovante.</li>
      </ul>

      <h2>Se você marcou horário numa barbearia</h2>
      <p>
        Quando você agenda pelo site de uma barbearia, guardamos seu nome, WhatsApp, o horário e o serviço, e o endereço
        se o atendimento for na sua casa. Esses dados são <strong>da barbearia</strong>: ela decide o que fazer com eles
        (confirmar o horário, lembrar, chamar de volta), e nós só guardamos pra ela. Pra ver, corrigir ou apagar,
        fale com a barbearia. Se ela não resolver, fale com a gente (abaixo).
      </p>
      <p>
        Pra evitar trote, o sistema conta quantos horários cada número e cada aparelho marcam. O aparelho e o IP são
        guardados só como código embaralhado, que não dá pra transformar de volta.
      </p>
      <p>
        A página de cada barbearia mostra onde ela fica com um mapa do Google Maps. O mapa é carregado do Google quando
        você chega nessa parte da página, e o Google trata essa visita pela política de privacidade dele. Nós não
        mandamos nenhum dado seu pro mapa: só o endereço da barbearia.
      </p>

      <h2>Com quem os dados ficam</h2>
      <p>
        Os dados ficam no nosso servidor, contratado da Square Cloud, que passa o tráfego pela Cloudflare. Não vendemos
        nem passamos dados pra ninguém. Avisos no celular do barbeiro passam pelo serviço de notificação do navegador
        dele (Google, Apple ou Mozilla), só com o texto do aviso.
      </p>

      <h2>Por quanto tempo</h2>
      <p>
        Enquanto a conta da barbearia existir. Se o barbeiro cancelar e pedir, apagamos a conta, o site e os horários. A
        lista de quem pediu SAIR fica guardada pra sempre, justamente pra nunca mais mandar mensagem pra esse número.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir pra saber quais dados seus temos, corrigir,
        apagar ou deixar de receber mensagens. {contato
          ? <>Fale com a gente pelo WhatsApp <a href={contato.link} target="_blank" rel="noopener noreferrer">{contato.texto}</a>.</>
          : <>Fale com a gente pelo WhatsApp do Aprenda Livre.</>}{" "}
        Respondemos em até 15 dias.
      </p>

      <p className="suave"><Link href="/termos">Termos de uso</Link>{!soEntrega() && <> · <Link href="/licencas">Licenças e créditos</Link></>}</p>
    </article>
  );
}
