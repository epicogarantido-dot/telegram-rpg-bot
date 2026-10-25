import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, MessageCircle } from "lucide-react";
import { obterAgenda } from "@/lib/agenda";
import { nivelEfeitos } from "@/lib/barbearias";

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
  const base = `/b/${b.slug}`;
  const whats = `https://wa.me/${b.telefone}?text=${encodeURIComponent(`Olá, ${b.nome}! Vim pelo site.`)}`;

  return (
    <div className="site-b" data-tema={b.tema} data-efeitos={nivelEfeitos(b.tema)}>
      <header className="b-topo">
        <Link href={base} className="b-nome">{b.nome}</Link>
        {ativo && (
          <nav aria-label="Seções">
            <Link href={`${base}/trabalhos`}>Trabalhos</Link>
            <Link href={`${base}#servicos`}>Serviços</Link>
            <Link href={`${base}#equipe`}>Equipe</Link>
            <Link href={`${base}#contato`}>Contato</Link>
            <Link href={`${base}/agendar`} className="b-botao b-botao-pequeno">Agendar</Link>
          </nav>
        )}
      </header>
      <main className="b-conteudo">
        {ativo ? children : (
          <section className="b-secao b-indisponivel">
            <h1>{b.nome}</h1>
            <p>O site está temporariamente indisponível. Fale direto com a barbearia:</p>
            <a className="b-botao" href={whats} target="_blank" rel="noopener noreferrer">WhatsApp da barbearia</a>
          </section>
        )}
      </main>
      <footer className="b-rodape">
        <span>{b.nome}{b.cidade ? ` · ${b.cidade}` : ""}</span>
        <span className="b-assinatura">Site e agenda online</span>
      </footer>
      {ativo && (
        <nav className="b-barra-celular" aria-label="Ações rápidas">
          <Link href={`${base}/agendar`} className="b-botao"><CalendarCheck size={18} aria-hidden /> Agendar</Link>
          <a href={whats} className="b-botao-sec" target="_blank" rel="noopener noreferrer" aria-label="Chamar no WhatsApp">
            <MessageCircle size={20} aria-hidden />
          </a>
        </nav>
      )}
    </div>
  );
}
