import Link from "next/link";
import type { Curso } from "@aprenda/catalogo";

const NIVEL = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado" } as const;

export function CartaoCurso({ curso }: { curso: Curso }) {
  const licoes = curso.modulos.reduce((n, m) => n + m.licoes.length, 0);
  return (
    <Link href={`/cursos/${curso.slug}`} className="cartao">
      <span className="etiqueta">{curso.area}</span>
      <h3>{curso.titulo}</h3>
      <p>{curso.resumo}</p>
      <p style={{ marginTop: 12 }}>
        {NIVEL[curso.nivel]} · {licoes} lições · via {curso.fonte.nome}
      </p>
    </Link>
  );
}

export function Atribuicao({ curso }: { curso: Curso }) {
  return (
    <aside className="atribuicao">
      {curso.fonte.atribuicao}{" "}
      <a href={curso.fonte.url} target="_blank" rel="noopener noreferrer">Ver original</a>.
      {curso.traducao === "automatica" && " Tradução automática, ainda não revisada por humanos."}
      {curso.traducao === "original" && " Ainda não traduzido: exibindo o texto original."}
    </aside>
  );
}
