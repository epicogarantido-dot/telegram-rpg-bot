import { z } from "zod";

/**
 * Licenças que permitem traduzir e republicar. Qualquer fonte nova precisa
 * cair numa destas — se a licença não permite obra derivada (ex.: CC BY-ND)
 * ou não é aberta, o curso NÃO entra no catálogo. Ver docs/licencas.md.
 */
export const Licenca = z.enum([
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC-BY-NC-SA-4.0",
  "CC-BY-NC-4.0",
  "CC0-1.0",
  "BSD-3-Clause",
  "MIT",
]);
export type Licenca = z.infer<typeof Licenca>;

export const Licao = z.object({
  id: z.string(),
  titulo: z.string(),
  /** Markdown já em português. */
  conteudo: z.string(),
  urlOriginal: z.url().optional(),
});
export type Licao = z.infer<typeof Licao>;

export const Modulo = z.object({
  id: z.string(),
  titulo: z.string(),
  licoes: z.array(Licao),
});
export type Modulo = z.infer<typeof Modulo>;

export const Curso = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  titulo: z.string(),
  resumo: z.string(),
  area: z.string(),
  nivel: z.enum(["iniciante", "intermediario", "avancado"]),
  tags: z.array(z.string()).default([]),
  idiomaOriginal: z.string(),
  traducao: z.enum(["original", "automatica", "revisada"]),
  modulos: z.array(Modulo),
  fonte: z.object({
    nome: z.string(),
    url: z.url(),
    tituloOriginal: z.string(),
    autores: z.array(z.string()).default([]),
    licenca: Licenca,
    /** Texto de atribuição exigido pela licença, exibido em toda página do curso. */
    atribuicao: z.string(),
  }),
  atualizadoEm: z.string(),
});
export type Curso = z.infer<typeof Curso>;

/** Licenças NC proíbem uso comercial: o site não pode cobrar nem pôr anúncio nessas páginas. */
export function permiteUsoComercial(l: Licenca): boolean {
  return !l.includes("-NC");
}
