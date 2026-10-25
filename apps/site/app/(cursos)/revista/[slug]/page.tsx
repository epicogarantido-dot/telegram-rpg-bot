import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarArtigos } from "@aprenda/catalogo";
import { renderizarMarkdown } from "@/lib/markdown";
import { dataPorExtenso } from "@/lib/datas";

export async function generateStaticParams() {
  return (await carregarArtigos()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = (await carregarArtigos()).find((x) => x.slug === slug);
  return a ? { title: a.titulo, description: a.resumo } : {};
}

export default async function PaginaArtigo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artigos = await carregarArtigos();
  const a = artigos.find((x) => x.slug === slug);
  if (!a) notFound();
  // Outros episódios da mesma série, em ordem.
  const serie = a.serie ? artigos.filter((x) => x.serie?.nome === a.serie!.nome).sort((x, y) => x.serie!.episodio - y.serie!.episodio) : [];

  return (
    <article className="licao artigo">
      <p><Link href="/revista">Revista</Link>{a.serie && <> · {a.serie.nome}, episódio {a.serie.episodio}</>}</p>
      <h1>{a.titulo}</h1>
      <p className="artigo-resumo">{a.resumo}</p>
      <p className="suave pequeno">Por Aprenda Livre · <time dateTime={a.publicadoEm}>{dataPorExtenso(a.publicadoEm)}</time></p>
      <div dangerouslySetInnerHTML={{ __html: renderizarMarkdown(a.conteudo) }} />
      <aside className="artigo-fontes">
        <h2>Fontes</h2>
        <ol>{a.fontes.map((f) => <li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a></li>)}</ol>
        <p className="suave pequeno">Texto original do Aprenda Livre. Preços e números são os publicados pelas fontes na data do artigo e podem ter mudado.</p>
      </aside>
      {serie.length > 1 && (
        <nav className="artigo-serie" aria-label={`Episódios de ${a.serie!.nome}`}>
          <h2>{a.serie!.nome}</h2>
          <ol>{serie.map((x) => <li key={x.slug}>{x.slug === a.slug ? <strong>{x.titulo}</strong> : <Link href={`/revista/${x.slug}`}>{x.titulo}</Link>}</li>)}</ol>
        </nav>
      )}
      <p className="artigo-cta">
        Tem barbearia? <Link href="/barbeiros">Veja como ter seu site com agenda online</Link>.
      </p>
    </article>
  );
}
