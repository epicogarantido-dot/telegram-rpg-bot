import { describe, expect, it } from "vitest";
import { BancoProspeccao } from "./banco.ts";
import { buscarEstabelecimentos } from "./google-places.ts";
import { mensagemConvite } from "./mensagem.ts";
import { ehCelularBR, linkWhatsapp, normalizarTelefone } from "./telefone.ts";

describe("telefone", () => {
  it("normaliza formatos brasileiros", () => {
    expect(normalizarTelefone("+55 11 98765-4321")).toBe("5511987654321");
    expect(normalizarTelefone("(19) 3232-1010")).toBe("551932321010");
    expect(normalizarTelefone("123")).toBeUndefined();
  });
  it("distingue celular de fixo", () => {
    expect(ehCelularBR("5511987654321")).toBe(true);
    expect(ehCelularBR("551932321010")).toBe(false);
  });
  it("monta link do wa.me com texto codificado", () => {
    expect(linkWhatsapp("5511987654321", "oi tudo bem?")).toBe("https://wa.me/5511987654321?text=oi%20tudo%20bem%3F");
  });
});

describe("Places API", () => {
  it("pagina, normaliza e ignora fechados", async () => {
    const paginas = [
      { places: [
        { id: "a", displayName: { text: "Barbearia A" }, internationalPhoneNumber: "+55 11 98765-4321", businessStatus: "OPERATIONAL" },
        { id: "b", displayName: { text: "Fechada" }, businessStatus: "CLOSED_PERMANENTLY" },
      ], nextPageToken: "p2" },
      { places: [{ id: "c", displayName: { text: "Barbearia C" } }] },
    ];
    const corpos: any[] = [];
    const falsoFetch = (async (_url: string, init: RequestInit) => {
      corpos.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify(paginas.shift()));
    }) as typeof fetch;
    const r = await buscarEstabelecimentos("barbearia em Campinas", { chave: "x", fetch: falsoFetch });
    expect(r.map((e) => e.placeId)).toEqual(["a", "c"]);
    expect(r[0]!.telefone).toBe("5511987654321");
    expect(corpos[1].pageToken).toBe("p2");
  });
});

describe("banco", () => {
  it("não sobrescreve status ao recoletar e respeita opt-out", () => {
    const b = new BancoProspeccao(":memory:");
    const est = [{ placeId: "a", nome: "Barbearia A", telefone: "5511987654321" }];
    expect(b.salvarEstabelecimentos(est, "barbearia", "Campinas")).toBe(1);
    b.marcar("a", "contatado");
    expect(b.contatadosHoje()).toBe(1);
    expect(b.salvarEstabelecimentos(est, "barbearia", "Campinas")).toBe(0);
    expect(b.listar()[0]!.status).toBe("contatado");

    b.bloquear("5511987654321");
    expect(b.listar()[0]!.status).toBe("nao_contatar");
    // Mesmo telefone em outro estabelecimento já nasce bloqueado.
    b.salvarEstabelecimentos([{ placeId: "z", nome: "Filial", telefone: "5511987654321" }], "barbearia", "Campinas");
    expect(b.listar({ nicho: "barbearia" }).every((l) => l.status === "nao_contatar")).toBe(true);
  });
});

describe("mensagem", () => {
  it("é pessoal, tem link e opção de sair", () => {
    const m = mensagemConvite({ nome: "Barbearia do Zé - Centro", nota: 4.8, avaliacoes: 120 },
      { remetente: "João", linkComunidade: "https://chat.whatsapp.com/x", nichoPlural: "barbeiros" });
    expect(m).toContain("Barbearia do Zé!");
    expect(m).toContain("4,8");
    expect(m).toContain("https://chat.whatsapp.com/x");
    expect(m).toContain("SAIR");
  });
});
