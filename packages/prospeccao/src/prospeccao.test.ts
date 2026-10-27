import { describe, expect, it } from "vitest";
import { BancoProspeccao } from "./banco.ts";
import { buscarEstabelecimentos } from "./google-places.ts";
import { mensagemCursos, mensagemDemonstracao, mensagemLembrete, mensagemPrimeiroContato, mensagemSegunda, nomeParaMensagem, proximoPasso } from "./mensagem.ts";
import { buscarNoOSM, montarConsulta } from "./openstreetmap.ts";
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
  const cfg = { remetente: "João, do Aprenda Livre", siteUrl: "https://exemplo.com" };
  const agora = new Date("2026-10-26T12:00:00Z");

  it("arruma o nome em maiúsculas da Receita", () => {
    expect(nomeParaMensagem("BARBEARIA DO ZE - CENTRO")).toBe("Barbearia do Ze");
    expect(nomeParaMensagem("Barber Shop do Léo")).toBe("Barber Shop do Léo");
    expect(nomeParaMensagem("3XR BARBEARIA E LANCHERIA")).toBe("3XR Barbearia e Lancheria");
  });

  it("1ª mensagem: quem é, por que esta barbearia, pergunta fácil, SAIR e nenhum link", () => {
    const m = mensagemPrimeiroContato({ nome: "Barbearia do Zé - Centro" }, cfg,
      { detalhe: "do degradê do último post", onde: "no Instagram", agora });
    expect(m).toContain("Aqui é João, do Aprenda Livre");
    expect(m).toContain("Vi a Barbearia do Zé no Instagram e gostei do degradê do último post.");
    expect(m).toContain("pelo WhatsApp ou é por ordem de chegada?");
    expect(m).toContain("SAIR");
    expect(m).not.toMatch(/https?:/);
  });

  it("sem detalhe usa o tempo de casa, e nada de elogio inventado", () => {
    expect(mensagemPrimeiroContato({ nome: "BARBEARIA X", abertura: "2019-03-01" }, cfg, { agora })).toContain("desde 2019");
    const nova = mensagemPrimeiroContato({ nome: "BARBEARIA X", abertura: "2025-03-01" }, cfg, { agora });
    expect(nova).toContain("Vi a Barbearia X. Pergunta rápida");
  });

  it("a sequência: 2ª sem link, demonstração com link, lembrete com SAIR, cursos com o bot", () => {
    expect(mensagemSegunda({ nome: "Barbearia X" }, "whatsapp")).not.toMatch(/https?:/);
    expect(mensagemSegunda({ nome: "Barbearia X" }, "chegada")).toContain("fila");
    expect(mensagemDemonstracao({ nome: "Barbearia X" }, "https://s/b/x?convite=a")).toContain("https://s/b/x?convite=a");
    expect(mensagemLembrete({ nome: "Barbearia X" })).toContain("SAIR");
    expect(mensagemCursos(cfg)).toContain("https://exemplo.com/cursos");
    expect(mensagemCursos({ remetente: "João" })).toBeUndefined();
  });

  it("lembrete no 3º dia, desiste 4 dias depois do lembrete", () => {
    const dias = (n: number) => new Date(agora.getTime() - n * 86_400_000).toISOString();
    expect(proximoPasso({ status: "contatado", atualizadoEm: dias(2) }, agora)).toBeUndefined();
    expect(proximoPasso({ status: "contatado", atualizadoEm: dias(3) }, agora)).toBe("lembrete");
    expect(proximoPasso({ status: "lembrete", atualizadoEm: dias(3) }, agora)).toBeUndefined();
    expect(proximoPasso({ status: "lembrete", atualizadoEm: dias(4) }, agora)).toBe("desistir");
    expect(proximoPasso({ status: "respondeu", atualizadoEm: dias(30) }, agora)).toBeUndefined();
  });
});

describe("OpenStreetMap", () => {
  it("monta consulta por município e escapa aspas", () => {
    const q = montarConsulta("barbearia", 'São "Paulo"');
    expect(q).toContain('["name"="São \\"Paulo\\""]');
    expect(q).toContain('nwr["shop"="barber"](area.cidade);');
    expect(() => montarConsulta("astronauta", "X")).toThrow(/sem filtro/);
  });

  it("converte elementos, prefere WhatsApp e ignora sem nome/duplicados", async () => {
    const falso = (async () => new Response(JSON.stringify({ elements: [
      { type: "node", id: 1, tags: { name: "Barbearia Um", phone: "+55 19 3232-1010", "contact:whatsapp": "+55 19 98888-0000", "addr:street": "Rua A", "addr:housenumber": "10" } },
      { type: "node", id: 1, tags: { name: "Barbearia Um" } },
      { type: "way", id: 2, tags: { name: "Dois", phone: "+55 19 99999-1111;+55 19 3333-2222" } },
      { type: "node", id: 3, tags: { shop: "barber" } },
    ] }))) as unknown as typeof fetch;
    const r = await buscarNoOSM("barbearia", "Campinas", { fetch: falso });
    expect(r.map((e) => e.placeId)).toEqual(["osm:node/1", "osm:way/2"]);
    expect(r[0]!.telefone).toBe("5519988880000");
    expect(r[0]!.endereco).toBe("Rua A, 10");
    expect(r[1]!.telefone).toBe("5519999991111");
    expect(r[1]!.mapsUrl).toBe("https://www.openstreetmap.org/way/2");
  });
});
