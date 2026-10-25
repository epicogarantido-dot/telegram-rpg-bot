import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIAS_FOTO, categoriaValida } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";
import { urlFoto } from "@/lib/barbearias";
import { AntesDepois } from "@/componentes/barbearia/AntesDepois";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  return { title: b ? `Trabalhos · ${b.nome}` : "Barbearia não encontrada" };
}

export default async function Trabalhos({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ categoria?: string }>;
}) {
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug((await params).slug);
  if (!b) notFound();
  const { categoria } = await searchParams;
  const filtro = categoria && categoriaValida(categoria) ? categoria : undefined;
  const todas = banco.fotos(b.id).filter((f) => f.categoria !== "equipe" && !f.antesDe);
  const pares = filtro ? [] : banco.paresAntesDepois(b.id);
  const fotos = filtro ? todas.filter((f) => f.categoria === filtro) : todas;
  const categorias = CATEGORIAS_FOTO.filter((c) => todas.some((f) => f.categoria === c.id));
  const base = `/b/${b.slug}`;

  return (
    <section className="b-secao">
      <h1>Trabalhos</h1>
      {categorias.length > 1 && (
        <nav className="b-filtros" aria-label="Filtrar por tipo">
          <Link href={`${base}/trabalhos`} aria-current={!filtro ? "page" : undefined}>Todos</Link>
          {categorias.map((c) => (
            <Link key={c.id} href={`${base}/trabalhos?categoria=${c.id}`} aria-current={filtro === c.id ? "page" : undefined}>{c.nome}</Link>
          ))}
        </nav>
      )}
      {pares.length > 0 && (
        <div className="b-comparadores b-comparadores-topo">
          {pares.map((p) => (
            <AntesDepois key={p.antes.id} antes={urlFoto(p.antes.arquivo)} depois={urlFoto(p.depois.arquivo)} legenda={p.depois.legenda} />
          ))}
        </div>
      )}
      {fotos.length === 0 ? <p>Ainda não há fotos aqui.</p> : (
        <div className="b-mural">
          {fotos.map((f) => (
            <a key={f.id} href={urlFoto(f.arquivo)} className="b-foto" target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlFoto(f.arquivo, "p")} alt={f.legenda ?? CATEGORIAS_FOTO.find((c) => c.id === f.categoria)?.nome ?? "Trabalho"} loading="lazy" width={f.largura} height={f.altura} />
              {f.legenda && <span className="b-legenda">{f.legenda}</span>}
            </a>
          ))}
        </div>
      )}
      <p className="b-centro"><Link href={`${base}/agendar`} className="b-botao">Agendar horário</Link></p>
    </section>
  );
}
