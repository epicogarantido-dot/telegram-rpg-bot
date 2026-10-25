import { describe, expect, it } from "vitest";
import { buscarCursos, normalizar } from "./busca.ts";
import { carregarCursos } from "./carregar.ts";

describe("busca", () => {
  it("ignora acento e caixa", () => {
    expect(normalizar("Programação")).toBe("programacao");
  });

  it("acha cursos do catálogo real", async () => {
    const cursos = await carregarCursos();
    expect(cursos.length).toBeGreaterThan(0);
    const [primeiro] = buscarCursos(cursos, "programacao");
    expect(primeiro).toBeDefined();
  });
});
