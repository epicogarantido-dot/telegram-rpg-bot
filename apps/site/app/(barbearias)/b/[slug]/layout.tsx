import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarCheck, MessageCircle, Navigation } from "lucide-react";
import { obterAgenda } from "@/lib/agenda";
import { linkMapa, nivelEfeitos } from "@/lib/barbearias";
import { Efeitos } from "@/componentes/barbearia/Efeitos";
import { QueroEsteSite } from "@/componentes/barbearia/QueroEsteSite";
import { dataPorExtenso } from "@/lib/datas";
import { ehSiteDeExemplo } from "@/lib/exemplos";
import { entregue } from "@/lib/entrega";
import { conviteDaPrevia } from "@/lib/previa";
import { ehOBarbeiro } from "@/lib/protecao";
import { TEMAS } from "@aprenda/agenda";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { trocarEstiloDaPrevia } from "./acoes-previa";
import { soEntrega } from "@/lib/modo";

/** Demonstração e site em montagem não vão pro Google (nem o site, nem as páginas internas). */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  return b?.demoAte || b?.emMontagem ? { robots: { index: false, follow: false } } : {};
}

/**
 * Casca do site de cada barbearia: aplica o tema escolhido (data-tema) e o
 * teto de efeitos dele (data-efeitos). Tudo que é visual vem de temas.css.
 */
export default async function LayoutSiteBarbearia({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug(slug);
  if (!b) notFound();
  // Vendido aqui (site de leads) e já entregue: o site de verdade está no SaaS.
  const noSaas = entregue(b.id);
  if (noSaas) redirect(noSaas.site);
  // No SaaS só existe site de quem pagou: exemplos (acervo de fotos) e prévias não abrem.
  if (b.demoAte && soEntrega()) notFound();
  const ativo = banco.acessoAtivo(b);
  // Demonstração vencida some de vez (não tem dono pra quem "falar direto").
  if (b.demoAte && !ativo) notFound();
  // Prévia que o barbeiro montou neste aparelho em /montar (o convite está no cookie).
  const previa = b.demoAte ? await conviteDaPrevia(b.id) : undefined;
  // Em montagem (conta nova que ainda não pagou), só o dono logado vê o site.
  const dono = b.emMontagem && await ehOBarbeiro(b.id);
  const noAr = ativo && (!b.emMontagem || dono);
  const base = `/b/${b.slug}`;
  const agenda = b.atendimento !== "chegada";
  const mapa = linkMapa(b);
  const whats = `https://wa.me/${b.telefone}?text=${encodeURIComponent(`Olá, ${b.nome}! Vim pelo site.`)}`;

  return (
    <>
      {b.demoAte && ehSiteDeExemplo(b.slug) ? (
        <aside className="b-demo" aria-label="Aviso de site de exemplo">
          <p>
            <strong>Site de exemplo</strong> do estilo que você está vendo. Barbearia e fotos são ilustrativas e a marcação
            vai até o fim sem gravar nada. No seu, entram o seu nome, os seus trabalhos e os seus preços.
          </p>
          <a className="b-demo-botao" href={`/montar?tema=${b.tema}`}>Quero um site assim</a>
          <details className="b-demo-estilos">
            <summary>Ver outros estilos</summary>
            <nav aria-label="Outros estilos de site">
              {TEMAS.filter((t) => t.id !== b.tema).map((t) => <a key={t.id} href={`/exemplo/${t.id}`}>{t.nome}</a>)}
            </nav>
          </details>
        </aside>
      ) : previa ? (
        <aside className="b-demo" aria-label="Aviso de prévia">
          <p>
            <strong>Assim fica o site da {b.nome}.</strong> As fotos são de exemplo: no site de verdade, a nossa
            equipe põe as suas fotos, serviços e preços.
          </p>
          <form action={trocarEstiloDaPrevia} className="b-demo-estilo">
            <input type="hidden" name="id" value={b.id} />
            <label htmlFor="previa-tema">Estilo</label>
            <select id="previa-tema" name="tema" defaultValue={b.tema}>
              {TEMAS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            <BotaoEnviar className="b-demo-botao-sec" carregando="Trocando…">Trocar</BotaoEnviar>
          </form>
          <a className="b-demo-botao" href={`/app/cadastro?demo=${encodeURIComponent(previa)}`}>Quero este site</a>
        </aside>
      ) : dono ? (
        <aside className="b-demo" aria-label="Aviso de site em montagem">
          <p>
            <strong>Só você está vendo esta prévia.</strong> Depois do pagamento, a nossa equipe monta o site de
            verdade com você.
          </p>
          <a className="b-demo-botao" href="/app/assinatura">Ver o pagamento</a>
        </aside>
      ) : b.demoAte && (
        <aside className="b-demo" aria-label="Aviso de demonstração">
          <p>
            <strong>Demonstração</strong> montada pelo Aprenda Livre pra mostrar como ficaria o site da {b.nome}.
            Fotos de exemplo; a marcação está desligada. No ar até {dataPorExtenso(b.demoAte)}.
          </p>
          <Suspense><QueroEsteSite /></Suspense>
        </aside>
      )}
    <div className="site-b" data-tema={b.tema} data-efeitos={nivelEfeitos(b.tema)}>
      <header className="b-topo">
        <Link href={base} className="b-nome">{b.nome}</Link>
        {noAr && (
          <nav aria-label="Seções">
            <Link href={`${base}/trabalhos`}>Trabalhos</Link>
            <Link href={`${base}#equipe`}>Equipe</Link>
            <Link href={`${base}#contato`}>Onde estamos</Link>
            {agenda && <Link href={`${base}/agendar`} className="b-botao b-botao-pequeno">Agendar</Link>}
          </nav>
        )}
      </header>
      <main className="b-conteudo">
        {noAr ? children : ativo ? (
          <section className="b-secao b-indisponivel">
            <h1>{b.nome}</h1>
            <p>O site da {b.nome} está ficando pronto. Enquanto isso, fale direto com a barbearia:</p>
            {b.telefone && <a className="b-botao" href={whats} target="_blank" rel="noopener noreferrer">WhatsApp da barbearia</a>}
          </section>
        ) : (
          <section className="b-secao b-indisponivel">
            <h1>{b.nome}</h1>
            <p>O site está temporariamente indisponível. Fale direto com a barbearia:</p>
            {b.telefone && <a className="b-botao" href={whats} target="_blank" rel="noopener noreferrer">WhatsApp da barbearia</a>}
          </section>
        )}
      </main>
      <footer className="b-rodape">
        <span>{b.nome}{b.cidade ? ` · ${b.cidade}` : ""}</span>
        {/* Site de cliente não leva propaganda nossa: o convite pra ter um site assim fica só nos exemplos e prévias. */}
        {b.demoAte
          ? <a href="/barbeiros" className="b-assinatura">Você é barbeiro? Tenha um site assim</a>
          : <Link href={`${base}/privacidade`} className="b-assinatura">Privacidade</Link>}
      </footer>
      {noAr && <Efeitos tema={b.tema} />}
      {noAr && (
        <nav className="b-barra-celular" aria-label="Ações rápidas">
          {agenda
            ? <Link href={`${base}/agendar`} className="b-botao"><CalendarCheck size={18} aria-hidden /> Agendar</Link>
            : mapa && <a href={mapa} className="b-botao" target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden /> Como chegar</a>}
          {b.telefone && (
            <a href={whats} className="b-botao-sec" target="_blank" rel="noopener noreferrer" aria-label="Chamar no WhatsApp">
              <MessageCircle size={20} aria-hidden />
            </a>
          )}
        </nav>
      )}
    </div>
    </>
  );
}
