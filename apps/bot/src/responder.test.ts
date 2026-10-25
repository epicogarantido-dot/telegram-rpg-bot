import { describe, expect, it } from "vitest";
import { carregarCursos } from "@aprenda/catalogo";
import { ehPedidoDeSaida, responder } from "./responder.ts";

const ctx = { cursos: await carregarCursos(), siteUrl: "https://exemplo.com/" };

describe("responder", () => {
  it("mostra o menu", () => {
    expect(responder("Oi", ctx)).toContain("Comandos");
    expect(responder("/start", ctx)).toContain("Comandos");
  });

  it("busca sem acento e devolve link do site", () => {
    const r = responder("buscar programacao", ctx)!;
    expect(r).toContain("https://exemplo.com/cursos/");
  });

  it("texto livre vira busca", () => {
    expect(responder("quero aprender web", ctx)).toContain("Cursos sobre");
  });

  it("detalha curso pelo código", () => {
    const slug = ctx.cursos[0]!.slug;
    expect(responder(`curso ${slug}`, ctx)).toContain(ctx.cursos[0]!.fonte.licenca);
  });

  it("ignora mensagem vazia", () => {
    expect(responder("   ", ctx)).toBeNull();
  });
});

it("reconhece pedido de saída", () => {
  expect(ehPedidoDeSaida(" SAIR ")).toBe(true);
  expect(ehPedidoDeSaida("Parar.")).toBe(true);
  expect(ehPedidoDeSaida("quero sair cedo hoje")).toBe(false);
});
