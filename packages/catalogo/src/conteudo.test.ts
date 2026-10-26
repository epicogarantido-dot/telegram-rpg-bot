import { describe, expect, it } from "vitest";
import { carregarArtigos, carregarCursos } from "./carregar.ts";

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

/** Links em Markdown: [texto](destino). */
function links(texto: string): string[] {
  return [...texto.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]!);
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
