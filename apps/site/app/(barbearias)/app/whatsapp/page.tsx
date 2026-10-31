import { exigirDono, obterAgenda } from "@/lib/agenda";
import { BotaoCopiar } from "@/componentes/BotaoCopiar";
import { linkPublico } from "@/lib/barbearias";

export const metadata = { title: "WhatsApp Business", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Resposta automática sem robô: a "Mensagem de saudação" do próprio WhatsApp Business (grátis)
 * manda UMA mensagem com o link de agendar pra quem chama; se a conversa continua, não repete
 * (só volta pra quem ficar 14 dias sem conversar). O sistema não manda nada: o barbeiro cola o
 * texto no app dele. Nada de mensagem de ausência nem atendente de IA, que mandam mais mensagens.
 */
export default async function WhatsappBusiness() {
  const { barbearia } = await exigirDono();
  const b = obterAgenda().barbeariaPorId(barbearia.id)!;
  const site = linkPublico(b);
  const agendar = linkPublico(b, "/agendar");
  const saudacao = `Oi! Aqui é da ${b.nome} 💈\nPra ver os horários disponíveis e agendar, é por aqui:\n${agendar}\n\nVocê escolhe o serviço e o horário, e já fica marcado.`;
  const rapida = `Pra ver os horários disponíveis e agendar, é por aqui: ${agendar}`;

  return (
    <>
      <div className="painel-ola">
        <div>
          <h1>WhatsApp Business</h1>
          <p className="frase">Uma mensagem automática com o link de agendar.</p>
        </div>
      </div>

      <section className="conta-bloco texto-whats" aria-labelledby="tw-saudacao">
        <h2 id="tw-saudacao">Mensagem automática (saudação)</h2>
        <p className="suave">
          Quem te chama no WhatsApp recebe na hora esta mensagem, com o link pra ver os horários livres e agendar.
          Vai <strong>uma vez só</strong>: se a conversa continuar, o WhatsApp não manda de novo (ela só volta pra quem
          ficar 14 dias sem te chamar). É do próprio WhatsApp Business: grátis, sem robô e sem risco pro seu número.
        </p>
        <pre>{saudacao}</pre>
        <BotaoCopiar texto={saudacao} rotulo="Copiar mensagem" />
        <h3>Como ligar (uma vez, no celular)</h3>
        <ol className="passos-whats">
          <li>Copie a mensagem acima.</li>
          <li>Abra o WhatsApp Business e entre em <strong>Ferramentas comerciais</strong> (no Android, pelo menu ⋮; no iPhone, em Configurações; nas versões novas, na aba Ferramentas).</li>
          <li>Toque em <strong>Mensagem de saudação</strong> e ligue <strong>Enviar mensagem de saudação</strong>.</li>
          <li>Toque no lápis, apague o texto que vem pronto e cole o seu.</li>
          <li>Em <strong>Destinatários</strong>, escolha <strong>Todos</strong> e toque em <strong>Salvar</strong>.</li>
        </ol>
        <p className="suave pequeno">
          Só funciona pelo app no celular (não pelo WhatsApp Web) e o celular precisa estar com internet.
          Deixe a &quot;Mensagem de ausência&quot; desligada: ela manda outra mensagem automática.
        </p>
      </section>

      <div className="textos-whats">
        <section className="conta-bloco texto-whats" aria-labelledby="tw-rapida">
          <h2 id="tw-rapida">Resposta rápida &quot;/agendar&quot; (opcional)</h2>
          <p className="suave pequeno">Ferramentas comerciais → Respostas rápidas → + → atalho: agendar</p>
          <pre>{rapida}</pre>
          <p className="suave pequeno">Não é automática: no meio da conversa, quando você quiser, digite / e escolha &quot;agendar&quot;.</p>
          <BotaoCopiar texto={rapida} rotulo="Copiar texto" />
        </section>
        <section className="conta-bloco texto-whats" aria-labelledby="tw-perfil">
          <h2 id="tw-perfil">Link no perfil (opcional)</h2>
          <p className="suave pequeno">Ferramentas comerciais → Perfil da empresa → campo Site</p>
          <pre>{site}</pre>
          <p className="suave pequeno">Aparece no seu perfil pra todo mundo que abre a conversa. Use o mesmo na bio do Instagram.</p>
          <BotaoCopiar texto={site} rotulo="Copiar link" />
        </section>
      </div>
    </>
  );
}
