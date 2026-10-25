import { describe, expect, it } from "vitest";
import { BancoAgenda, ErroAgenda, gerarSlug } from "./banco.ts";
import { horariosLivres } from "./disponibilidade.ts";
import { agoraNoFuso, diaDaSemana, somarDias } from "./tempo.ts";
import { conferirSenha, hashSenha } from "./senha.ts";
import { crc16, gerarPixCopiaECola } from "./pix.ts";

describe("tempo", () => {
  it("converte o agora para o fuso da barbearia", () => {
    expect(agoraNoFuso("America/Sao_Paulo", new Date("2026-10-27T15:00:00Z"))).toBe("2026-10-27T12:00");
    expect(agoraNoFuso("America/Manaus", new Date("2026-10-27T15:00:00Z"))).toBe("2026-10-27T11:00");
  });
  it("calcula dia da semana e soma dias", () => {
    expect(diaDaSemana("2026-10-27")).toBe(2); // terça
    expect(somarDias("2026-10-31", 1)).toBe("2026-11-01");
  });
});

describe("horariosLivres", () => {
  const base = { data: "2026-10-28", duracao: 30, agora: "2026-10-27T10:00", ocupados: [] };
  const exp = { abre: "09:00", fecha: "11:00" };

  it("lista horários do expediente", () => {
    expect(horariosLivres({ ...base, expediente: exp })).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });
  it("não cabe serviço que passa do fechamento", () => {
    expect(horariosLivres({ ...base, duracao: 90, expediente: exp })).toEqual(["09:00", "09:30"]);
  });
  it("respeita ocupados e pausa", () => {
    const r = horariosLivres({
      ...base, expediente: { ...exp, pausaInicio: "10:30", pausaFim: "11:00" },
      ocupados: [{ inicio: "2026-10-28T09:30", fim: "2026-10-28T10:00" }],
    });
    expect(r).toEqual(["09:00", "10:00"]);
  });
  it("hoje só a partir de agora + antecedência; ontem nada; dia fechado nada", () => {
    expect(horariosLivres({ ...base, data: "2026-10-27", agora: "2026-10-27T09:10", expediente: exp })).toEqual(["10:00", "10:30"]);
    expect(horariosLivres({ ...base, data: "2026-10-26", expediente: exp })).toEqual([]);
    expect(horariosLivres({ ...base, expediente: undefined })).toEqual([]);
  });
});

describe("senha", () => {
  it("confere só a senha certa", () => {
    const h = hashSenha("segredo123");
    expect(conferirSenha("segredo123", h)).toBe(true);
    expect(conferirSenha("errada", h)).toBe(false);
  });
});

describe("BancoAgenda", () => {
  // Terça, 27/10/2026, 10:00 em São Paulo.
  const agora = new Date("2026-10-27T13:00:00Z");

  function novo() {
    const b = new BancoAgenda(":memory:", { valorCentavos: 2990, dias: 30, testeDias: 7 });
    const { barbearia, token } = b.criarConta({
      nomeBarbearia: "Barbearia São João", telefone: "5519900000001", nome: "Zé", email: "Ze@Exemplo.com", senha: "segredo123", agora,
    });
    return { b, barbearia, token };
  }

  it("cria conta com slug, sessão e configuração inicial", () => {
    const { b, barbearia, token } = novo();
    expect(barbearia.slug).toBe("barbearia-sao-joao");
    expect(b.usuarioDaSessao(token)?.email).toBe("ze@exemplo.com");
    expect(b.servicos(barbearia.id)).toHaveLength(3);
    expect(b.expedientes(barbearia.id).has(0)).toBe(false); // domingo fechado
    expect(() => b.criarConta({ nomeBarbearia: "X", telefone: "5519900000002", nome: "Y", email: "ze@exemplo.com", senha: "12345678" }))
      .toThrow(ErroAgenda);
    expect(() => b.entrar("ze@exemplo.com", "errada")).toThrow(ErroAgenda);
    expect(b.usuarioDaSessao(b.entrar("ZE@exemplo.com", "segredo123"))).toBeDefined();
  });

  it("agenda, bloqueia horário duplicado e libera ao cancelar", () => {
    const { b, barbearia } = novo();
    const prof = b.profissionais(barbearia.id)[0]!;
    const corte = b.servicos(barbearia.id)[0]!;
    const pedido = {
      barbeariaId: barbearia.id, profissionalId: prof.id, servicoId: corte.id, data: "2026-10-28", hora: "09:00",
      clienteNome: "Cliente", clienteTelefone: "5519988887777", agora,
    };
    const id = b.agendar(pedido);
    expect(b.horariosLivres(barbearia.id, prof.id, corte.id, "2026-10-28", agora)).not.toContain("09:00");
    expect(() => b.agendar(pedido)).toThrow(/ocupado/);
    b.cancelar(barbearia.id, id);
    expect(b.horariosLivres(barbearia.id, prof.id, corte.id, "2026-10-28", agora)).toContain("09:00");
  });

  it("isola barbearias", () => {
    const { b, barbearia } = novo();
    const outra = b.criarConta({ nomeBarbearia: "Outra", telefone: "5519900000009", nome: "Ana", email: "ana@x.com", senha: "segredo123", agora });
    const prof = b.profissionais(barbearia.id)[0]!;
    const corte = b.servicos(barbearia.id)[0]!;
    // Profissional/serviço de outra barbearia não podem ser usados.
    expect(() => b.agendar({
      barbeariaId: outra.barbearia.id, profissionalId: prof.id, servicoId: corte.id, data: "2026-10-28", hora: "09:00",
      clienteNome: "Xico", clienteTelefone: "5519988887777", agora,
    })).toThrow(ErroAgenda);
    const id = b.agendar({
      barbeariaId: barbearia.id, profissionalId: prof.id, servicoId: corte.id, data: "2026-10-28", hora: "09:00",
      clienteNome: "Xico", clienteTelefone: "5519988887777", agora,
    });
    expect(b.agendamento(outra.barbearia.id, id)).toBeUndefined();
    b.cancelar(outra.barbearia.id, id);
    expect(b.agendamento(barbearia.id, id)?.status).toBe("confirmado");
  });

  it("gera slug sem acento", () => {
    expect(gerarSlug("  Barbearia do Zé & Filhos!! ")).toBe("barbearia-do-ze-filhos");
  });
});

describe("Pix", () => {
  it("CRC16-CCITT bate com o vetor de referência", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("reproduz o exemplo do manual do BR Code do Banco Central", () => {
    expect(gerarPixCopiaECola({
      chave: "123e4567-e12b-12d1-a456-426655440000", nome: "Fulano de Tal", cidade: "BRASILIA", valorCentavos: 0, txid: "***",
    })).toBe("00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D");
  });

  it("inclui valor, limpa acentos e limita tamanhos", () => {
    const p = gerarPixCopiaECola({ chave: "a@b.com", nome: "José da Conceição Ferreira Júnior", cidade: "São José dos Campos", valorCentavos: 2990, txid: "AG1X-AB" });
    expect(p).toContain("540529.90");
    expect(p).toContain("5925Jose da Conceicao Ferreir6015");
    expect(p).toContain("6015Sao Jose dos Ca");
    expect(p).toContain("62100506AG1XAB");
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });
});

describe("assinatura", () => {
  const dia = (d: string) => new Date(`${d}T15:00:00Z`); // meio-dia em SP

  function conta(testeDias: number) {
    const b = new BancoAgenda(":memory:", { valorCentavos: 2990, dias: 30, testeDias });
    const { barbearia } = b.criarConta({ nomeBarbearia: "B", telefone: "5519900000001", nome: "Zé", email: "z@x.com", senha: "segredo123", agora: dia("2026-10-27") });
    return { b, id: barbearia.id };
  }

  it("teste grátis acaba e bloqueia, inclusive a página pública", () => {
    const { b, id } = conta(7);
    const barb = () => b.barbeariaPorId(id)!;
    expect(barb().acessoAte).toBe("2026-11-02");
    expect(b.diasRestantes(barb(), dia("2026-10-27"))).toBe(7);
    expect(b.acessoAtivo(barb(), dia("2026-11-02"))).toBe(true);
    expect(b.acessoAtivo(barb(), dia("2026-11-03"))).toBe(false);
    const prof = b.profissionais(id)[0]!;
    const serv = b.servicos(id)[0]!;
    expect(() => b.agendar({ barbeariaId: id, profissionalId: prof.id, servicoId: serv.id, data: "2026-11-04", hora: "09:00",
      clienteNome: "Cliente", clienteTelefone: "5519988887777", agora: dia("2026-11-03") })).toThrow(/indisponível/);
  });

  it("sem teste, nasce bloqueado; 'já paguei' não libera; só o admin libera", () => {
    const { b, id } = conta(0);
    const barb = () => b.barbeariaPorId(id)!;
    expect(b.acessoAtivo(barb(), dia("2026-10-27"))).toBe(false);

    const p = b.pagamentoAberto(id);
    expect(b.pagamentoAberto(id).id).toBe(p.id); // não duplica
    b.informarPagamento(id, p.id, "José Silva");
    expect(b.acessoAtivo(barb(), dia("2026-10-27"))).toBe(false);
    expect(b.pagamentosPendentes()[0]!.status).toBe("informado");

    b.confirmarPagamento(p.id, dia("2026-10-27"));
    expect(barb().acessoAte).toBe("2026-11-25");
    expect(() => b.confirmarPagamento(p.id)).toThrow(ErroAgenda);
    expect(b.pagamentoAberto(id).id).not.toBe(p.id);
  });

  it("renovação antecipada soma ao fim do período atual", () => {
    const { b, id } = conta(7); // até 02/11
    b.confirmarPagamento(b.pagamentoAberto(id).id, dia("2026-10-30"));
    expect(b.barbeariaPorId(id)!.acessoAte).toBe("2026-12-02");
  });

  it("barbearia não informa pagamento de outra; recusa e bloqueio manual", () => {
    const { b, id } = conta(7);
    const outra = b.criarConta({ nomeBarbearia: "C", telefone: "5519900000002", nome: "Ana", email: "a@x.com", senha: "segredo123" });
    const p = b.pagamentoAberto(id);
    expect(() => b.informarPagamento(outra.barbearia.id, p.id, "x")).toThrow(ErroAgenda);
    b.recusarPagamento(p.id);
    expect(b.pagamentosDaBarbearia(id)[0]!.status).toBe("recusado");
    b.bloquear(id, dia("2026-10-28"));
    expect(b.acessoAtivo(b.barbeariaPorId(id)!, dia("2026-10-28"))).toBe(false);
  });

  it("migra banco antigo sem a coluna acesso_ate", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const { DatabaseSync } = await import("node:sqlite");
    const arq = join(mkdtempSync(join(tmpdir(), "agenda-")), "velho.db");
    const velho = new DatabaseSync(arq);
    velho.exec(`CREATE TABLE barbearias (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, nome TEXT NOT NULL,
      telefone TEXT NOT NULL, endereco TEXT, fuso TEXT NOT NULL DEFAULT 'America/Sao_Paulo', criado_em TEXT NOT NULL);
      INSERT INTO barbearias (slug, nome, telefone, criado_em) VALUES ('x', 'X', '5519900000001', '2026-01-01');`);
    velho.close();
    const b = new BancoAgenda(arq);
    expect(b.barbeariaPorSlug("x")!.acessoAte).toBe("1970-01-01");
  });
});
