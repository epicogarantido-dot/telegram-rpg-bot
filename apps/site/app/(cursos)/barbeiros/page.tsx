import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, BellRing, CalendarCheck, Repeat, ShieldCheck, Smartphone, Users } from "lucide-react";
import { planoDoAmbiente, TEMAS } from "@aprenda/agenda";
import { carregarArtigos, carregarCursos } from "@aprenda/catalogo";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { obterBanco } from "@/lib/painel";
import { reais } from "@/lib/agenda";
import { Carrossel } from "@/componentes/Carrossel";

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
      "Folga em parte do dia, \"fechar hoje\", horários de 30 min a 2 h, preços visíveis ou não.",
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

const PERGUNTAS = [
  ["Preciso de computador?", "Não. Tudo funciona no celular: o site, o painel e os avisos. No iPhone, é só adicionar o painel à tela de início."],
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

  return (
    <div className="venda">
      <section className="venda-heroi">
        <div className="venda-heroi-texto">
          <h1>Seu site e sua agenda, prontos hoje.</h1>
          <p>
            O cliente vê seus cortes, vê os horários livres e marca sozinho. Você para de responder
            &quot;tem horário?&quot; no meio do corte.
          </p>
          <div className="acoes">
            <Link href="/app/cadastro" className="botao">Criar minha agenda <ArrowRight size={18} aria-hidden /></Link>
            <a href="#estilos" className="botao-sec">Ver os estilos</a>
          </div>
        </div>
        <figure className="venda-celular" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/barbeiros/potencia.webp" alt="" width={390} height={780} />
        </figure>
      </section>

      <Carrossel id="estilos" titulo="Escolha a cara da sua barbearia" descricao="Seis estilos prontos, com suas fotos e seus serviços. Dá pra trocar quando quiser.">
        {TEMAS.map((t) => (
          <figure key={t.id} className="estilo-slide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/barbeiros/${t.id}.webp`} alt={`Site no estilo ${t.nome}, visto no celular`} width={390} height={780} loading="lazy" />
            <figcaption><strong>{t.nome}</strong><span>{t.resumo}</span></figcaption>
          </figure>
        ))}
      </Carrossel>

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
            {plano.testeDias > 0 && <li>{plano.testeDias} dias pra testar antes de contratar.</li>}
            <li>A contratação já inclui o primeiro mês. Depois, só a mensalidade.</li>
            <li>Pagamento por Pix, sem cartão. Sem fidelidade: se parar de pagar, o site pausa até você voltar.</li>
            <li>Barbeiros ilimitados, agendamentos ilimitados.</li>
          </ul>
        </div>
        <div className="venda-plano-acao">
          <Link href="/app/cadastro" className="botao">Criar minha agenda <ArrowRight size={18} aria-hidden /></Link>
          <p className="suave pequeno"><Smartphone size={14} aria-hidden /> Leva uns 5 minutos, pelo celular.</p>
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
            <span>Autorizo receber mensagens pelo WhatsApp sobre a comunidade e o sistema. Posso sair quando quiser respondendo SAIR.</span>
          </label>
          <button type="submit">Entrar na comunidade</button>
        </form>
      </section>
    </div>
  );
}
