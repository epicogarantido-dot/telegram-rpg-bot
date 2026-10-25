import Link from "next/link";
import { BarChart3, BookOpen, Code2, GraduationCap, Languages, Layers } from "lucide-react";
import type { Curso } from "@aprenda/catalogo";

const NIVEL = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado" } as const;

/** Ícone por área; área nova cai no livro. */
const ICONE_AREA: Record<string, typeof BookOpen> = {
  "Programação": Code2,
  "Idiomas": Languages,
  "Negócios": BarChart3,
};

export function CartaoCurso({ curso }: { curso: Curso }) {
  const licoes = curso.modulos.reduce((n, m) => n + m.licoes.length, 0);
  const Icone = ICONE_AREA[curso.area] ?? BookOpen;
  return (
    <Link href={`/cursos/${curso.slug}`} className="cartao">
      <div className="etiquetas">
        <span className="chip-icone"><Icone size={20} aria-hidden /></span>
        <span className="etiqueta">{curso.area}</span>
      </div>
      <h3>{curso.titulo}</h3>
      <p>{curso.resumo}</p>
      <div className="rodape-cartao">
        <span><GraduationCap className="icone" aria-hidden />{NIVEL[curso.nivel]}</span>
        <span><Layers className="icone" aria-hidden />{licoes} lições</span>
        <span>via {curso.fonte.nome}</span>
      </div>
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
