import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { Curso } from "./schema.ts";

/**
 * Acha data/cursos subindo a partir do diretório atual. Não dá pra usar
 * import.meta.url: dentro do bundle do Next ele não aponta pro fonte.
 * APRENDA_DADOS sobrescreve (útil em deploy).
 */
function acharPastaCursos(): string {
  if (process.env.APRENDA_DADOS) return process.env.APRENDA_DADOS;
  let dir = process.cwd();
  while (!existsSync(join(dir, "data", "cursos"))) {
    const pai = dirname(dir);
    if (pai === dir) throw new Error("Pasta data/cursos não encontrada; defina APRENDA_DADOS.");
    dir = pai;
  }
  return join(dir, "data", "cursos");
}

export const PASTA_CURSOS = acharPastaCursos();

/** Lê e valida todos os cursos de data/cursos. Arquivo inválido derruba o build — de propósito. */
export async function carregarCursos(pasta = PASTA_CURSOS): Promise<Curso[]> {
  const arquivos = (await readdir(/*turbopackIgnore: true*/ pasta)).filter((a) => a.endsWith(".json")).sort();
  const cursos: Curso[] = [];
  for (const arquivo of arquivos) {
    const bruto = JSON.parse(await readFile(/*turbopackIgnore: true*/ join(pasta, arquivo), "utf8"));
    const r = Curso.safeParse(bruto);
    if (!r.success) throw new Error(`Curso inválido em ${arquivo}:\n${r.error.message}`);
    cursos.push(r.data);
  }
  return cursos;
}

export async function carregarCurso(slug: string, pasta = PASTA_CURSOS): Promise<Curso | undefined> {
  return (await carregarCursos(pasta)).find((c) => c.slug === slug);
}
