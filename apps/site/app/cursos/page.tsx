import { buscarCursos, carregarCursos } from "@aprenda/catalogo";
import { CartaoCurso } from "../componentes";

export const metadata = { title: "Cursos" };

export default async function Cursos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const todos = await carregarCursos();
  const cursos = q ? buscarCursos(todos, q, 100) : todos;
  return (
    <>
      <h1>Cursos</h1>
      <form className="busca">
        <input name="q" defaultValue={q} placeholder="Buscar por assunto, área ou tecnologia" aria-label="Buscar" />
        <button type="submit">Buscar</button>
      </form>
      {cursos.length === 0 ? (
        <p>Nenhum curso encontrado para “{q}”.</p>
      ) : (
        <div className="grade">
          {cursos.map((c) => <CartaoCurso key={c.slug} curso={c} />)}
        </div>
      )}
    </>
  );
}
