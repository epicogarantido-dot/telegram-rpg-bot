import Link from "next/link";
import { carregarCursos } from "@aprenda/catalogo";
import { CartaoCurso } from "./componentes";

export default async function Inicio() {
  const cursos = await carregarCursos();
  const areas = [...new Set(cursos.map((c) => c.area))].sort();
  return (
    <>
      <section className="heroi">
        <h1>O conhecimento do mundo, em português.</h1>
        <p>
          Reunimos cursos gratuitos e abertos de universidades e comunidades do mundo todo e traduzimos
          para você — sempre com crédito aos autores originais.
        </p>
        <form action="/cursos" className="busca">
          <input name="q" placeholder="O que você quer aprender?" aria-label="Buscar cursos" />
          <button type="submit">Buscar</button>
        </form>
      </section>
      {areas.length > 0 && (
        <p>
          Áreas:{" "}
          {areas.map((a) => (
            <Link key={a} href={`/cursos?q=${encodeURIComponent(a)}`} className="etiqueta" style={{ marginRight: 8 }}>
              {a}
            </Link>
          ))}
        </p>
      )}
      <h2>Cursos</h2>
      <div className="grade">
        {cursos.map((c) => <CartaoCurso key={c.slug} curso={c} />)}
      </div>
    </>
  );
}
