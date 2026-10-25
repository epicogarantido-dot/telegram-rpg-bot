import type { Curso } from "./schema.ts";

/** Minúsculas e sem acento, pra "programacao" achar "Programação". */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Busca simples por termos; título pesa mais que tags, que pesam mais que resumo. */
export function buscarCursos(cursos: Curso[], consulta: string, limite = 10): Curso[] {
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return cursos.slice(0, limite);

  const pontuados = cursos.map((curso) => {
    const titulo = normalizar(curso.titulo);
    const tags = normalizar([curso.area, ...curso.tags].join(" "));
    const resumo = normalizar(curso.resumo);
    let pontos = 0;
    for (const t of termos) {
      if (titulo.includes(t)) pontos += 5;
      if (tags.includes(t)) pontos += 3;
      if (resumo.includes(t)) pontos += 1;
    }
    return { curso, pontos };
  });

  return pontuados
    .filter((p) => p.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, limite)
    .map((p) => p.curso);
}
