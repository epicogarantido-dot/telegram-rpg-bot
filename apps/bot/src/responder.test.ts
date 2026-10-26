import { describe, expect, it } from "vitest";
import { carregarCursos } from "@aprenda/catalogo";
import { ehPedidoDeEntrada, ehPedidoDeSaida, responder } from "./responder.ts";

const ctx = { cursos: await carregarCursos(), siteUrl: "https://exemplo.com/" };

describe("responder", () => {
  it("mostra o menu", () => {
    expect(responder("menu", ctx)).toContain("Comandos");
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

it("reconhece pedido de entrada (e saudação)", () => {
  for (const t of ["Oi", "olá!", "Quero entrar no Aprenda Livre", "entrar", "Bom dia", "me manda o link?", "Meu código: AB3K9Q"]) {
    expect(ehPedidoDeEntrada(t), t).toBe(true);
  }
  for (const t of ["buscar python", "quero aprender web", "sair", "menu"]) {
    expect(ehPedidoDeEntrada(t), t).toBe(false);
  }
});
