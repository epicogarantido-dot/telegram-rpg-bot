import { describe, expect, it } from "vitest";
import { BancoAgenda, ErroAgenda, gerarSlug } from "./banco.ts";
import { horariosLivres } from "./disponibilidade.ts";
import { agoraNoFuso, diaDaSemana, somarDias } from "./tempo.ts";
import { conferirSenha, hashSenha } from "./senha.ts";

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
    const b = new BancoAgenda(":memory:");
    const { barbearia, token } = b.criarConta({
      nomeBarbearia: "Barbearia São João", telefone: "5519900000001", nome: "Zé", email: "Ze@Exemplo.com", senha: "segredo123",
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
    const outra = b.criarConta({ nomeBarbearia: "Outra", telefone: "5519900000009", nome: "Ana", email: "ana@x.com", senha: "segredo123" });
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
