import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarCurso, carregarCursos } from "@aprenda/catalogo";
import { Atribuicao } from "../../componentes";

export async function generateStaticParams() {
  return (await carregarCursos()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const curso = await carregarCurso((await params).slug);
  return { title: curso?.titulo, description: curso?.resumo };
}

export default async function PaginaCurso({ params }: { params: Promise<{ slug: string }> }) {
  const curso = await carregarCurso((await params).slug);
  if (!curso) notFound();
  return (
    <>
      <span className="etiqueta">{curso.area}</span>
      <h1>{curso.titulo}</h1>
      <p>{curso.resumo}</p>
      <Atribuicao curso={curso} />
      <div className="modulos">
        {curso.modulos.map((m, i) => (
          <section key={m.id}>
            <h2>{i + 1}. {m.titulo}</h2>
            <ol>
              {m.licoes.map((l) => (
                <li key={l.id}>
                  <Link href={`/cursos/${curso.slug}/${m.id}/${l.id}`}>{l.titulo}</Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
