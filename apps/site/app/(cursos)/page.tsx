import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Camera, Clock, MapPin, MessageCircle, Scissors, Smartphone, Users } from "lucide-react";
import { carregarArtigos, carregarCursos } from "@aprenda/catalogo";
import { planoDoAmbiente, TEMAS } from "@aprenda/agenda";
import { reais } from "@/lib/agenda";
import { contatoResponsavel } from "@/lib/contato";
import { Carrossel } from "@/componentes/Carrossel";

/** Feita a cada visita: preço e WhatsApp vêm do .env, que não existe na hora do build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Seu site de barbearia pronto, com agenda online" },
  description: "O cliente vê seus cortes, escolhe o horário e marca sozinho. Seis estilos pra ver no ar antes de pagar. Pix, sem fidelidade.",
  openGraph: {
    title: "Seu site de barbearia pronto, com agenda online",
    description: "O cliente vê seus cortes, escolhe o horário e marca sozinho. Veja os seis estilos no ar.",
    images: [{ url: "/og-venda.jpg", width: 1200, height: 630, alt: "Três sites de barbearia vistos no celular" }],
    type: "website",
  },
};

/** O que vem no site: só o que existe de verdade no produto (sem logo, cor livre nem domínio próprio). */
const NO_SITE = [
  { icone: CalendarCheck, titulo: "Agenda online", texto: "O cliente vê os horários livres e marca sozinho, a qualquer hora." },
  { icone: Camera, titulo: "Suas fotos", texto: "Seus cortes em destaque, com antes e depois de arrastar." },
  { icone: Scissors, titulo: "Seus serviços e preços", texto: "Cada serviço com o tempo, o preço e o que inclui." },
  { icone: Users, titulo: "Sua equipe", texto: "Cada barbeiro com foto; o cliente escolhe com quem corta." },
  { icone: Clock, titulo: "Seus horários", texto: "Dias e horários de funcionamento, folgas e ordem de chegada." },
  { icone: MapPin, titulo: "Mapa", texto: "Onde fica a barbearia, com o caminho no celular." },
  { icone: MessageCircle, titulo: "Botão de WhatsApp", texto: "Pra quem quiser falar com você antes de marcar." },
  { icone: Smartphone, titulo: "Painel no celular", texto: "Aviso a cada horário novo; você muda tudo, quando quiser." },
] as const;

/** Telas reais do sistema (tiradas de um site de teste em public/funcionalidades/), na ordem do uso. */
const TELAS = [
  { arquivo: "agendar-corte", titulo: "O cliente escolhe o corte", texto: "Cada corte com foto e preço. Quem só quer a barba começa em \"Não vou cortar\".", alt: "Tela de escolher o corte no celular" },
  { arquivo: "agendar-adicionais", titulo: "Soma barba e sobrancelha", texto: "Os adicionais entram com um toque, com o tempo e o preço certos.", alt: "Tela de adicionais com barba, cavanhaque, risco e pezinho" },
  { arquivo: "agendar-horario", titulo: "Só horário livre de verdade", texto: "Ele vê os dias e os horários que sobram e marca na hora, sem te chamar.", alt: "Tela de escolher o dia e o horário" },
  { arquivo: "agendado", titulo: "Lembrete no celular dele", texto: "Põe na agenda do celular e, se precisar, troca ou cancela pelo link.", alt: "Tela de horário marcado com o botão de adicionar à agenda" },
  { arquivo: "painel-agenda", titulo: "Sua agenda do dia", texto: "Quem vem, o serviço e a foto do corte que ele escolheu. Confirma no seu WhatsApp com um toque.", alt: "Painel com os horários do dia" },
  { arquivo: "painel-calendario", titulo: "No calendário do seu celular", texto: "Os horários aparecem no iPhone ou no Google, com lembrete antes de cada cliente.", alt: "Tela de ligar a agenda no calendário do celular" },
  { arquivo: "painel-fotos", titulo: "Suas fotos, por tipo de corte", texto: "Degradê, navalhado, barba, antes e depois: você troca pelo celular.", alt: "Painel de fotos do site" },
  { arquivo: "painel-servicos", titulo: "Serviços, tempos e preços", texto: "Cada serviço com o seu tempo e o seu preço. Mudou aqui, mudou no site.", alt: "Painel com os serviços e preços" },
  { arquivo: "painel-estilo", titulo: "Troque o estilo quando quiser", texto: "Seis estilos, sem perder fotos, serviços nem horários.", alt: "Painel de escolher o estilo do site" },
  { arquivo: "painel-whatsapp", titulo: "Resposta automática no WhatsApp", texto: "Quem te chama recebe uma mensagem com o link de agendar. Do próprio WhatsApp Business, grátis.", alt: "Tela com a mensagem pronta pro WhatsApp Business" },
] as const;

const PERGUNTAS = [
  ["Preciso de CNPJ?", "Não. O pagamento é por Pix e pode ser no seu nome."],
  ["Preciso saber mexer em site?", "Não. A gente monta o site com as suas fotos, serviços e preços. Depois, trocar uma foto ou um preço é pelo celular, como num aplicativo."],
  ["Posso trocar de estilo depois?", "Pode, quando quiser, sem perder fotos, serviços nem os horários marcados."],
  ["Como o cliente marca?", "Ele abre o seu link (no Instagram, no Google ou no WhatsApp), escolhe o serviço e o horário livre e põe nome e WhatsApp. Não baixa aplicativo nem cria conta."],
  ["Posso ver antes de pagar?", "Pode. Os seis estilos estão no ar com barbearias de exemplo: abra e marque um horário de teste, como se fosse o seu cliente."],
  ["E se eu quiser parar?", "É só não renovar. Não tem fidelidade nem multa."],
] as const;

/**
 * Página de venda. Na ordem em que o barbeiro pergunta: o que é, como fica (os estilos no ar),
 * como funciona, quanto custa e se dá trabalho. O conteúdo grátis vem depois, como prova de que
 * a gente entende de barbearia.
 */
export default async function Inicio() {
  const plano = planoDoAmbiente();
  const adesao = plano.adesaoCentavos || plano.valorCentavos;
  const contato = contatoResponsavel();
  const whats = (texto: string) => contato && `${contato.link}?text=${encodeURIComponent(texto)}`;
  const cursos = (await carregarCursos()).sort((a, b) => Number(b.tags.includes("barbearia")) - Number(a.tags.includes("barbearia"))).slice(0, 3);
  const artigos = (await carregarArtigos()).slice(0, 3);

  return (
    <div className="vendas">
      <section className="vendas-topo">
        <div className="vendas-topo-texto">
          <h1>Seu site de barbearia pronto, com agenda online</h1>
          <p>
            O cliente vê os seus cortes, escolhe o horário e marca sozinho. No site entram o nome da barbearia,
            as suas fotos, os seus serviços e preços e a sua equipe.
          </p>
          <div className="acoes">
            <a href="#estilos" className="botao" data-evento="estilos">Ver os estilos</a>
            {contato && <a href={whats("Oi! Vi o site de vocês e quero saber do site com agenda pra minha barbearia.")!} className="botao-sec" target="_blank" rel="noopener noreferrer" data-evento="whatsapp" data-detalhe="topo">Falar no WhatsApp</a>}
          </div>
          <p className="vendas-topo-preco">{reais(adesao)} pra começar (com o primeiro mês) e {reais(plano.valorCentavos)} por mês. Pix, sem fidelidade.</p>
          <p className="vendas-topo-cursos">Veio pelos cursos grátis? <Link href="/cursos">Estão aqui</Link>.</p>
        </div>
        <figure className="vendas-topo-celular" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/barbeiros/potencia.webp" alt="" width={390} height={780} fetchPriority="high" />
        </figure>
      </section>

      <section className="vendas-secao" aria-labelledby="no-site-titulo">
        <h2 id="no-site-titulo">O que vem no seu site</h2>
        <ul className="vendas-no-site">
          {NO_SITE.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo}><Icone size={20} aria-hidden /><span><strong>{titulo}</strong>{texto}</span></li>
          ))}
        </ul>
      </section>

      <div className="vendas-secao vendas-carrossel">
        <Carrossel id="estilos" titulo="Escolha o estilo" descricao="Os seis estão no ar com barbearias de exemplo: abra, navegue e marque um horário de teste. No seu, entram as suas fotos e os seus preços.">
          {TEMAS.map((t) => (
            <div key={t.id} className="estilo-slide">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/barbeiros/${t.id}.webp`} alt={`Site no estilo ${t.nome}, visto no celular`} width={390} height={780} loading="lazy" />
              <h3>{t.nome}</h3>
              <span>{t.resumo}</span>
              <div className="vendas-estilo-acoes">
                <a href={`/exemplo/${t.id}`} className="botao-sec" target="_blank" rel="noopener">Ver exemplo</a>
                <a href={`/app/cadastro?estilo=${t.id}`} className="botao" data-evento="quero" data-detalhe={t.id}>Quero esse</a>
              </div>
            </div>
          ))}
        </Carrossel>
      </div>

      <div className="vendas-secao vendas-carrossel">
        <Carrossel titulo="Como funciona por dentro" descricao="Telas de verdade do sistema: o que o seu cliente vê pra marcar e o que você vê no painel, no celular.">
          {TELAS.map((t) => (
            <figure key={t.arquivo} className="estilo-slide">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/funcionalidades/${t.arquivo}.webp`} alt={t.alt} width={390} height={780} loading="lazy" />
              <figcaption><strong>{t.titulo}</strong><span>{t.texto}</span></figcaption>
            </figure>
          ))}
        </Carrossel>
      </div>

      <section className="vendas-secao" aria-labelledby="como-titulo">
        <h2 id="como-titulo">Como funciona</h2>
        <ol className="vendas-passos">
          <li><strong>Escolha o estilo</strong><span>Veja os exemplos no ar e toque em &quot;Quero esse&quot;.</span></li>
          <li><strong>Faça o pedido e pague pelo Pix</strong><span>Nome da barbearia, WhatsApp e e-mail. Leva uns 2 minutos.</span></li>
          <li><strong>A gente monta e te manda o link</strong><span>Chamamos você no WhatsApp, pegamos as fotos, os serviços e os preços e entregamos o site no ar, normalmente no mesmo dia. Depois você muda o que quiser pelo celular.</span></li>
        </ol>
      </section>

      <section id="preco" className="vendas-secao vendas-preco" aria-labelledby="preco-titulo">
        <h2 id="preco-titulo">Quanto custa</h2>
        <div className="vendas-valores">
          <p><strong>{reais(adesao)}</strong> pra começar, já com o primeiro mês</p>
          <p><strong>{reais(plano.valorCentavos)}</strong> por mês depois</p>
        </div>
        <ul>
          <li>Site, agenda online e painel no celular.</li>
          <li>Barbeiros e agendamentos ilimitados.</li>
          <li>A gente monta o site com você: não precisa saber mexer.</li>
          <li>Pagamento por Pix, sem cartão. Pra cancelar, é só não renovar: sem fidelidade e sem multa.</li>
        </ul>
        <div className="acoes">
          <a href="/app/cadastro" className="botao" data-evento="quero">Quero o meu site</a>
          {contato && <a href={whats("Oi! Quero tirar uma dúvida sobre o site com agenda pra minha barbearia.")!} className="botao-sec" target="_blank" rel="noopener noreferrer" data-evento="whatsapp" data-detalhe="preco">Tirar dúvida no WhatsApp</a>}
        </div>
      </section>

      <section className="vendas-secao" aria-labelledby="perguntas-titulo">
        <h2 id="perguntas-titulo">Perguntas</h2>
        <div className="vendas-perguntas">
          {PERGUNTAS.map(([p, r]) => (
            <details key={p}>
              <summary>{p}</summary>
              <p>{r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="vendas-secao vendas-conteudo" aria-labelledby="conteudo-titulo">
        <h2 id="conteudo-titulo">Conteúdo grátis pra quem tem barbearia</h2>
        <p className="vendas-intro">Cursos e matérias sobre preço, cliente que volta e divulgação. Aberto, sem cadastro.</p>
        <div className="vendas-conteudo-grade">
          <div>
            <h3>Cursos</h3>
            <ul>{cursos.map((c) => <li key={c.slug}><Link href={`/cursos/${c.slug}`}><strong>{c.titulo}</strong><span>{c.resumo}</span></Link></li>)}</ul>
            <Link href="/cursos" className="vendas-ver-todos">Ver todos os cursos</Link>
          </div>
          <div>
            <h3>Revista</h3>
            <ul>{artigos.map((a) => <li key={a.slug}><Link href={`/revista/${a.slug}`}><strong>{a.titulo}</strong><span>{a.resumo}</span></Link></li>)}</ul>
            <Link href="/revista" className="vendas-ver-todos">Ver todas as matérias</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
