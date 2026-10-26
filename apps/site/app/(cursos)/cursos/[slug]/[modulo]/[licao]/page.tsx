import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarCurso } from "@aprenda/catalogo";
import { renderizarMarkdown } from "@/lib/markdown";
import { Atribuicao } from "@/componentes/cursos";
import { ProgressoLicao } from "@/componentes/ProgressoLicao";
import { LicaoTrancada } from "@/componentes/LicaoTrancada";
import { membroAtual } from "@/lib/membros";

type Params = { slug: string; modulo: string; licao: string };

// Dinâmica: a partir da segunda lição, o conteúdo depende de quem está logado.
export const dynamic = "force-dynamic";

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
  // A primeira lição é a amostra grátis; o resto pede conta com WhatsApp confirmado.
  const trancada = i > 0 && !(await membroAtual())?.verificado;

  return (
    <article className="licao">
      <p>
        <Link href={`/cursos/${curso.slug}`}>{curso.titulo}</Link> · {modulo.titulo}
      </p>
      <h1>{licao.titulo}</h1>
      {trancada ? (
        <LicaoTrancada caminho={href(sequencia[i]!)} primeira={href(sequencia[0]!)} totalLicoes={sequencia.length} />
      ) : (
        <>
          <div dangerouslySetInnerHTML={{ __html: renderizarMarkdown(licao.conteudo) }} />
          <ProgressoLicao curso={curso.slug} licao={licao.id} />
        </>
      )}
      <Atribuicao curso={curso} />
      <nav className="navegacao">
        {anterior ? <Link href={href(anterior)}>← {anterior.licao.titulo}</Link> : <span />}
        {proxima ? <Link href={href(proxima)}>{proxima.licao.titulo} →</Link> : <span />}
      </nav>
    </article>
  );
}
