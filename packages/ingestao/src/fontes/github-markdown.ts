import type { Curso } from "@aprenda/catalogo";
import type { CursoBruto, ModuloBruto } from "../tipos.ts";

/**
 * Adaptador genérico: currículo aberto escrito em Markdown num repositório
 * do GitHub (The Odin Project, Microsoft *-For-Beginners, etc.). Lê os
 * arquivos crus por raw.githubusercontent.com — não precisa de token.
 */
export interface ReceitaGithub {
  slug: string;
  titulo: string;
  resumo: string;
  area: string;
  nivel: Curso["nivel"];
  tags: string[];
  idiomaOriginal: string;
  repo: string; // "dono/repo"
  ref: string; // branch ou commit — prefira commit pra tradução reproduzível
  fonte: Curso["fonte"];
  modulos: { id: string; titulo: string; licoes: string[] }[];
}

export function urlCrua(repo: string, ref: string, caminho: string): string {
  return `https://raw.githubusercontent.com/${repo}/${ref}/${caminho}`;
}

/** "foundations/introduction/how_this_course_will_work.md" -> "How this course will work" */
export function tituloDoArquivo(caminho: string): string {
  const nome = caminho.split("/").pop()!.replace(/\.md$/i, "").replace(/[_-]+/g, " ").trim();
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

/** Torna links e imagens relativos absolutos, pra continuarem funcionando fora do repo. */
export function absolutizarLinks(md: string, repo: string, ref: string, caminho: string): string {
  const base = caminho.split("/").slice(0, -1).join("/");
  return md.replace(/(!?)\[([^\]]*)\]\((?!https?:|#|mailto:)([^)\s]+)\)/g, (_m, img, texto, alvo) => {
    const limpo = alvo.replace(/^\.\//, "");
    const completo = limpo.startsWith("/") ? limpo.slice(1) : `${base}/${limpo}`;
    const url = img ? urlCrua(repo, ref, completo) : `https://github.com/${repo}/blob/${ref}/${completo}`;
    return `${img}[${texto}](${url})`;
  });
}

export async function coletarGithub(
  receita: ReceitaGithub,
  baixar: (url: string) => Promise<string> = baixarTexto,
): Promise<CursoBruto> {
  const modulos: ModuloBruto[] = [];
  for (const m of receita.modulos) {
    const licoes = [];
    for (const caminho of m.licoes) {
      const md = await baixar(urlCrua(receita.repo, receita.ref, caminho));
      licoes.push({
        id: caminho.split("/").pop()!.replace(/\.md$/i, ""),
        titulo: tituloDoArquivo(caminho),
        conteudo: absolutizarLinks(md, receita.repo, receita.ref, caminho),
        urlOriginal: `https://github.com/${receita.repo}/blob/${receita.ref}/${caminho}`,
      });
    }
    modulos.push({ id: m.id, titulo: m.titulo, licoes });
  }
  const { repo: _r, ref: _f, modulos: _m, ...meta } = receita;
  return { ...meta, modulos };
}

async function baixarTexto(url: string): Promise<string> {
  const r = await fetch(url, { headers: { "user-agent": "aprenda-livre-ingestao" } });
  if (!r.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${r.status}`);
  return r.text();
}
