import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { buscarNaReceita, buscarNoBrasil, linhasDoArquivo, type AchadoBrasil } from "./receita.ts";

/** .zip mínimo com um arquivo (cabeçalho local + deflate + resto qualquer), como os da Receita. */
function zip(nome: string, conteudo: string): Buffer {
  const dados = deflateRawSync(Buffer.from(conteudo, "latin1"));
  const cab = Buffer.alloc(30);
  cab.writeUInt32LE(0x04034b50, 0);
  cab.writeUInt16LE(8, 8);
  cab.writeUInt16LE(nome.length, 26);
  return Buffer.concat([cab, Buffer.from(nome), dados, Buffer.from("PK\x01\x02 índice central qualquer")]);
}

const q = (campos: string[]) => campos.map((c) => `"${c}"`).join(";");
function estab(basico: string, fantasia: string, municipio: string, tel: string, cnae = "9602501", uf = "RS"): string {
  return q([basico, "0001", "11", "1", fantasia, "02", "20200101", "00", "", "", "20190301", cnae, "", "RUA", "A", "1", "", "CENTRO", "97540000",
    uf, municipio, tel.slice(0, 2), tel.slice(2), "", "", "", "", "", "", ""]);
}

function receitaFalsa(arquivos: Record<string, string>): typeof fetch {
  const zips = Object.fromEntries(Object.entries(arquivos).map(([n, c]) => [n, zip(n.replace(".zip", ".csv"), c)]));
  return (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    if (init?.method === "PROPFIND") return new Response("<d:href>/x/2026-09/</d:href><d:href>/x/2026-10/</d:href>");
    const nome = u.split("/").at(-1)!;
    const dados = zips[nome] ?? zip(nome, "");
    const [, ini, fim] = /bytes=(\d+)-(\d+)/.exec(String((init?.headers as Record<string, string>)?.range))!.map(Number);
    const parte = dados.subarray(ini, Math.min(fim! + 1, dados.length));
    return new Response(new Uint8Array(parte), { status: 206, headers: { "content-range": `bytes ${ini}-${fim}/${dados.length}` } });
  }) as typeof fetch;
}

const arquivos = {
  "Municipios.zip": [q(["8507", "ALEGRETE"]), q(["7107", "SAO PAULO"])].join("\n"),
  "Estabelecimentos0.zip": [
    estab("11111111", "BARBEARIA DO ZE", "8507", "55999990001"),
    estab("22222222", "", "8507", "55999990002"),
    estab("33333333", "PADARIA", "8507", "55999990003", "1091101"),
    estab("44444444", "BARBER SHOP SP", "7107", "11999990004", "9602501", "SP"),
  ].join("\n"),
  "Estabelecimentos3.zip": estab("55555555", "SALAO DA ANA", "8507", "55999990005"),
  "Empresas2.zip": [q(["22222222", "12.345.678 JOAO BARBEIRO", "2135"]), q(["11111111", "JOSE DA SILVA", "2135"])].join("\n"),
};

describe("leitura dos arquivos da Receita (fluxo completo, sem rede)", () => {
  it("baixa em pedaços e descompacta as linhas", async () => {
    const linhas: string[] = [];
    for await (const l of linhasDoArquivo("2026-10", "Municipios.zip", { fetch: receitaFalsa(arquivos) })) linhas.push(l);
    expect(linhas).toEqual(['"8507";"ALEGRETE"', '"7107";"SAO PAULO"']);
  });

  it("busca por cidade: nicho, razão social, nome que confirma", async () => {
    const r = (await buscarNaReceita("barbearia", "Alegrete", "RS", { fetch: receitaFalsa(arquivos) })).get("Alegrete")!;
    expect(r.mes).toBe("2026-10");
    expect(r.totalNaCidade).toBe(4);
    expect(r.achados.map((a) => [a.nomeFantasia ?? a.razaoSocial, a.nomeConfirma]).sort()).toEqual([
      ["12.345.678 JOAO BARBEIRO", true], ["BARBEARIA DO ZE", true], ["SALAO DA ANA", false],
    ]);
  });

  it("Brasil inteiro: entrega em lotes com o nome da cidade", async () => {
    const lotes: AchadoBrasil[][] = [];
    const r = await buscarNoBrasil("barbearia", (l) => lotes.push(l), { fetch: receitaFalsa(arquivos), tamanhoLote: 2 });
    expect(r.total).toBe(4);
    expect(lotes.map((l) => l.length)).toEqual([2, 2]);
    const todos = lotes.flat();
    expect(todos.find((a) => a.uf === "SP")).toMatchObject({ cidade: "Sao Paulo", nomeConfirma: true, celular: true });
    expect(todos.filter((a) => a.cidade === "Alegrete")).toHaveLength(3);
  });
});
