import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { carregarArtigos, carregarCursos, PASTA_CURSOS } from "./carregar.ts";

/**
 * Confere o conteúdo de verdade (data/cursos e data/artigos), não exemplos:
 * roda em todo `npm test`, então matéria ou curso com erro não chega ao site.
 */
const cursos = await carregarCursos();
const artigos = await carregarArtigos();

const rotas = new Set<string>(["/", "/cursos", "/revista", "/barbeiros", "/cadastro", "/entrar", "/licencas", "/minha-area"]);
for (const c of cursos) {
  rotas.add(`/cursos/${c.slug}`);
  for (const m of c.modulos) for (const l of m.licoes) rotas.add(`/cursos/${c.slug}/${m.id}/${l.id}`);
}
for (const a of artigos) rotas.add(`/revista/${a.slug}`);

const textos = [
  ...artigos.map((a) => ({ onde: `artigo ${a.slug}`, texto: a.conteudo })),
  ...cursos.flatMap((c) => c.modulos.flatMap((m) => m.licoes.map((l) => ({ onde: `curso ${c.slug}/${m.id}/${l.id}`, texto: l.conteudo })))),
];

/** Links em Markdown: [texto](destino). Imagens (![alt](src)) ficam de fora. */
function links(texto: string): string[] {
  return [...texto.matchAll(/(?<!!\[[^\]]*)\]\(([^)\s]+)[^)]*\)/g)].map((m) => m[1]!);
}

/** Imagens em Markdown: ![alt](src "legenda"). */
function imagens(texto: string): { src: string; legenda?: string }[] {
  return [...texto.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g)].map((m) => ({ src: m[1]!, legenda: m[2] }));
}

function repetidos(lista: string[]): string[] {
  return lista.filter((x, i) => lista.indexOf(x) !== i);
}

describe("conteúdo publicado", () => {
  it("slugs e ids não se repetem", () => {
    expect(repetidos(cursos.map((c) => c.slug))).toEqual([]);
    expect(repetidos(artigos.map((a) => a.slug))).toEqual([]);
    for (const c of cursos) {
      expect(repetidos(c.modulos.map((m) => m.id)), c.slug).toEqual([]);
      for (const m of c.modulos) expect(repetidos(m.licoes.map((l) => l.id)), `${c.slug}/${m.id}`).toEqual([]);
    }
  });

  it("links internos apontam pra páginas que existem", () => {
    const quebrados = textos.flatMap(({ onde, texto }) =>
      links(texto)
        .filter((l) => l.startsWith("/"))
        .map((l) => l.split("#")[0]!.split("?")[0]!)
        .filter((l) => !rotas.has(l))
        .map((l) => `${onde} → ${l}`),
    );
    expect(quebrados).toEqual([]);
  });

  it("links externos usam https", () => {
    const inseguros = textos.flatMap(({ onde, texto }) =>
      links(texto).filter((l) => l.startsWith("http:")).map((l) => `${onde} → ${l}`),
    );
    const fontes = artigos.flatMap((a) => a.fontes.filter((f) => !f.url.startsWith("https:")).map((f) => `${a.slug} → ${f.url}`));
    expect([...inseguros, ...fontes]).toEqual([]);
  });

  it("nada de rascunho esquecido", () => {
    // Maiúsculas de propósito: "todo" em português é palavra normal.
    const marcas = /\b(TODO|FIXME|XXX)\b|lorem ipsum|\[(fonte|link|preencher)\]|\?\?\?/;
    expect(textos.filter(({ texto }) => marcas.test(texto)).map(({ onde }) => onde)).toEqual([]);
  });

  it("artigos: data válida, fontes sem repetição, resumo curto", () => {
    for (const a of artigos) {
      expect(Number.isNaN(new Date(`${a.publicadoEm}T12:00:00Z`).getTime()), a.slug).toBe(false);
      expect(repetidos(a.fontes.map((f) => f.url)), a.slug).toEqual([]);
      expect(a.resumo.length, `resumo de ${a.slug}`).toBeLessThanOrEqual(220);
      expect(a.titulo.length, `título de ${a.slug}`).toBeLessThanOrEqual(90);
    }
  });

  it("toda matéria tem foto com licença aberta, crédito e arquivo no site", () => {
    const publico = join(dirname(dirname(PASTA_CURSOS)), "apps", "site", "public");
    // Só licenças que deixam usar em site com venda e redimensionar a foto.
    const abertas = /^(Domínio público|CC0|CC BY( \d\.\d)?|CC BY-SA( \d\.\d)?|Licença Unsplash|Licença Pexels)$/;
    for (const a of artigos) {
      expect(a.imagem, `${a.slug} sem imagem`).toBeDefined();
      expect(a.imagem!.licenca, a.slug).toMatch(abertas);
      expect(a.imagem!.credito.trim(), a.slug).not.toBe("");
      expect(existsSync(join(publico, a.imagem!.arquivo)), `${a.slug}: falta ${a.imagem!.arquivo}`).toBe(true);
    }
  });

  it("foto no meio do texto: arquivo existe e a legenda dá o crédito", () => {
    const publico = join(dirname(dirname(PASTA_CURSOS)), "apps", "site", "public");
    for (const a of artigos) {
      for (const f of imagens(a.conteudo)) {
        expect(existsSync(join(publico, f.src)), `${a.slug}: falta ${f.src}`).toBe(true);
        expect(f.legenda ?? "", `${a.slug}: ${f.src} sem crédito`).toMatch(/^Foto: .+\(.+\)$/);
      }
    }
  });

  it("séries: um episódio por número, sem buraco", () => {
    const series = new Map<string, number[]>();
    for (const a of artigos) if (a.serie) series.set(a.serie.nome, [...(series.get(a.serie.nome) ?? []), a.serie.episodio]);
    for (const [nome, eps] of series) {
      expect([...eps].sort((x, y) => x - y), nome).toEqual(eps.map((_, i) => i + 1));
    }
    for (const a of artigos) expect(a.tipo === "serie", `${a.slug}: tipo "serie" anda junto com "serie"`).toBe(Boolean(a.serie));
  });

  it("cursos: tradução tem link do original; curso próprio não finge ser tradução", () => {
    for (const c of cursos) {
      if (c.autoria === "traducao") expect(c.fonte.url, c.slug).toBeTruthy();
      else expect(c.traducao, c.slug).toBe("original");
      expect(c.fonte.atribuicao.trim(), c.slug).not.toBe("");
    }
  });
});
