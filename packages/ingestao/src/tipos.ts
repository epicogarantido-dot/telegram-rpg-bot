import type { Curso } from "@aprenda/catalogo";

/** Uma lição como veio da fonte, antes de traduzir. */
export interface LicaoBruta {
  id: string;
  titulo: string;
  conteudo: string;
  urlOriginal?: string;
}

export interface ModuloBruto {
  id: string;
  titulo: string;
  licoes: LicaoBruta[];
}

/**
 * O que um adaptador de fonte devolve: o curso inteiro no idioma original,
 * com metadados de licença já preenchidos. A tradução é um passo separado.
 */
export type CursoBruto = Omit<Curso, "modulos" | "traducao" | "atualizadoEm"> & {
  modulos: ModuloBruto[];
};
