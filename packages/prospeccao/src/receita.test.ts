import { describe, expect, it } from "vitest";
import { BancoProspeccao } from "./banco.ts";
import {
  ehDoNicho, estabelecimentoDaLinha, lerLinhaCsv, melhorTelefone, nomeConfirmaNicho, nomeDeExibicao, telefonesDeContador,
  type ResultadoReceita,
} from "./receita.ts";

/** Linha no formato do arquivo de Estabelecimentos (30 campos). */
function linha(campos: Partial<Record<number, string>>): string {
  const base = ["12345678", "0001", "90", "1", "", "02", "20200101", "00", "", "", "20200115", "9602501", "", "RUA", "DOS ANDRADAS",
    "100", "SALA 2", "CENTRO", "97541000", "RS", "8507", "55", "99912345", "", "", "", "", "DONO@EXEMPLO.COM", "", ""];
  for (const [i, v] of Object.entries(campos)) base[Number(i)] = v!;
  return base.map((c) => `"${c}"`).join(";");
}

describe("leitura da Receita", () => {
  it("quebra a linha com aspas e ponto e vírgula dentro do campo", () => {
    expect(lerLinhaCsv('"1";"A; B";"diz ""oi""";""')).toEqual(["1", "A; B", 'diz "oi"', ""]);
  });

  it("monta o estabelecimento ativo, com celular antigo de 8 dígitos corrigido", () => {
    const e = estabelecimentoDaLinha(lerLinhaCsv(linha({ 4: "BARBEARIA DO ZE" })))!;
    expect(e).toMatchObject({
      cnpj: "12345678000190", nomeFantasia: "BARBEARIA DO ZE", uf: "RS", municipio: "8507",
      telefones: ["5555999912345"], email: "dono@exemplo.com", abertura: "2020-01-15", bairro: "CENTRO",
    });
    expect(e.endereco).toBe("RUA DOS ANDRADAS, 100, SALA 2");
  });

  it("ignora empresa baixada ou inapta", () => {
    expect(estabelecimentoDaLinha(lerLinhaCsv(linha({ 5: "08" })))).toBeUndefined();
  });

  it("acha o nicho pela atividade principal ou secundária e confirma pelo nome", () => {
    const principal = estabelecimentoDaLinha(lerLinhaCsv(linha({})))!;
    const secundaria = estabelecimentoDaLinha(lerLinhaCsv(linha({ 11: "4781400", 12: "4772500,9602501" })))!;
    const outro = estabelecimentoDaLinha(lerLinhaCsv(linha({ 11: "4781400" })))!;
    expect(ehDoNicho(principal, "barbearia")).toBe(true);
    expect(ehDoNicho(secundaria, "barbearia")).toBe(true);
    expect(ehDoNicho(outro, "barbearia")).toBe(false);
    expect(nomeConfirmaNicho({ ...principal, nomeFantasia: "Studio Barber" }, "barbearia")).toBe(true);
    expect(nomeConfirmaNicho({ ...principal, nomeFantasia: "Salão da Ana" }, "barbearia")).toBe(false);
  });

  it("telefone repetido em várias empresas é do contador; prefere o celular do dono", () => {
    const contagem = new Map([["5555999990000", new Set(["a", "b", "c"])], ["5555999912345", new Set(["a"])]]);
    const contador = telefonesDeContador(contagem);
    expect([...contador]).toEqual(["5555999990000"]);
    expect(melhorTelefone(["5555999990000", "5555999912345"], contador)).toEqual({ telefone: "5555999912345", celular: true, contador: false });
    expect(melhorTelefone(["5555999990000"], contador)).toMatchObject({ contador: true });
    expect(melhorTelefone(["555534221234"], contador)).toMatchObject({ celular: false });
  });

  it("nome do MEI sem o número do começo", () => {
    expect(nomeDeExibicao({ razaoSocial: "12.345.678 JOAO DA SILVA", cnpj: "x" })).toBe("JOAO DA SILVA");
    expect(nomeDeExibicao({ nomeFantasia: "BARBEARIA X", razaoSocial: "12.345.678 JOAO", cnpj: "x" })).toBe("BARBEARIA X");
  });
});

describe("importação no banco de leads", () => {
  const resultado = (telefone?: string): ResultadoReceita => ({
    mes: "2026-10", totalNaCidade: 1,
    achados: [{
      ...estabelecimentoDaLinha(lerLinhaCsv(linha({ 4: "BARBEARIA DO ZE" })))!,
      telefone, celular: true, telefoneDeContador: false, nomeConfirma: true,
    }],
  });

  it("importa, avisa o que falta e não perde o trabalho de quem contatou", () => {
    const b = new BancoProspeccao(":memory:");
    expect(b.salvarDaReceita(resultado("5555999912345"), "barbearia", "Alegrete")).toEqual({ novos: 1, total: 1 });
    b.completar("cnpj:12345678000190", { instagram: "https://instagram.com/barbeariadoze/" });
    b.marcar("cnpj:12345678000190", "contatado");
    expect(b.salvarDaReceita(resultado("5555999912345"), "barbearia", "Alegrete").novos).toBe(0);
    const [lead] = b.listar();
    expect(lead).toMatchObject({ status: "contatado", instagram: "barbeariadoze", fonte: "receita", cnpj: "12345678000190" });
  });

  it("respeita quem pediu SAIR", () => {
    const b = new BancoProspeccao(":memory:");
    b.bloquear("5555999912345");
    b.salvarDaReceita(resultado("5555999912345"), "barbearia", "Alegrete");
    expect(b.listar()[0]!.status).toBe("nao_contatar");
  });

  it("lead manual junta com o da Receita pelo telefone", () => {
    const b = new BancoProspeccao(":memory:");
    b.salvarDaReceita(resultado("5555999912345"), "barbearia", "Alegrete");
    const r = b.salvarManual({ nome: "Barbearia do Zé", cidade: "Alegrete", nicho: "barbearia", telefone: "5555999912345", instagram: "@BarbeariaDoZe" });
    expect(r).toEqual({ placeId: "cnpj:12345678000190", novo: false });
    expect(b.listar()[0]!.instagram).toBe("barbeariadoze");
    expect(b.salvarManual({ nome: "Outra", cidade: "Alegrete", nicho: "barbearia", instagram: "outra.barber" }).novo).toBe(true);
  });
});

describe("barbearia, salão e manicure separados", () => {
  it("classifica pelo nome", async () => {
    const { classificarBeleza } = await import("./receita.ts");
    expect(classificarBeleza("BARBEARIA DO ZE")).toBe("barbearia");
    expect(classificarBeleza("Studio Barber Shop")).toBe("barbearia");
    expect(classificarBeleza("ESMALTERIA DA BIA")).toBe("manicure");
    expect(classificarBeleza("SALAO BELEZA PURA")).toBe("salao");
    expect(classificarBeleza("MARIA DA SILVA")).toBe("beleza_indefinido");
  });

  it("importa cada um no seu nicho e reclassifica base antiga", () => {
    const b = new BancoProspeccao(":memory:");
    const achado = (fantasia: string, cnpj: string) => ({
      ...estabelecimentoDaLinha(lerLinhaCsv(linha({ 0: cnpj, 4: fantasia })))!,
      cidade: "Alegrete", telefone: undefined, celular: false, telefoneDeContador: false, nomeConfirma: false,
    });
    b.salvarAchados([achado("BARBEARIA X", "11111111"), achado("ESMALTERIA Y", "22222222"), achado("", "33333333")], "barbearia");
    expect(b.listar({ nicho: "barbearia" }).map((l) => l.nome)).toEqual(["BARBEARIA X"]);
    expect(b.listar({ nicho: "manicure" })).toHaveLength(1);
    expect(b.listar({ nicho: "beleza_indefinido" })[0]!.avisos).toContain("nome não diz");
    // base antiga: tudo como barbearia
    b.db.exec("UPDATE leads SET nicho = 'barbearia'");
    expect(b.reclassificarBeleza()).toEqual({ barbearia: 1, manicure: 1, beleza_indefinido: 1 });
  });
});
