import { describe, expect, it } from "vitest";
import { carregarCursos } from "@aprenda/catalogo";
import { ehPedidoDeEntrada, ehPedidoDeSaida, PESSOA_HORAS, responder, responderMidia, SESSAO_MIN, sessaoComPessoa, type Resposta, type Sessao } from "./responder.ts";

const ctx = { cursos: await carregarCursos(), siteUrl: "https://exemplo.com/" };

/** Conversa de várias mensagens, guardando a sessão entre elas como o transporte faz. */
function conversa(inicio = 1_000_000) {
  let sessao: Sessao | undefined;
  let agora = inicio;
  return {
    manda(texto: string, depoisMin = 0): Resposta | null {
      agora += depoisMin * 60_000;
      const r = responder(texto, ctx, sessao, agora);
      sessao = r.sessao;
      return r.resposta;
    },
  };
}
const textoDe = (r: Resposta | null) => (r?.tipo === "texto" ? r.texto : "");
const links = (r: Resposta | null) => (textoDe(r).match(/https?:\/\//g) ?? []).length;

describe("árvore de opções", () => {
  it("oi abre o menu numerado, sem link", () => {
    const r = conversa().manda("Oi, tudo bem?");
    expect(textoDe(r)).toContain("*1* · Entrar no site");
    expect(textoDe(r)).toContain("*0* · Não quero mais mensagens");
    expect(links(r)).toBe(0);
  });

  it("qualquer mensagem solta nunca manda rajada de links", () => {
    for (const t of ["bom dia", "quanto custa?", "kkkk", "quero aprender", "marketing", "👍", "1", "2", "3", "4"]) {
      expect(links(conversa().manda(t)), t).toBeLessThanOrEqual(1);
    }
  });

  it("1 pede o link de entrada; 0 no menu é SAIR", () => {
    const c = conversa();
    c.manda("oi");
    expect(c.manda("1")).toEqual({ tipo: "entrada" });
    c.manda("menu");
    expect(c.manda("0")).toEqual({ tipo: "sair" });
  });

  it("2 lista cursos numerados; o número abre UM curso com UM link", () => {
    const c = conversa();
    c.manda("oi");
    const lista = c.manda("2");
    expect(textoDe(lista)).toContain("*1* ·");
    expect(links(lista)).toBe(0);
    const curso = c.manda("1");
    expect(textoDe(curso)).toContain("🎓");
    expect(links(curso)).toBe(1);
    // No curso: 1 entra, 2 volta pra lista.
    expect(c.manda("1")).toEqual({ tipo: "entrada" });
  });

  it("assunto escrito vira lista pra escolher, sem links", () => {
    const c = conversa();
    c.manda("oi");
    const r = c.manda("marketing");
    expect(textoDe(r)).toContain("Achei");
    expect(links(r)).toBe(0);
    expect(textoDe(c.manda("1"))).toContain("🎓");
  });

  it("número fora das opções lembra o que dá pra responder", () => {
    const c = conversa();
    c.manda("oi");
    expect(textoDe(c.manda("7"))).toContain("Não entendi");
    c.manda("2");
    expect(textoDe(c.manda("99"))).toContain("número de um curso");
  });

  it("9 volta ao menu de qualquer tela", () => {
    const c = conversa();
    c.manda("oi");
    c.manda("2");
    expect(textoDe(c.manda("9"))).toContain("*Menu*");
  });

  it("3 e 4 mandam um link só (revista e página de venda)", () => {
    for (const op of ["3", "4"]) {
      const c = conversa();
      c.manda("oi");
      expect(links(c.manda(op)), op).toBe(1);
    }
  });

  it("5 chama uma pessoa: a dúvida vai pro painel, o bot confirma uma vez e depois só repassa", () => {
    const c = conversa();
    c.manda("oi");
    expect(textoDe(c.manda("5"))).toContain("uma pessoa");
    const duvida = c.manda("minha dúvida é sobre o preço");
    expect(duvida).toMatchObject({ tipo: "pessoa", duvida: "minha dúvida é sobre o preço" });
    expect(duvida?.tipo === "pessoa" && duvida.texto).toContain("Anotado");
    const mais = c.manda("alô?", 60);
    expect(mais).toEqual({ tipo: "pessoa", duvida: "alô?" });
    expect(textoDe(c.manda("menu"))).toContain("*Menu*");
    // Passado o prazo, volta ao normal.
    const d = conversa();
    d.manda("5");
    expect(textoDe(d.manda("oi", PESSOA_HORAS * 60 + 1))).toContain("*1* · Entrar");
  });

  it("conversa parada recomeça pelo menu", () => {
    const c = conversa();
    c.manda("oi");
    c.manda("2");
    // Depois de muito tempo, "7" não é curso da lista velha: abre o menu.
    expect(textoDe(c.manda("7", SESSAO_MIN + 1))).toContain("*1* · Entrar");
  });

  it("depois de reiniciar (sem sessão), 1 a 5 ainda valem como opção", () => {
    expect(responder("1", ctx).resposta).toEqual({ tipo: "entrada" });
    expect(textoDe(responder("2", ctx).resposta)).toContain("Cursos grátis");
  });

  it("mensagem do botão do site entra direto; SAIR vale em qualquer tela", () => {
    expect(conversa().manda("Quero entrar no Aprenda Livre")).toEqual({ tipo: "entrada" });
    const c = conversa();
    c.manda("oi");
    c.manda("2");
    expect(c.manda("SAIR")).toEqual({ tipo: "sair" });
  });

  it("cumprimenta pelo nome do perfil, se parecer nome de gente", () => {
    expect(textoDe(responder("oi", ctx, undefined, 0, "joão silva").resposta)).toContain("Oi, João!");
    expect(textoDe(responder("oi", ctx, undefined, 0, "🔥JV🔥").resposta)).toContain("Oi! 👋");
    expect(textoDe(responder("oi", ctx).resposta)).toContain("atendimento automático");
  });

  it("'não entendi' muda e, na terceira vez seguida, oferece uma pessoa", () => {
    const c = conversa();
    c.manda("oi");
    const r1 = textoDe(c.manda("xyz"));
    const r2 = textoDe(c.manda("hã"));
    const r3 = textoDe(c.manda("kkk"));
    expect(r1).toContain("Não entendi");
    expect(r2).not.toBe(r1);
    expect(r3).toContain("*5*");
    expect(r3).toContain("pessoa");
  });

  it("áudio ou foto: pede texto; com uma pessoa, fica calado", () => {
    expect(textoDe(responderMidia().resposta)).toContain("só leio texto");
    expect(responderMidia(sessaoComPessoa(0), 1000).resposta).toBeNull();
  });

  it("quando alguém da equipe responde pelo celular, o bot não se mete", () => {
    const r = responder("e aí, quanto custa?", ctx, sessaoComPessoa(0), 1000);
    expect(r.resposta).toBeNull();
    expect(responder("menu", ctx, sessaoComPessoa(0), 1000).resposta).not.toBeNull();
  });

  it("ignora mensagem vazia", () => {
    expect(responder("   ", ctx).resposta).toBeNull();
  });
});

it("reconhece pedido de saída", () => {
  expect(ehPedidoDeSaida(" SAIR ")).toBe(true);
  expect(ehPedidoDeSaida("Parar.")).toBe(true);
  expect(ehPedidoDeSaida("quero sair cedo hoje")).toBe(false);
});

it("reconhece pedido de entrada (saudação abre o menu, não o link)", () => {
  for (const t of ["Quero entrar no Aprenda Livre", "entrar", "me manda o link?", "Meu código: AB3K9Q"]) {
    expect(ehPedidoDeEntrada(t), t).toBe(true);
  }
  for (const t of ["oi", "bom dia", "buscar python", "quero aprender web", "sair", "menu"]) {
    expect(ehPedidoDeEntrada(t), t).toBe(false);
  }
});
