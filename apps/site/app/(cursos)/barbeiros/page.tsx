import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, BellRing, CalendarCheck, Camera, Link2, Palette, Repeat, Scissors, ShieldCheck, Smartphone, Store, Users } from "lucide-react";
import { planoDoAmbiente, TEMAS } from "@aprenda/agenda";
import { carregarArtigos, carregarCursos } from "@aprenda/catalogo";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { obterBanco } from "@/lib/painel";
import { reais } from "@/lib/agenda";
import { Carrossel } from "@/componentes/Carrossel";
import { sitesDeExemplo } from "@/lib/exemplos";

export const metadata = {
  title: "Site e agenda online para barbearias",
  description: "Seu cliente vê seus cortes, vê os horários livres e marca sozinho. Seis estilos de site, avisos no celular, ordem de chegada. Pagamento por Pix, sem cartão.",
};

async function inscrever(form: FormData) {
  "use server";
  const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
  const nome = String(form.get("nome") ?? "").trim();
  if (!telefone || !nome || form.get("consentimento") !== "sim") redirect("/barbeiros?erro=1#comunidade");
  obterBanco().inscrever({
    nome: nome.slice(0, 100),
    telefone,
    negocio: String(form.get("negocio") ?? "").slice(0, 100) || undefined,
    cidade: String(form.get("cidade") ?? "").slice(0, 100) || undefined,
    interesse: "comunidade",
  });
  redirect("/barbeiros/obrigado");
}

/** O que o sistema faz, em grupos que o barbeiro reconhece no dia a dia. */
const RECURSOS = [
  {
    icone: CalendarCheck, titulo: "O cliente marca sozinho",
    itens: [
      "Escolhe o serviço, vê os horários livres e marca em 3 toques, a qualquer hora.",
      "Junto com o corte, o cliente já soma barba, sobrancelha ou o que você oferecer: tempo e preço certos.",
      "\"Qualquer barbeiro\" mostra todas as vagas da equipe de uma vez.",
      "Recebe um link pra pôr na agenda do celular, trocar o horário ou cancelar sem te ligar.",
    ],
  },
  {
    icone: BellRing, titulo: "Você fica sabendo na hora",
    itens: [
      "Aviso no celular a cada horário novo, com botão pra confirmar com o cliente no seu WhatsApp.",
      "Sua agenda aparece no calendário do iPhone ou do Google, com lembrete antes de cada cliente.",
      "Aviso quando o cliente remarca ou cancela; o horário volta a ficar livre no site.",
    ],
  },
  {
    icone: Repeat, titulo: "O cliente volta",
    itens: [
      "Terminou o corte? Um toque marca o próximo, já na data certa pro ritmo daquele cliente.",
      "Na véspera, a lista de amanhã com o lembrete pronto pra mandar do seu WhatsApp.",
      "Quem passou da hora de voltar aparece em \"Clientes que sumiram\", com a mensagem pronta.",
      "Pedido de avaliação no Google com um toque, e uma placa com QR pra pôr no balcão.",
    ],
  },
  {
    icone: BarChart3, titulo: "Os números do mês",
    itens: [
      "Atendidos, faltas, quanto entrou e quanto se perdeu em falta, e quantos clientes voltaram.",
      "Divisão por profissional: diga com quantos % cada um fica e o sistema faz a conta.",
      "Plano mensal: anote quem paga por mês e veja quantos cortes já usou.",
    ],
  },
  {
    icone: Users, titulo: "Do seu jeito",
    itens: [
      "Atende por ordem de chegada? O site mostra se está aberto e o tamanho da fila.",
      "Cada serviço com o seu tempo (corte, barba, combo) e uma folga entre clientes pra atraso não empurrar o dia.",
      "Folga em parte do dia, \"fechar hoje\", preços visíveis ou não.",
      "Serviços com descrição, e o cliente pode mostrar o corte que quer escolhendo nas suas fotos.",
      "Vai até o cliente? Marque o serviço como domicílio e o site pede o endereço.",
      "Serviços, preços e equipe você muda pelo celular, quando quiser.",
    ],
  },
  {
    icone: ShieldCheck, titulo: "Protegido contra trote",
    itens: [
      "Limites por número e por aparelho seguram quem tenta encher sua agenda.",
      "Bloqueie um número com um toque: os horários dele são cancelados.",
    ],
  },
] as const;

/**
 * O que é do barbeiro no site: tudo aqui existe de verdade no painel (/app/site, /app/fotos,
 * /app/config). Não prometer o que não existe (logo próprio, cor livre, domínio próprio).
 */
const SUA_MARCA = [
  {
    icone: Camera, titulo: "Suas fotos, seu portfólio",
    texto: "Até 80 fotos dos seus trabalhos, separadas em degradê, navalhado, barba, infantil, ambiente e equipe. Você escolhe a foto de capa e mostra antes e depois lado a lado.",
  },
  {
    icone: Store, titulo: "Seu nome, sua história",
    texto: "O nome da barbearia em destaque, a sua frase de apresentação, a cidade, os anos de casa, o seu Instagram e a oferta que você quiser mostrar.",
  },
  {
    icone: Users, titulo: "Sua equipe",
    texto: "Cada barbeiro com foto e especialidade. O cliente vê quem é quem e escolhe com quem quer cortar.",
  },
  {
    icone: Scissors, titulo: "Seus serviços, seus preços",
    texto: "Cada serviço com o seu tempo, o seu preço e o que inclui. Barba e sobrancelha como adicionais. Preço à mostra ou só na hora: você decide.",
  },
  {
    icone: Palette, titulo: "O estilo da sua marca",
    texto: "Seis estilos, do clássico ao ousado. Escolha o que combina com a sua barbearia e troque quando quiser, sem perder nenhuma foto.",
  },
  {
    icone: Link2, titulo: "Um endereço só seu",
    texto: "Um link com o nome da sua barbearia pra pôr na bio do Instagram, no Google e no WhatsApp. É ali que o cliente vê seu trabalho e marca.",
  },
] as const;

const PERGUNTAS = [
  ["Vai ficar igual ao site de outra barbearia?", "Não. O estilo é só a moldura: o que aparece são as suas fotos, o seu nome, a sua equipe e os seus preços. Duas barbearias no mesmo estilo ficam tão diferentes quanto o trabalho de cada uma."],
  ["Preciso de computador?", "Não. Tudo funciona no celular: o site, o painel e os avisos. No iPhone, é só adicionar o painel à tela de início."],
  ["Posso ver como fica antes de pagar?", "Pode. Diga o nome da barbearia e escolha o estilo: o site abre pronto na hora, sem cadastro. Se gostar, você cria o acesso, troca as fotos pelas suas e confere tudo. Só paga quando quiser publicar."],
  ["Precisa de cartão de crédito?", "Não. O pagamento é por Pix. Sem fidelidade: se não renovar, o site pausa até você voltar."],
  ["Meus clientes precisam baixar aplicativo?", "Não. Eles abrem o seu link (do Instagram, do Google ou do WhatsApp) e marcam pelo navegador."],
  ["E se o cliente não aparecer?", "Ele recebe o horário com lembrete no celular dele e pode remarcar sozinho pelo link. Na véspera, o painel lista quem vem amanhã pra você lembrar pelo WhatsApp. Quem falta fica marcado, entra nos números do mês, e quem marca e some você pode bloquear."],
  ["O sistema manda mensagem pros meus clientes?", "Não. Ele prepara a mensagem e abre o SEU WhatsApp; quem envia é você. Assim seu número não corre risco e o cliente fala com quem conhece."],
  ["Posso trocar o estilo depois?", "Pode, quando quiser, sem perder fotos, serviços nem agendamentos."],
] as const;

export default async function Barbeiros({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const plano = planoDoAmbiente();
  // Sem contratação configurada, o primeiro pagamento é a própria mensalidade.
  const adesao = plano.adesaoCentavos || plano.valorCentavos;
  const cursos = (await carregarCursos()).filter((c) => c.tags.includes("barbearia"));
  const artigos = (await carregarArtigos()).slice(0, 3);
  const exemplos = sitesDeExemplo();

  return (
    <div className="venda">
      <section className="venda-heroi">
        <div className="venda-heroi-texto">
          <h1>Um site com a cara da sua barbearia.</h1>
          <p>
            Não é modelo com o nome trocado: são as suas fotos, o seu nome, a sua equipe e os seus preços,
            no estilo da sua marca. E o cliente vê os horários livres e marca sozinho.
          </p>
          <div className="acoes">
            <Link href="/montar" className="botao">Ver o meu site pronto <ArrowRight size={18} aria-hidden /></Link>
            <a href="#estilos" className="botao-sec">Ver os estilos</a>
          </div>
        </div>
        <figure className="venda-celular" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/barbeiros/potencia.webp" alt="" width={390} height={780} />
        </figure>
      </section>

      <Carrossel id="estilos" titulo="Escolha a cara da sua barbearia" descricao="Escolha o que combina com a sua marca. Nas fotos estão barbearias de exemplo: no seu, entram o seu nome, os seus trabalhos e os seus serviços.">
        {TEMAS.map((t) => {
          const conteudo = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/barbeiros/${t.id}.webp`} alt={`Site no estilo ${t.nome}, visto no celular`} width={390} height={780} loading="lazy" />
              <span className="estilo-slide-legenda">
                <strong>{t.nome}</strong><span>{t.resumo}</span>
                {exemplos[t.id] && <span className="estilo-slide-vivo">Abrir o exemplo no ar</span>}
              </span>
            </>
          );
          // Com o exemplo no ar, o slide abre o site de verdade (dá pra navegar e testar a marcação).
          return exemplos[t.id]
            ? <a key={t.id} href={`/b/${exemplos[t.id]}`} className="estilo-slide" target="_blank" rel="noopener">{conteudo}</a>
            : <div key={t.id} className="estilo-slide">{conteudo}</div>;
        })}
      </Carrossel>

      <section className="venda-recursos venda-marca" aria-labelledby="marca-titulo">
        <h2 id="marca-titulo">Não é um site padrão. É a sua marca.</h2>
        <p className="venda-marca-intro">
          Quem abre o seu link vê a sua barbearia, do jeito que você quer apresentar: o seu trabalho na frente,
          o seu nome em cima. E é tudo seu pra mudar, pelo celular, a hora que quiser. Fez um corte bonito
          hoje? Em um minuto ele está no site.
        </p>
        <div className="venda-recursos-grade">
          {SUA_MARCA.map(({ icone: Icone, titulo, texto }) => (
            <div key={titulo} className="venda-recurso">
              <h3><Icone size={20} aria-hidden /> {titulo}</h3>
              <p>{texto}</p>
            </div>
          ))}
        </div>
        <p className="venda-marca-acao">
          <Link href="/montar" className="botao">Montar o meu site <ArrowRight size={18} aria-hidden /></Link>
        </p>
      </section>

      <section className="venda-recursos" aria-labelledby="recursos-titulo">
        <h2 id="recursos-titulo">O que muda no seu dia</h2>
        <div className="venda-recursos-grade">
          {RECURSOS.map(({ icone: Icone, titulo, itens }) => (
            <div key={titulo} className="venda-recurso">
              <h3><Icone size={20} aria-hidden /> {titulo}</h3>
              <ul>{itens.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {cursos.length > 0 && (
        <section className="venda-cursos" aria-labelledby="cursos-titulo">
          <h2 id="cursos-titulo">Cursos grátis pra quem tem barbearia</h2>
          <p className="suave">Preço, atendimento, equipe, divulgação e o seu dinheiro, em lições curtas pra ler no intervalo.</p>
          <ul>
            {cursos.map((c) => (
              <li key={c.slug}>
                <Link href={`/cursos/${c.slug}`}>
                  <strong>{c.titulo}</strong>
                  <span>{c.resumo}</span>
                  <small>{c.modulos.reduce((n, m) => n + m.licoes.length, 0)} lições · {c.area}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {artigos.length > 0 && (
        <section className="venda-cursos" aria-labelledby="revista-titulo">
          <h2 id="revista-titulo">Da revista</h2>
          <p className="suave">O que acontece no mercado e como trabalham as barbearias de outros países. <Link href="/revista">Ver tudo</Link></p>
          <ul>
            {artigos.map((a) => (
              <li key={a.slug}>
                <Link href={`/revista/${a.slug}`}>
                  <strong>{a.titulo}</strong>
                  <span>{a.resumo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Preço por último: primeiro o barbeiro vê o que ganha, depois quanto custa. */}
      <section className="venda-plano" aria-labelledby="plano-titulo">
        <div>
          <h2 id="plano-titulo">Quanto custa</h2>
          <div className="venda-valores">
            <p className="venda-valor"><strong>{reais(adesao)}</strong> na contratação</p>
            <p className="venda-valor"><strong>{reais(plano.valorCentavos)}</strong> por mês pra manter</p>
          </div>
          <ul>
            <li>Você vê o site pronto e monta tudo antes de pagar. Paga pra publicar.</li>
            <li>A contratação já inclui o primeiro mês. Depois, só a mensalidade.</li>
            <li>Pagamento por Pix, sem cartão. Sem fidelidade: se parar de pagar, o site pausa até você voltar.</li>
            <li>Barbeiros ilimitados, agendamentos ilimitados.</li>
          </ul>
        </div>
        <div className="venda-plano-acao">
          <Link href="/montar" className="botao">Ver o meu site pronto <ArrowRight size={18} aria-hidden /></Link>
          <p className="suave pequeno"><Smartphone size={14} aria-hidden /> Sem cadastro pra ver. Leva um minuto, pelo celular.</p>
        </div>
      </section>

      <section className="venda-perguntas" aria-labelledby="perguntas-titulo">
        <h2 id="perguntas-titulo">Perguntas</h2>
        {PERGUNTAS.map(([p, r]) => (
          <details key={p}>
            <summary>{p}</summary>
            <p>{r}</p>
          </details>
        ))}
      </section>

      <section id="comunidade" className="venda-comunidade" aria-labelledby="comunidade-titulo">
        <div>
          <h2 id="comunidade-titulo">Comunidade de barbeiros no WhatsApp</h2>
          <p className="suave">
            Dicas pra lotar a agenda, novos cursos e novidades do sistema. Sem spam e sem corrente; sai quando quiser.
          </p>
        </div>
        <form action={inscrever} className="formulario">
          {erro && <p className="erro" role="alert">Preencha nome e WhatsApp e marque a autorização.</p>}
          <label>Seu nome<input name="nome" required maxLength={100} autoComplete="name" /></label>
          <label>WhatsApp com DDD<input name="telefone" required inputMode="tel" autoComplete="tel-national" placeholder="(19) 99999-0000" /></label>
          <label>Barbearia <small>(opcional)</small><input name="negocio" maxLength={100} /></label>
          <label>Cidade <small>(opcional)</small><input name="cidade" maxLength={100} /></label>
          <label className="check">
            <input type="checkbox" name="consentimento" value="sim" required />
            <span>Autorizo receber mensagens pelo WhatsApp sobre a comunidade e o sistema. Posso sair quando quiser respondendo SAIR. <a href="/privacidade" target="_blank">Privacidade</a>.</span>
          </label>
          <button type="submit">Entrar na comunidade</button>
        </form>
      </section>
    </div>
  );
}
