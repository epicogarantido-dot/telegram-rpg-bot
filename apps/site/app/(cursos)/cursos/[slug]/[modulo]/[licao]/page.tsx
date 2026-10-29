import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarCurso, permiteUsoComercial } from "@aprenda/catalogo";
import { renderizarMarkdown } from "@/lib/markdown";
import { Atribuicao } from "@/componentes/cursos";
import { PropagandaSaas } from "@/componentes/revista";

type Params = { slug: string; modulo: string; licao: string };

// Aberta pra todo mundo. Gerada na primeira visita e refeita a cada 10 min (preço da propaganda vem do .env).
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const p = await params;
  const curso = await carregarCurso(p.slug);
  const licao = curso?.modulos.find((m) => m.id === p.modulo)?.licoes.find((l) => l.id === p.licao);
  return { title: licao ? `${licao.titulo} — ${curso!.titulo}` : undefined };
}

export default async function PaginaLicao({ params }: { params: Promise<Params> }) {
  const p = await params;
  const curso = await carregarCurso(p.slug);
  if (!curso) notFound();

  // Sequência linear de todas as lições, pra montar "anterior / próxima".
  const sequencia = curso.modulos.flatMap((m) => m.licoes.map((l) => ({ modulo: m, licao: l })));
  const i = sequencia.findIndex((x) => x.modulo.id === p.modulo && x.licao.id === p.licao);
  if (i < 0) notFound();
  const { modulo, licao } = sequencia[i]!;
  const anterior = sequencia[i - 1];
  const proxima = sequencia[i + 1];
  const href = (x: (typeof sequencia)[number]) => `/cursos/${curso.slug}/${x.modulo.id}/${x.licao.id}`;

  return (
    <article className="licao">
      <p>
        <Link href={`/cursos/${curso.slug}`}>{curso.titulo}</Link> · {modulo.titulo}
      </p>
      <h1>{licao.titulo}</h1>
      <div dangerouslySetInnerHTML={{ __html: renderizarMarkdown(licao.conteudo) }} />
      <Atribuicao curso={curso} />
      <nav className="navegacao">
        {anterior ? <Link href={href(anterior)}>← {anterior.licao.titulo}</Link> : <span />}
        {proxima ? <Link href={href(proxima)}>{proxima.licao.titulo} →</Link> : <span />}
      </nav>
      {/* Funil: quem leu a lição vê o site da barbearia. Nunca em curso CC BY-NC (sem anúncio ali). */}
      {permiteUsoComercial(curso.fonte.licenca) && <PropagandaSaas assunto={`${curso.titulo} ${licao.titulo}`} />}
    </article>
  );
}
