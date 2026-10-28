import { exigirAcessoAtivo, obterAgenda } from "@/lib/agenda";
import { BotaoCopiar } from "@/componentes/BotaoCopiar";

export const metadata = { title: "WhatsApp Business", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Textos prontos pra ligar o WhatsApp Business no site: o WhatsApp conversa, o site agenda.
 * Não é integração por API (o sistema não manda mensagem sozinho): o barbeiro copia e cola
 * nas ferramentas do próprio app (saudação, ausência, resposta rápida, perfil, IA da Meta).
 */
export default async function WhatsappBusiness() {
  const { barbearia } = await exigirAcessoAtivo();
  const b = obterAgenda().barbeariaPorId(barbearia.id)!;
  const site = `${process.env.SITE_URL ?? ""}/b/${b.slug}`;
  const agendar = `${site}/agendar`;

  const textos = [
    {
      id: "saudacao", onde: "Mensagem de saudação",
      caminho: "WhatsApp Business → Ferramentas comerciais → Mensagem de saudação",
      dica: "Vai sozinha pra quem te chama pela primeira vez (ou depois de 14 dias sem conversa).",
      texto: `Oi! Aqui é da ${b.nome} 💈\nPra marcar seu horário, escolha o corte e o horário livre por aqui, leva menos de um minuto:\n${agendar}\n\nSe preferir, é só mandar sua dúvida que eu respondo assim que sair da cadeira.`,
    },
    {
      id: "ausencia", onde: "Mensagem de ausência",
      caminho: "WhatsApp Business → Ferramentas comerciais → Mensagem de ausência",
      dica: "Pra fora do horário de atendimento: o cliente marca mesmo com a barbearia fechada.",
      texto: `Oi! A ${b.nome} está fechada agora, mas a agenda não fecha: escolha seu horário aqui e já fica marcado:\n${agendar}`,
    },
    {
      id: "rapida", onde: "Resposta rápida \"/agendar\"",
      caminho: "WhatsApp Business → Ferramentas comerciais → Respostas rápidas → atalho: agendar",
      dica: "No meio da conversa, digite / e escolha \"agendar\": o texto entra pronto.",
      texto: `Pra garantir seu horário, escolhe por aqui que já fica marcado no meu sistema, com lembrete no seu celular: ${agendar}`,
    },
    {
      id: "ia", onde: "Instruções pro atendente de IA da Meta",
      caminho: "WhatsApp Business → Meta Business Agent (se você usa) → informações da empresa",
      dica: "A IA conversa e manda o link; quem marca de verdade é o site, só em horário livre.",
      texto: `Quando o cliente quiser marcar, remarcar ou saber os horários livres, mande este link, que mostra os horários de verdade e marca na hora: ${agendar}\nNão combine horário pela conversa. Preços, serviços e fotos dos cortes estão no site: ${site}`,
    },
    {
      id: "perfil", onde: "Site do perfil",
      caminho: "WhatsApp Business → Configurações → Perfil comercial → Site",
      dica: "Aparece no seu perfil pra todo mundo que abre a conversa. Use o mesmo na bio do Instagram.",
      texto: site,
    },
  ];

  return (
    <>
      <div className="painel-ola">
        <div>
          <h1>WhatsApp Business</h1>
          <p className="frase">O WhatsApp conversa. O seu site agenda.</p>
        </div>
      </div>
      <p className="suave">
        Copie cada texto e cole no lugar indicado do seu WhatsApp Business. Assim todo mundo que te chama
        recebe o link certo, e o horário é marcado no site, sem conflito e com lembrete pro cliente.
        Nada é enviado sozinho pelo sistema: é o seu próprio WhatsApp que manda.
      </p>
      <div className="textos-whats">
        {textos.map((t) => (
          <section key={t.id} className="conta-bloco texto-whats" aria-labelledby={`tw-${t.id}`}>
            <h2 id={`tw-${t.id}`}>{t.onde}</h2>
            <p className="suave pequeno">{t.caminho}</p>
            <pre>{t.texto}</pre>
            <p className="suave pequeno">{t.dica}</p>
            <BotaoCopiar texto={t.texto} rotulo="Copiar texto" />
          </section>
        ))}
      </div>
    </>
  );
}
