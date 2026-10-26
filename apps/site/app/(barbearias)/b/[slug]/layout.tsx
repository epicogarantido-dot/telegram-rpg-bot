import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, MessageCircle, Navigation } from "lucide-react";
import { obterAgenda } from "@/lib/agenda";
import { linkMapa, nivelEfeitos } from "@/lib/barbearias";
import { Efeitos } from "@/componentes/barbearia/Efeitos";
import { QueroEsteSite } from "@/componentes/barbearia/QueroEsteSite";
import { dataPorExtenso } from "@/lib/datas";

/** Demonstração não vai pro Google (nem o site, nem as páginas internas). */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  return b?.demoAte ? { robots: { index: false, follow: false } } : {};
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
  const ativo = banco.acessoAtivo(b);
  // Demonstração vencida some de vez (não tem dono pra quem "falar direto").
  if (b.demoAte && !ativo) notFound();
  const base = `/b/${b.slug}`;
  const agenda = b.atendimento !== "chegada";
  const mapa = linkMapa(b);
  const whats = `https://wa.me/${b.telefone}?text=${encodeURIComponent(`Olá, ${b.nome}! Vim pelo site.`)}`;

  return (
    <>
      {b.demoAte && (
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
        {ativo && (
          <nav aria-label="Seções">
            <Link href={`${base}/trabalhos`}>Trabalhos</Link>
            <Link href={`${base}#servicos`}>Serviços</Link>
            <Link href={`${base}#equipe`}>Equipe</Link>
            <Link href={`${base}#contato`}>Contato</Link>
            {agenda && <Link href={`${base}/agendar`} className="b-botao b-botao-pequeno">Agendar</Link>}
          </nav>
        )}
      </header>
      <main className="b-conteudo">
        {ativo ? children : (
          <section className="b-secao b-indisponivel">
            <h1>{b.nome}</h1>
            <p>O site está temporariamente indisponível. Fale direto com a barbearia:</p>
            {b.telefone && <a className="b-botao" href={whats} target="_blank" rel="noopener noreferrer">WhatsApp da barbearia</a>}
          </section>
        )}
      </main>
      <footer className="b-rodape">
        <span>{b.nome}{b.cidade ? ` · ${b.cidade}` : ""}</span>
        <Link href="/barbeiros" className="b-assinatura">Você é barbeiro? Tenha um site assim</Link>
      </footer>
      {ativo && <Efeitos tema={b.tema} />}
      {ativo && (
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
