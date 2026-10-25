import { describe, expect, it } from "vitest";
import { absolutizarLinks, coletarGithub, tituloDoArquivo } from "./fontes/github-markdown.ts";
import { RECEITAS } from "./receitas.ts";

describe("adaptador GitHub", () => {
  it("gera título a partir do arquivo", () => {
    expect(tituloDoArquivo("a/b/how_this_course_will_work.md")).toBe("How this course will work");
  });

  it("absolutiza imagens e links relativos, preserva os absolutos", () => {
    const md = "![x](./imgs/a.png) [y](../outro.md) [z](https://ex.com) [w](#ancora)";
    const r = absolutizarLinks(md, "o/r", "main", "pasta/sub/licao.md");
    expect(r).toContain("(https://raw.githubusercontent.com/o/r/main/pasta/sub/imgs/a.png)");
    expect(r).toContain("(https://github.com/o/r/blob/main/pasta/sub/../outro.md)");
    expect(r).toContain("(https://ex.com)");
    expect(r).toContain("(#ancora)");
  });

  it("monta o curso bruto na ordem da receita", async () => {
    const receita = RECEITAS[0]!;
    const bruto = await coletarGithub(receita, async (url) => `# conteúdo de ${url}`);
    expect(bruto.modulos.map((m) => m.licoes.length)).toEqual(receita.modulos.map((m) => m.licoes.length));
    expect(bruto.fonte.licenca).toBe(receita.fonte.licenca);
  });
});
