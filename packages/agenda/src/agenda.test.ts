import { describe, expect, it } from "vitest";
import { BancoAgenda, ErroAgenda, gerarSlug, planoDoAmbiente } from "./banco.ts";
import { horariosLivres } from "./disponibilidade.ts";
import { agoraNoFuso, diaDaSemana, somarDias } from "./tempo.ts";
import { conferirSenha, hashSenha } from "./senha.ts";
import { crc16, gerarPixCopiaECola } from "./pix.ts";

/** Plano com conta já liberada ao criar: os testes de agenda não dependem do padrão do .env. */
const PLANO_LIBERADO = { valorCentavos: 2990, dias: 30, testeDias: 7 };

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
  it("folga entre clientes e encaixe logo depois de cada um", () => {
    const longo = { abre: "09:00", fecha: "12:00" };
    // Corte de 40 min às 9h com 10 de folga: o próximo pode começar 9h50, não 9h40 nem 9h30.
    const r = horariosLivres({
      ...base, duracao: 40, folga: 10, expediente: longo,
      ocupados: [{ inicio: "2026-10-28T09:00", fim: "2026-10-28T09:40" }],
    });
    expect(r).toContain("09:50");
    expect(r).not.toContain("09:30");
    // Antes de um cliente também precisa da folga: 10h40 com 40 min termina 11h20, encosta num cliente às 11h25.
    const antes = horariosLivres({
      ...base, duracao: 40, folga: 10, expediente: longo,
      ocupados: [{ inicio: "2026-10-28T11:25", fim: "2026-10-28T12:00" }],
    });
    expect(antes).toContain("10:30");
    expect(antes).not.toContain("10:40");
    // Bloqueio do barbeiro não pede folga.
    const bloqueio = horariosLivres({
      ...base, duracao: 30, folga: 15, expediente: longo,
      ocupados: [{ inicio: "2026-10-28T09:00", fim: "2026-10-28T10:00", semFolga: true }],
    });
    expect(bloqueio[0]).toBe("10:00");
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
    expect(b.servicos(barbearia.id)).toHaveLength(4);
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
  it("sem PLANO_TESTE_DIAS, não há período grátis", () => {
    const antes = process.env.PLANO_TESTE_DIAS;
    delete process.env.PLANO_TESTE_DIAS;
    try { expect(planoDoAmbiente().testeDias).toBe(0); }
    finally { if (antes !== undefined) process.env.PLANO_TESTE_DIAS = antes; }
  });

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
    const b = new BancoAgenda(arq, PLANO_LIBERADO);
    expect(b.barbeariaPorSlug("x")!.acessoAte).toBe("1970-01-01");
  });
});

describe("site da barbearia", () => {
  async function imagem(largura: number, altura: number, comGps = false) {
    const sharp = (await import("sharp")).default;
    let img = sharp({ create: { width: largura, height: altura, channels: 3, background: { r: 120, g: 80, b: 40 } } }).jpeg();
    if (comGps) img = img.withExif({ IFD0: { Make: "Celular" }, IFD3: { GPSLatitudeRef: "S", GPSLatitude: "23/1 33/1 0/1" } });
    return img.toBuffer();
  }

  it("tema, textos e instagram validados", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const { barbearia } = b.criarConta({ nomeBarbearia: "B", telefone: "5519900000001", nome: "Zé", email: "z@x.com", senha: "segredo123" });
    expect(barbearia.tema).toBe("silencioso");
    b.atualizarSite(barbearia.id, { tema: "potencia", bio: " Degradê na régua ", instagram: "https://instagram.com/navalha.ouro/", oferta: "10% na 1ª visita" });
    const x = b.barbeariaPorId(barbearia.id)!;
    expect([x.tema, x.bio, x.instagram]).toEqual(["potencia", "Degradê na régua", "navalha.ouro"]);
    expect(() => b.atualizarSite(barbearia.id, { tema: "rosa-choque" })).toThrow(ErroAgenda);
    expect(() => b.atualizarSite(barbearia.id, { tema: "potencia", instagram: "<script>" })).toThrow(/Instagram/);
  });

  it("fotos: isoladas por barbearia, capa única, profissional com foto", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    const f1 = b.registrarFoto(a.id, { categoria: "degrade", largura: 800, altura: 1000 });
    const f2 = b.registrarFoto(a.id, { categoria: "ambiente", largura: 1600, altura: 900 });
    expect(() => b.registrarFoto(a.id, { categoria: "nudes", largura: 1, altura: 1 })).toThrow(ErroAgenda);
    const [id2, id1] = b.fotos(a.id).map((f) => f.id);
    b.definirCapa(a.id, id1!);
    b.definirCapa(a.id, id2!);
    expect(b.fotos(a.id).filter((f) => f.capa).map((f) => f.arquivo)).toEqual([f2]);
    expect(b.fotos(a.id, "degrade").map((f) => f.arquivo)).toEqual([f1]);
    // Outra barbearia não mexe nem usa a foto.
    expect(b.removerFoto(o.id, id1!)).toBeUndefined();
    const prof = b.profissionais(a.id)[0]!;
    expect(() => b.atualizarProfissional(o.id, prof.id, { fotoArquivo: f1 })).toThrow(ErroAgenda);
    b.atualizarProfissional(a.id, prof.id, { especialidade: "Degradê", fotoArquivo: f1 });
    expect(b.profissionais(a.id)[0]).toMatchObject({ especialidade: "Degradê", fotoArquivo: f1 });
    // Apagar a foto tira ela do profissional.
    expect(b.removerFoto(a.id, id1!)).toBe(f1);
    expect(b.profissionais(a.id)[0]!.fotoArquivo).toBeNull();
    expect(b.fotoExiste(f1)).toBe(false);
  });

  it("processa imagem: redimensiona, vira WebP e tira o GPS", async () => {
    const { processarFoto } = await import("./imagens.ts");
    const sharp = (await import("sharp")).default;
    const r = await processarFoto(await imagem(4000, 3000, true));
    expect([r.largura, r.altura]).toEqual([1600, 1200]);
    const meta = await sharp(r.grande).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
    expect((await sharp(r.pequena).metadata()).width).toBe(640);
    await expect(processarFoto(Buffer.from("<?php echo 1; ?>"))).rejects.toThrow(/não é uma imagem/);
  });

  it("leitura do disco só aceita nomes no formato esperado", async () => {
    const { lerFoto, nomeValido } = await import("./imagens.ts");
    expect(nomeValido("../../etc/passwd")).toBe(false);
    expect(lerFoto("../segredo.webp", "/tmp")).toBeUndefined();
    expect(nomeValido("3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f-p.webp")).toBe(true);
  });
});

describe("efeitos: ano de abertura e antes/depois", () => {
  it("valida o ano e guarda", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const { barbearia } = b.criarConta({ nomeBarbearia: "B", telefone: "5519900000001", nome: "Zé", email: "z@x.com", senha: "segredo123" });
    b.atualizarSite(barbearia.id, { tema: "tecnico", desde: 2015 });
    expect(b.barbeariaPorId(barbearia.id)!.desde).toBe(2015);
    expect(() => b.atualizarSite(barbearia.id, { tema: "tecnico", desde: 3000 })).toThrow(/Ano/);
    b.atualizarSite(barbearia.id, { tema: "tecnico", desde: null });
    expect(b.barbeariaPorId(barbearia.id)!.desde).toBeUndefined();
  });

  it("pares de antes e depois: só da mesma barbearia, somem ao apagar", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    const antes = b.registrarFoto(a.id, { categoria: "corte", largura: 800, altura: 1000 });
    const depois = b.registrarFoto(a.id, { categoria: "degrade", largura: 800, altura: 1000 });
    const deOutra = b.registrarFoto(o.id, { categoria: "degrade", largura: 800, altura: 1000 });
    const idAntes = b.fotos(a.id).find((f) => f.arquivo === antes)!.id;
    expect(() => b.definirAntes(a.id, idAntes, deOutra)).toThrow(ErroAgenda);
    expect(() => b.definirAntes(a.id, idAntes, antes)).toThrow(ErroAgenda);
    expect(() => b.definirAntes(o.id, idAntes, deOutra)).toThrow(/não encontrada/);
    b.definirAntes(a.id, idAntes, depois);
    expect(b.paresAntesDepois(a.id).map((p) => [p.antes.arquivo, p.depois.arquivo])).toEqual([[antes, depois]]);
    b.removerFoto(a.id, b.fotos(a.id).find((f) => f.arquivo === depois)!.id);
    expect(b.paresAntesDepois(a.id)).toEqual([]);
    expect(b.fotos(a.id)[0]!.antesDe).toBeNull();
  });
});

describe("avisos no celular do barbeiro", () => {
  const sub = (n: number) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/aparelho-${n}`, p256dh: "B".repeat(87), auth: "a".repeat(22) });

  it("guarda por barbearia, troca de dono sem duplicar e remove só o próprio", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    b.salvarInscricaoAviso(a.id, sub(1));
    b.salvarInscricaoAviso(a.id, sub(1));
    expect(b.inscricoesAviso(a.id)).toHaveLength(1);
    b.removerInscricaoAviso(sub(1).endpoint, o.id);
    expect(b.inscricoesAviso(a.id)).toHaveLength(1);
    b.salvarInscricaoAviso(o.id, sub(1));
    expect(b.inscricoesAviso(a.id)).toHaveLength(0);
    expect(b.inscricoesAviso(o.id)).toHaveLength(1);
    b.removerInscricaoAviso(sub(1).endpoint);
    expect(b.inscricoesAviso(o.id)).toHaveLength(0);
  });

  it("recusa endereço estranho e passa do limite de aparelhos", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    expect(() => b.salvarInscricaoAviso(a.id, { ...sub(1), endpoint: "http://inseguro.com/x" })).toThrow(ErroAgenda);
    expect(() => b.salvarInscricaoAviso(a.id, { ...sub(1), auth: "<script>" })).toThrow(ErroAgenda);
    for (let i = 0; i < 10; i++) b.salvarInscricaoAviso(a.id, sub(i));
    expect(() => b.salvarInscricaoAviso(a.id, sub(99))).toThrow(/Limite/);
  });

  it("dados do aviso só saem pra barbearia dona do agendamento", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    const servico = b.servicos(a.id, true)[0]!;
    const prof = b.profissionais(a.id, true)[0]!;
    const agora = new Date();
    let id = 0;
    for (let i = 1; i < 10 && !id; i++) {
      const data = somarDias(agoraNoFuso(a.fuso, agora).slice(0, 10), i);
      const hora = b.horariosLivres(a.id, prof.id, servico.id, data, agora)[0];
      if (hora) id = b.agendar({ barbeariaId: a.id, profissionalId: prof.id, servicoId: servico.id, data, hora, clienteNome: "Lucas", clienteTelefone: "5519998765432", agora });
    }
    expect(b.agendamentoParaAviso(a.id, id)).toMatchObject({ clienteNome: "Lucas", servico: servico.nome, profissional: prof.nome });
    expect(b.agendamentoParaAviso(o.id, id)).toBeUndefined();
  });

  it("configurações guardam e trocam valor", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    expect(b.configuracao("x")).toBeUndefined();
    b.definirConfiguracao("x", "1");
    b.definirConfiguracao("x", "2");
    expect(b.configuracao("x")).toBe("2");
  });
});

describe("funcionamento: preços, intervalo, atendimento, fila e fechar hoje", () => {
  function conta() {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const { barbearia } = b.criarConta({ nomeBarbearia: "Navalha", telefone: "5519900000001", nome: "Zé", email: "z@x.com", senha: "segredo123" });
    return { b, id: barbearia.id };
  }
  // Próximo dia aberto (a conta nova abre de terça a sábado).
  function proximoDiaAberto(b: BancoAgenda, id: number, agora: Date) {
    const hoje = agoraNoFuso("America/Sao_Paulo", agora).slice(0, 10);
    for (let i = 1; i <= 7; i++) { const d = somarDias(hoje, i); if (b.expedientes(id).has(diaDaSemana(d))) return d; }
    throw new Error("sem dia aberto");
  }

  it("padrões: mostra preço, 30 min, só agenda", () => {
    const { b, id } = conta();
    expect(b.barbeariaPorId(id)).toMatchObject({ mostrarPrecos: true, intervaloMin: 30, atendimento: "agenda" });
  });

  it("intervalo muda os horários oferecidos", () => {
    const { b, id } = conta();
    const agora = new Date();
    const dia = proximoDiaAberto(b, id, agora);
    const [s] = b.servicos(id, true);
    const [p] = b.profissionais(id, true);
    const de30 = b.horariosLivres(id, p!.id, s!.id, dia, agora);
    b.atualizarFuncionamento(id, { mostrarPrecos: false, intervaloMin: 60, atendimento: "agenda" });
    const de60 = b.horariosLivres(id, p!.id, s!.id, dia, agora);
    expect(de60.length).toBeLessThan(de30.length);
    expect(de60.every((h) => h.endsWith(":00"))).toBe(true);
    expect(b.barbeariaPorId(id)!.mostrarPrecos).toBe(false);
    expect(() => b.atualizarFuncionamento(id, { mostrarPrecos: true, intervaloMin: 45, atendimento: "agenda" })).toThrow(ErroAgenda);
    expect(() => b.atualizarFuncionamento(id, { mostrarPrecos: true, intervaloMin: 30, atendimento: "festa" })).toThrow(ErroAgenda);
  });

  it("só ordem de chegada não oferece horários", () => {
    const { b, id } = conta();
    const agora = new Date();
    const dia = proximoDiaAberto(b, id, agora);
    const [s] = b.servicos(id, true);
    const [p] = b.profissionais(id, true);
    b.atualizarFuncionamento(id, { mostrarPrecos: true, intervaloMin: 30, atendimento: "chegada" });
    expect(b.horariosLivres(id, p!.id, s!.id, dia, agora)).toEqual([]);
  });

  it("fechar hoje vale só pro dia de hoje e reabre", () => {
    const { b, id } = conta();
    b.fecharHoje(id, true);
    expect(b.fechadoHoje(b.barbeariaPorId(id)!)).toBe(true);
    expect(b.fechadoHoje(b.barbeariaPorId(id)!, new Date(Date.now() + 86_400_000))).toBe(false);
    b.fecharHoje(id, false);
    expect(b.fechadoHoje(b.barbeariaPorId(id)!)).toBe(false);
  });

  it("fila: aparece só em quem atende por chegada e some quando fica velha", () => {
    const { b, id } = conta();
    const agora = new Date("2026-10-27T15:00:00Z");
    b.definirFila(id, 3, agora);
    expect(b.filaAgora(b.barbeariaPorId(id)!, agora)).toBeUndefined();
    b.atualizarFuncionamento(id, { mostrarPrecos: true, intervaloMin: 30, atendimento: "ambos" });
    const fila = b.filaAgora(b.barbeariaPorId(id)!, new Date(agora.getTime() + 10 * 60_000))!;
    expect(fila).toMatchObject({ pessoas: 3, haMin: 10 });
    expect(fila.esperaMin).toBeGreaterThan(0);
    expect(b.filaAgora(b.barbeariaPorId(id)!, new Date(agora.getTime() + 4 * 3_600_000))).toBeUndefined();
    expect(() => b.definirFila(id, -1)).toThrow(ErroAgenda);
    expect(() => b.definirFila(id, 1.5)).toThrow(ErroAgenda);
  });

  it("edita serviço e nome do profissional, só da própria barbearia", () => {
    const { b, id } = conta();
    const outra = b.criarConta({ nomeBarbearia: "Outra", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    const [s] = b.servicos(id);
    const [p] = b.profissionais(id);
    b.atualizarServico(id, s!.id, { nome: " Corte  social ", duracaoMin: 40, precoCentavos: 5000 });
    expect(b.servicos(id)[0]).toMatchObject({ nome: "Corte social", duracaoMin: 40, precoCentavos: 5000 });
    b.atualizarServico(outra.id, s!.id, { nome: "Invasão", duracaoMin: 40, precoCentavos: 1 });
    expect(b.servicos(id)[0]!.nome).toBe("Corte social");
    expect(() => b.atualizarServico(id, s!.id, { nome: "", duracaoMin: 40, precoCentavos: 1 })).toThrow(ErroAgenda);
    b.atualizarProfissional(id, p!.id, { nome: "Rafa" });
    b.atualizarProfissional(outra.id, p!.id, { nome: "Invasor" });
    expect(b.profissionais(id)[0]!.nome).toBe("Rafa");
    expect(() => b.adicionarProfissional(id, " ")).toThrow(ErroAgenda);
  });
});

describe("link do cliente: cancelar e remarcar", () => {
  function cenario() {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    const agora = new Date();
    const hoje = agoraNoFuso(a.fuso, agora).slice(0, 10);
    const dias = Array.from({ length: 10 }, (_, i) => somarDias(hoje, i + 1)).filter((d) => b.expedientes(a.id).has(diaDaSemana(d)));
    const [s] = b.servicos(a.id, true);
    const [p] = b.profissionais(a.id, true);
    const hora = b.horariosLivres(a.id, p!.id, s!.id, dias[0]!, agora)[0]!;
    const id = b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: s!.id, data: dias[0]!, hora, clienteNome: "Lucas", clienteTelefone: "5519998765432", agora });
    const token = b.criarLinkCliente(a.id, id);
    return { b, a, o, agora, dias, s: s!, p: p!, hora, id, token };
  }

  it("o link só abre na barbearia certa e com o token certo", () => {
    const { b, a, o, token, hora } = cenario();
    expect(b.horarioDoCliente(a.id, token)).toMatchObject({ clienteNome: "Lucas", status: "confirmado", passou: false });
    expect(b.horarioDoCliente(a.id, token)!.inicio.endsWith(hora)).toBe(true);
    expect(b.horarioDoCliente(o.id, token)).toBeUndefined();
    expect(b.horarioDoCliente(a.id, token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"))).toBeUndefined();
    expect(b.horarioDoCliente(a.id, "' OR 1=1 --")).toBeUndefined();
  });

  it("cancelar libera o horário e não cancela duas vezes", () => {
    const { b, a, token, dias, s, p, hora, agora } = cenario();
    expect(b.horariosLivres(a.id, p.id, s.id, dias[0]!, agora)).not.toContain(hora);
    b.cancelarPeloCliente(a.id, token, agora);
    expect(b.horariosLivres(a.id, p.id, s.id, dias[0]!, agora)).toContain(hora);
    expect(() => b.cancelarPeloCliente(a.id, token, agora)).toThrow(/já foi cancelado/);
    expect(() => b.remarcarPeloCliente(a.id, token, { profissionalId: p.id, data: dias[0]!, hora }, agora)).toThrow(/cancelado/);
  });

  it("remarcar troca dia e hora, libera o antigo e recusa horário ocupado", () => {
    const { b, a, token, dias, s, p, hora, agora } = cenario();
    const novoDia = dias[1]!;
    const novaHora = b.horariosLivres(a.id, p.id, s.id, novoDia, agora)[2]!;
    const r = b.remarcarPeloCliente(a.id, token, { profissionalId: p.id, data: novoDia, hora: novaHora }, agora);
    expect(r.depois).toBe(`${novoDia}T${novaHora}`);
    expect(b.horarioDoCliente(a.id, token)!.inicio).toBe(`${novoDia}T${novaHora}`);
    expect(b.horariosLivres(a.id, p.id, s.id, dias[0]!, agora)).toContain(hora);
    // Outro cliente ocupa um horário; remarcar pra ele falha.
    const ocupada = b.horariosLivres(a.id, p.id, s.id, novoDia, agora)[0]!;
    b.agendar({ barbeariaId: a.id, profissionalId: p.id, servicoId: s.id, data: novoDia, hora: ocupada, clienteNome: "Outro", clienteTelefone: "5519991112222", agora });
    expect(() => b.remarcarPeloCliente(a.id, token, { profissionalId: p.id, data: novoDia, hora: ocupada }, agora)).toThrow(/ocupado/);
  });

  it("depois que o horário começou, o link só mostra", () => {
    const { b, a, token, dias, p, hora } = cenario();
    const depois = new Date(Date.now() + 15 * 86_400_000);
    expect(b.horarioDoCliente(a.id, token, depois)!.passou).toBe(true);
    expect(() => b.cancelarPeloCliente(a.id, token, depois)).toThrow(/começou/);
    expect(() => b.remarcarPeloCliente(a.id, token, { profissionalId: p.id, data: dias[0]!, hora }, depois)).toThrow(/começou/);
  });
});

describe("calendário do barbeiro", () => {
  it("link da barbearia e de cada profissional; renovar invalida o antigo", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    const [p] = b.profissionais(a.id);
    const todos = b.tokenAgenda(a.id);
    expect(b.tokenAgenda(a.id)).toBe(todos);
    const doRafa = b.tokenAgenda(a.id, p!.id);
    expect(doRafa).not.toBe(todos);
    expect(b.donoDoTokenAgenda(todos)).toEqual({ barbeariaId: a.id });
    expect(b.donoDoTokenAgenda(doRafa)).toEqual({ barbeariaId: a.id, profissionalId: p!.id });
    // Profissional de outra barbearia não gera link.
    expect(() => b.tokenAgenda(o.id, p!.id)).toThrow(ErroAgenda);
    const novo = b.tokenAgenda(a.id, undefined, true);
    expect(b.donoDoTokenAgenda(todos)).toBeUndefined();
    expect(b.donoDoTokenAgenda(novo)).toEqual({ barbeariaId: a.id });
    expect(b.donoDoTokenAgenda("x' OR '1'='1")).toBeUndefined();
  });

  it("lista só confirmados no intervalo e filtra por profissional", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    b.adicionarProfissional(a.id, "Beto");
    const [p1, p2] = b.profissionais(a.id, true);
    const [s] = b.servicos(a.id, true);
    const agora = new Date();
    const hoje = agoraNoFuso(a.fuso, agora).slice(0, 10);
    const dia = Array.from({ length: 10 }, (_, i) => somarDias(hoje, i + 1)).find((d) => b.expedientes(a.id).has(diaDaSemana(d)))!;
    let n = 0;
    const marcar = (p: number, nome: string) => {
      const hora = b.horariosLivres(a.id, p, s!.id, dia, agora)[0]!;
      return b.agendar({ barbeariaId: a.id, profissionalId: p, servicoId: s!.id, data: dia, hora, clienteNome: nome, clienteTelefone: `551999876543${n++}`, agora });
    };
    marcar(p1!.id, "Um");
    const cancelado = marcar(p1!.id, "Dois");
    marcar(p2!.id, "Três");
    b.cancelar(a.id, cancelado);
    expect(b.agendamentosEntre(a.id, hoje, somarDias(hoje, 30)).map((x) => x.clienteNome)).toEqual(["Um", "Três"]);
    expect(b.agendamentosEntre(a.id, hoje, somarDias(hoje, 30), p2!.id).map((x) => x.clienteNome)).toEqual(["Três"]);
    expect(b.agendamentosEntre(a.id, somarDias(dia, 1), somarDias(dia, 30))).toEqual([]);
  });
});

describe("travas contra abuso", () => {
  function cenario() {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const agora = new Date();
    const hoje = agoraNoFuso(a.fuso, agora).slice(0, 10);
    const dia = Array.from({ length: 10 }, (_, i) => somarDias(hoje, i + 1)).find((d) => b.expedientes(a.id).has(diaDaSemana(d)))!;
    const [s] = b.servicos(a.id, true);
    const [p] = b.profissionais(a.id, true);
    const marcar = (tel: string, extra: { peloBarbeiro?: boolean } = {}) => {
      const hora = b.horariosLivres(a.id, p!.id, s!.id, dia, agora)[0]!;
      return b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: s!.id, data: dia, hora, clienteNome: "Trote", clienteTelefone: tel, agora, ...extra });
    };
    return { b, a, marcar, agora };
  }

  it("um número não marca mais que 2 horários futuros pelo site; o barbeiro pode", () => {
    const { marcar } = cenario();
    marcar("5519911112222");
    marcar("5519911112222");
    expect(() => marcar("5519911112222")).toThrow(/já tem 2 horários/);
    expect(() => marcar("5519911112222", { peloBarbeiro: true })).not.toThrow();
  });

  it("bloquear número cancela os futuros e impede novos", () => {
    const { b, a, marcar } = cenario();
    marcar("5519933334444");
    marcar("5519933334444");
    expect(b.bloquearTelefone(a.id, "5519933334444")).toBe(2);
    expect(() => marcar("5519933334444")).toThrow(/Fale com a barbearia/);
    expect(b.telefonesBloqueados(a.id).map((t) => t.telefone)).toEqual(["5519933334444"]);
    b.desbloquearTelefone(a.id, "5519933334444");
    expect(() => marcar("5519933334444")).not.toThrow();
  });

  it("limite por janela de tempo", () => {
    const { b } = cenario();
    const t0 = new Date("2026-10-27T12:00:00Z");
    for (let i = 0; i < 3; i++) b.consumirLimite("x", 3, 60, "calma", new Date(t0.getTime() + i * 1000));
    expect(() => b.consumirLimite("x", 3, 60, "calma", new Date(t0.getTime() + 5000))).toThrow(/calma/);
    expect(() => b.consumirLimite("x", 3, 60, "calma", new Date(t0.getTime() + 61 * 60_000))).not.toThrow();
    expect(b.contarTentativas("outra", 60)).toBe(0);
  });
});

describe("folga em parte do dia", () => {
  function cenario() {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123" }).barbearia;
    b.adicionarProfissional(a.id, "Beto");
    const [p1, p2] = b.profissionais(a.id, true);
    const [s] = b.servicos(a.id, true);
    const agora = new Date();
    const hoje = agoraNoFuso(a.fuso, agora).slice(0, 10);
    const dia = Array.from({ length: 10 }, (_, i) => somarDias(hoje, i + 1)).find((d) => b.expedientes(a.id).has(diaDaSemana(d)))!;
    const livres = (p: number) => b.horariosLivres(a.id, p, s!.id, dia, agora);
    return { b, a, o, p1: p1!, p2: p2!, s: s!, dia, agora, livres };
  }

  it("folga de um profissional some só da agenda dele", () => {
    const { b, a, p1, p2, dia, livres } = cenario();
    expect(livres(p1.id)).toContain("14:00");
    b.bloquearPeriodo(a.id, { data: dia, de: "13:00", ate: "15:00", profissionalId: p1.id, motivo: "Médico" });
    expect(livres(p1.id)).not.toContain("14:00");
    expect(livres(p1.id)).not.toContain("13:00");
    expect(livres(p1.id)).toContain("15:00");
    expect(livres(p2.id)).toContain("14:00");
    expect(b.bloqueiosDoDia(a.id, dia)).toMatchObject([{ motivo: "Médico", profissional: p1.nome, inicio: `${dia}T13:00`, fim: `${dia}T15:00` }]);
  });

  it("folga da barbearia toda vale pra todos; remover devolve os horários", () => {
    const { b, a, p1, p2, dia, livres } = cenario();
    const { id } = b.bloquearPeriodo(a.id, { data: dia, de: "00:00", ate: "23:59" });
    expect(livres(p1.id)).toEqual([]);
    expect(livres(p2.id)).toEqual([]);
    b.removerBloqueio(a.id, id);
    expect(livres(p1.id).length).toBeGreaterThan(0);
  });

  it("avisa quem já estava marcado no período, sem cancelar", () => {
    const { b, a, p1, s, dia, agora } = cenario();
    b.agendar({ barbeariaId: a.id, profissionalId: p1.id, servicoId: s.id, data: dia, hora: "14:30", clienteNome: "Lucas", clienteTelefone: "5519998765432", agora });
    const { conflitos } = b.bloquearPeriodo(a.id, { data: dia, de: "14:00", ate: "16:00", profissionalId: p1.id });
    expect(conflitos.map((c) => c.clienteNome)).toEqual(["Lucas"]);
    expect(conflitos[0]!.status).toBe("confirmado");
  });

  it("valida horário e isola barbearias", () => {
    const { b, a, o, p1, dia } = cenario();
    expect(() => b.bloquearPeriodo(a.id, { data: dia, de: "15:00", ate: "14:00" })).toThrow(/depois/);
    expect(() => b.bloquearPeriodo(a.id, { data: dia, de: "25:00", ate: "26:00" })).toThrow(ErroAgenda);
    expect(() => b.bloquearPeriodo(o.id, { data: dia, de: "10:00", ate: "11:00", profissionalId: p1.id })).toThrow(/Profissional/);
    const { id } = b.bloquearPeriodo(a.id, { data: dia, de: "10:00", ate: "11:00" });
    b.removerBloqueio(o.id, id);
    expect(b.bloqueiosDoDia(a.id, dia)).toHaveLength(1);
  });
});

describe("preço: contratação e mensalidade", () => {
  it("primeira cobrança é a contratação; depois de confirmada, vem a mensalidade", () => {
    const b = new BancoAgenda(":memory:", { valorCentavos: 5000, adesaoCentavos: 10000, dias: 30, testeDias: 7 });
    const { barbearia } = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" });
    const primeira = b.pagamentoAberto(barbearia.id);
    expect(primeira.valorCentavos).toBe(10000);
    expect(b.jaContratou(barbearia.id)).toBe(false);
    b.confirmarPagamento(primeira.id);
    expect(b.jaContratou(barbearia.id)).toBe(true);
    expect(b.pagamentoAberto(barbearia.id).valorCentavos).toBe(5000);
  });

  it("sem contratação configurada, toda cobrança é a mensalidade", () => {
    const b = new BancoAgenda(":memory:", { valorCentavos: 5000, dias: 30, testeDias: 7 });
    const { barbearia } = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" });
    expect(b.pagamentoAberto(barbearia.id).valorCentavos).toBe(5000);
  });

  it("cobrança em aberto acompanha mudança de preço; a já informada não muda", () => {
    const arq = ":memory:";
    const b1 = new BancoAgenda(arq, { valorCentavos: 2990, dias: 30, testeDias: 7 });
    const { barbearia } = b1.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123" });
    const antiga = b1.pagamentoAberto(barbearia.id);
    expect(antiga.valorCentavos).toBe(2990);
    // Mesmo banco, preço novo (simula reiniciar com outro .env).
    Object.assign(b1.plano, { valorCentavos: 5000, adesaoCentavos: 10000 });
    expect(b1.pagamentoAberto(barbearia.id)).toMatchObject({ id: antiga.id, valorCentavos: 10000 });
    b1.informarPagamento(barbearia.id, antiga.id, "Zé");
    Object.assign(b1.plano, { adesaoCentavos: 12000 });
    expect(b1.pagamentoAberto(barbearia.id).valorCentavos).toBe(10000);
  });
});

describe("demonstração pra mostrar ao barbeiro", () => {
  const agora = new Date("2026-10-27T12:00:00-03:00");

  it("monta o site com o nome dele, fica 14 dias no ar e não aceita agendamento", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const { barbearia, convite } = b.criarDemonstracao({ nome: "Barbearia do Zé", tema: "potencia", cidade: "Alegrete", lead: "cnpj:1", agora });
    expect(barbearia).toMatchObject({ slug: "barbearia-do-ze", tema: "potencia", cidade: "Alegrete", demoAte: "2026-11-09" });
    expect(b.acessoAtivo(barbearia, agora)).toBe(true);
    expect(b.acessoAtivo(barbearia, new Date("2026-11-10T12:00:00-03:00"))).toBe(false);
    expect(convite.length).toBeGreaterThan(20);
    const [prof] = b.profissionais(barbearia.id);
    const [servico] = b.servicos(barbearia.id);
    expect(() => b.agendar({ barbeariaId: barbearia.id, profissionalId: prof!.id, servicoId: servico!.id, data: "2026-10-28", hora: "10:00",
      clienteNome: "Teste", clienteTelefone: "5511999999999", agora })).toThrow(/demonstração/);
  });

  it("o barbeiro assume pelo convite: vira o site dele, no mesmo endereço, e o convite morre", () => {
    const b = new BancoAgenda(":memory:", { valorCentavos: 5000, adesaoCentavos: 10000, dias: 30, testeDias: 0 });
    const { barbearia, convite } = b.criarDemonstracao({ nome: "Barbearia do Zé", tema: "atemporal", agora });
    expect(b.demonstracaoPorConvite("inventado", agora)).toBeUndefined();
    const r = b.assumirDemonstracao(convite, { telefone: "5555999990001", nome: "José", email: "ze@exemplo.com", senha: "senha-boa-123", agora });
    expect(r.barbearia).toMatchObject({ id: barbearia.id, slug: "barbearia-do-ze", tema: "atemporal", telefone: "5555999990001" });
    expect(r.barbearia.demoAte).toBeUndefined();
    // Sem período grátis: nasce bloqueada até o Pix ser confirmado.
    expect(b.acessoAtivo(r.barbearia, agora)).toBe(false);
    expect(b.profissionais(barbearia.id).map((p) => p.nome)).toEqual(["José"]);
    expect(() => b.assumirDemonstracao(convite, { telefone: "1", nome: "Outro", email: "o@exemplo.com", senha: "senha-boa-123", agora })).toThrow(/venceu ou já foi usado/);
  });

  it("demonstração vencida não pode ser assumida", () => {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const { convite } = b.criarDemonstracao({ nome: "Barbearia X", tema: "silencioso", agora });
    expect(() => b.assumirDemonstracao(convite, { telefone: "1", nome: "X", email: "x@exemplo.com", senha: "senha-boa-123",
      agora: new Date("2026-12-01T12:00:00-03:00") })).toThrow(/venceu/);
  });
});

describe("depois do atendimento: falta, retorno, lembrete, avaliação e números", () => {
  // Terças de outubro de 2026 (expediente padrão: ter a sáb). Marca no passado com um "agora" antigo.
  const antes = new Date("2026-09-20T12:00:00Z");
  function cenario() {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    const [p] = b.profissionais(a.id, true);
    const [s] = b.servicos(a.id, true);
    const marcar = (data: string, hora: string, tel = "5519998765432") =>
      b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: s!.id, data, hora, clienteNome: "Lucas", clienteTelefone: tel, agora: antes, peloBarbeiro: true });
    return { b, a, s: s!, marcar };
  }

  it("falta só depois da hora, e dá pra desfazer", () => {
    const { b, a, marcar } = cenario();
    const id = marcar("2026-10-20", "10:00");
    expect(() => b.marcarFalta(a.id, id, true, new Date("2026-10-20T12:00:00Z"))).toThrow(/depois da hora/); // 09h em São Paulo
    b.marcarFalta(a.id, id, true, new Date("2026-10-20T14:00:00Z"));
    expect(b.agendamento(a.id, id)!.status).toBe("faltou");
    b.marcarFalta(a.id, id, false, new Date("2026-10-20T14:00:00Z"));
    expect(b.agendamento(a.id, id)!.status).toBe("confirmado");
  });

  it("sugere o retorno pelo ritmo do cliente, ou pelo padrão da barbearia", () => {
    const { b, a, marcar } = cenario();
    const depois = new Date("2026-10-21T15:00:00Z");
    marcar("2026-10-06", "10:00", "5519911112222");
    expect(b.sugestaoDeRetorno(a.id, "5519911112222", depois)).toMatchObject({ data: "2026-10-27", ritmoDias: 21, deHistorico: false });
    marcar("2026-10-13", "10:00");
    marcar("2026-10-20", "10:00");
    expect(b.sugestaoDeRetorno(a.id, "5519998765432", depois)).toMatchObject({ data: "2026-10-27", ritmoDias: 7, deHistorico: true });
    b.atualizarPosAtendimento(a.id, { retornoDias: 30, linkAvaliacao: "https://g.page/r/abc/review" });
    expect(b.barbeariaPorId(a.id)).toMatchObject({ retornoDias: 30, linkAvaliacao: "https://g.page/r/abc/review" });
    expect(() => b.atualizarPosAtendimento(a.id, { retornoDias: 3 })).toThrow(ErroAgenda);
    expect(() => b.atualizarPosAtendimento(a.id, { retornoDias: 21, linkAvaliacao: "javascript:alert(1)" })).toThrow(ErroAgenda);
  });

  it("anota lembrete e pedido de avaliação; acha o próximo horário do cliente", () => {
    const { b, a, marcar } = cenario();
    const id = marcar("2026-10-20", "10:00");
    marcar("2026-10-27", "10:00");
    b.registrarContato(a.id, id, "lembrete");
    b.registrarContato(a.id, id, "avaliacao");
    const [x] = b.agendamentosDoDia(a.id, "2026-10-20");
    expect(x!.lembreteEm).toBeTruthy();
    expect(x!.avaliacaoEm).toBeTruthy();
    expect(b.proximoDoCliente(a.id, "5519998765432", new Date("2026-10-21T12:00:00Z"))).toBe("2026-10-27T10:00");
  });

  it("números do mês: atendidos, faltas, quem voltou e quem saiu com retorno", () => {
    const { b, a, s, marcar } = cenario();
    marcar("2026-09-29", "10:00", "5519911110000"); // veio em setembro
    marcar("2026-10-06", "10:00", "5519911110000"); // voltou em outubro, sem próximo
    const faltou = marcar("2026-10-13", "11:00", "5519922220000");
    marcar("2026-10-20", "10:00", "5519933330000"); // novo, com retorno marcado
    marcar("2026-11-10", "10:00", "5519933330000");
    const agora = new Date("2026-10-21T15:00:00Z");
    b.marcarFalta(a.id, faltou, true, agora);
    const n = b.numerosDoMes(a.id, "2026-10", agora);
    expect(n).toMatchObject({ atendidos: 2, faltas: 1, clientes: 2, clientesQueVoltaram: 1, saiuComRetorno: 1 });
    expect(n.faturamentoCentavos).toBe(2 * s.precoCentavos);
    expect(n.perdidoEmFaltasCentavos).toBe(s.precoCentavos);
    expect(n.ocupacao).toBeGreaterThan(0);
    expect(n.ocupacao).toBeLessThan(0.1);
  });
});

describe("clientes que sumiram", () => {
  it("lista quem passou do ritmo sem marcar; some ao ser chamado ou ao marcar", () => {
    const antes = new Date("2026-04-01T12:00:00Z");
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    const [p] = b.profissionais(a.id, true);
    const [s] = b.servicos(a.id, true);
    const horas = ["09:00", "10:00", "14:00", "15:00", "16:00"];
    const m = (data: string, nome: string, tel: string) => b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: s!.id, data, hora: horas.shift()!, clienteNome: nome, clienteTelefone: tel, agora: antes, peloBarbeiro: true });
    m("2026-09-01", "Ana", "5519911110001"); // 51 dias sem vir, ritmo padrão 21: sumiu
    m("2026-10-13", "Beto", "5519911110002"); // 9 dias: em dia
    m("2026-09-01", "Caio", "5519911110003"); m("2026-11-03", "Caio", "5519911110003"); // tem horário marcado
    m("2026-05-05", "Duda", "5519911110004"); // há mais de 120 dias: perdido, fora da lista
    const agora = new Date("2026-10-22T15:00:00Z");
    expect(b.clientesSumidos(a.id, agora).map((c) => c.nome)).toEqual(["Ana"]);
    expect(b.clientesSumidos(a.id, agora)[0]).toMatchObject({ ultimaVisita: "2026-09-01", diasSemVir: 51, ritmoDias: 21 });
    b.registrarChamada(a.id, "5519911110001", agora);
    expect(b.clientesSumidos(a.id, agora)).toEqual([]);
    expect(b.clientesSumidos(a.id, new Date("2026-11-10T15:00:00Z")).map((c) => c.nome)).toContain("Ana");
  });
});

describe("cardápio de cortes: foto de referência ao marcar", () => {
  it("aceita só foto de trabalho da própria barbearia", () => {
    const antes = new Date("2026-10-01T12:00:00Z");
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    const o = b.criarConta({ nomeBarbearia: "O", telefone: "5519900000002", nome: "Ana", email: "o@x.com", senha: "segredo123", agora: antes }).barbearia;
    const degrade = b.registrarFoto(a.id, { categoria: "degrade", largura: 10, altura: 10 });
    const ambiente = b.registrarFoto(a.id, { categoria: "ambiente", largura: 10, altura: 10 });
    const deOutra = b.registrarFoto(o.id, { categoria: "corte", largura: 10, altura: 10 });
    const [p] = b.profissionais(a.id, true);
    const [s] = b.servicos(a.id, true);
    const m = (hora: string, referenciaFoto?: string) => b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: s!.id, data: "2026-10-20", hora, clienteNome: "Lucas", clienteTelefone: "5519998765432", agora: antes, peloBarbeiro: true, referenciaFoto });
    m("10:00", degrade);
    expect(() => m("11:00", ambiente)).toThrow(/referência/);
    expect(() => m("11:00", deOutra)).toThrow(/referência/);
    expect(b.agendamentosDoDia(a.id, "2026-10-20")[0]!.referenciaFoto).toBe(degrade);
  });
});

describe("divisão do mês por profissional", () => {
  it("soma o atendido de cada um e divide pela parte combinada", () => {
    const antes = new Date("2026-10-01T12:00:00Z");
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    b.adicionarProfissional(a.id, "Beto");
    const [ze, beto] = b.profissionais(a.id, true);
    const [s] = b.servicos(a.id, true);
    b.atualizarProfissional(a.id, beto!.id, { partePct: 60 });
    expect(() => b.atualizarProfissional(a.id, beto!.id, { partePct: 120 })).toThrow(ErroAgenda);
    const m = (prof: number, hora: string) => b.agendar({ barbeariaId: a.id, profissionalId: prof, servicoId: s!.id, data: "2026-10-20", hora, clienteNome: "Cliente", clienteTelefone: `55199887766${hora.slice(0, 2)}`, agora: antes, peloBarbeiro: true });
    m(ze!.id, "09:00"); m(beto!.id, "09:00"); m(beto!.id, "10:00");
    const d = b.divisaoDoMes(a.id, "2026-10", new Date("2026-10-21T12:00:00Z"));
    expect(d.find((x) => x.nome === "Zé")).toMatchObject({ atendidos: 1, partePct: undefined, parteProfissionalCentavos: undefined });
    expect(d.find((x) => x.nome === "Beto")).toMatchObject({ atendidos: 2, totalCentavos: 2 * s!.precoCentavos, partePct: 60,
      parteProfissionalCentavos: Math.round(2 * s!.precoCentavos * 0.6), parteBarbeariaCentavos: 2 * s!.precoCentavos - Math.round(2 * s!.precoCentavos * 0.6) });
  });
});

describe("atendimento em domicílio", () => {
  it("serviço em domicílio exige o endereço do cliente", () => {
    const antes = new Date("2026-10-01T12:00:00Z");
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    b.adicionarServico(a.id, { nome: "Corte em casa", duracaoMin: 60, precoCentavos: 9000, emDomicilio: true });
    const casa = b.servicos(a.id, true).find((s) => s.nome === "Corte em casa")!;
    expect(casa.emDomicilio).toBe(true);
    const [p] = b.profissionais(a.id, true);
    const m = (enderecoCliente?: string) => b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: casa.id, data: "2026-10-20", hora: "09:00", clienteNome: "Dona Maria", clienteTelefone: "5519998765432", agora: antes, enderecoCliente });
    expect(() => m()).toThrow(/endereço/);
    const id = m("Rua das Flores, 123 - Centro");
    expect(b.agendamento(a.id, id)!.enderecoCliente).toBe("Rua das Flores, 123 - Centro");
    expect(b.servicos(a.id, true).find((s) => s.nome !== "Corte em casa")!.emDomicilio).toBe(false);
  });
});

describe("plano mensal do cliente", () => {
  it("cadastra, conta o uso do mês e mostra vencido", () => {
    const antes = new Date("2026-10-01T12:00:00Z");
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    const [p] = b.profissionais(a.id, true);
    const [s] = b.servicos(a.id, true);
    b.salvarPlano(a.id, { telefone: "5519998765432", nome: "Lucas", usosPorMes: 2, valorCentavos: 8000, validoAte: "2026-10-31" });
    expect(() => b.salvarPlano(a.id, { telefone: "5519998765432", nome: "Lucas", usosPorMes: 0, valorCentavos: 8000, validoAte: "2026-10-31" })).toThrow(ErroAgenda);
    for (const [d, h] of [["2026-10-13", "10:00"], ["2026-10-27", "10:00"], ["2026-11-10", "10:00"]] as const) {
      b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: s!.id, data: d, hora: h, clienteNome: "Lucas", clienteTelefone: "5519998765432", agora: antes, peloBarbeiro: true });
    }
    expect(b.planos(a.id, new Date("2026-10-20T12:00:00Z"))[0]).toMatchObject({ usosPorMes: 2, usadosNoMes: 2, vencido: false });
    expect(b.planos(a.id, new Date("2026-11-05T12:00:00Z"))[0]).toMatchObject({ usadosNoMes: 1, vencido: true });
    b.salvarPlano(a.id, { telefone: "5519998765432", nome: "Lucas", usosPorMes: 2, valorCentavos: 8000, validoAte: "2026-11-30" });
    expect(b.planos(a.id, new Date("2026-11-05T12:00:00Z"))).toHaveLength(1);
    expect(b.planos(a.id, new Date("2026-11-05T12:00:00Z"))[0]!.vencido).toBe(false);
  });
});

describe("tempo de cada serviço e folga entre clientes", () => {
  const antes = new Date("2026-10-01T12:00:00Z");
  function montar() {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    const [p] = b.profissionais(a.id, true);
    const corte = b.servicos(a.id, true).find((s) => s.nome === "Corte")!;
    const marcar = (hora: string, telefone: string) => b.agendar({ barbeariaId: a.id, profissionalId: p!.id, servicoId: corte.id, data: "2026-10-20", hora, clienteNome: "Cliente", clienteTelefone: telefone, agora: antes });
    return { b, a, p: p!, corte, marcar };
  }

  it("a folga da barbearia entra nos horários livres", () => {
    const { b, a, p, corte, marcar } = montar();
    b.atualizarServico(a.id, corte.id, { nome: "Corte", duracaoMin: 40, precoCentavos: 4000 }, antes);
    b.atualizarFuncionamento(a.id, { mostrarPrecos: true, intervaloMin: 30, atendimento: "agenda", folgaMin: 10 });
    expect(b.barbeariaPorId(a.id)!.folgaMin).toBe(10);
    marcar("09:00", "5519998000001");
    const livres = b.horariosLivres(a.id, p.id, corte.id, "2026-10-20", antes);
    expect(livres[0]).toBe("09:50");
    expect(() => b.atualizarFuncionamento(a.id, { mostrarPrecos: true, intervaloMin: 30, atendimento: "agenda", folgaMin: 7 })).toThrow(ErroAgenda);
    // Sem dizer a folga, mantém a que estava.
    b.atualizarFuncionamento(a.id, { mostrarPrecos: false, intervaloMin: 15, atendimento: "agenda" });
    expect(b.barbeariaPorId(a.id)).toMatchObject({ folgaMin: 10, intervaloMin: 15 });
  });

  it("mudar o tempo do serviço muda os horários futuros na agenda e avisa quem encosta no seguinte", () => {
    const { b, a, corte, marcar } = montar();
    const primeiro = marcar("09:00", "5519998000001");
    marcar("09:30", "5519998000002");
    const r = b.atualizarServico(a.id, corte.id, { nome: "Corte", duracaoMin: 45, precoCentavos: 4000 }, antes);
    expect(r.ajustados).toBe(2);
    expect(b.agendamento(a.id, primeiro)!.fim).toBe("2026-10-20T09:45");
    expect(r.conflitos.map((c) => c.id)).toContain(primeiro);
    // O calendário do barbeiro mostra o tempo novo.
    expect(b.agendamentosEntre(a.id, "2026-10-20", "2026-10-20")[0]!.duracaoMin).toBe(45);
    // Mudar só o preço não mexe nos horários.
    expect(b.atualizarServico(a.id, corte.id, { nome: "Corte", duracaoMin: 45, precoCentavos: 4500 }, antes).ajustados).toBe(0);
  });
});

describe("adicionais: barba, sobrancelha", () => {
  const antes = new Date("2026-10-01T12:00:00Z");
  function montar() {
    const b = new BancoAgenda(":memory:", PLANO_LIBERADO);
    const a = b.criarConta({ nomeBarbearia: "A", telefone: "5519900000001", nome: "Zé", email: "a@x.com", senha: "segredo123", agora: antes }).barbearia;
    const [p] = b.profissionais(a.id, true);
    const porNome = (n: string) => b.servicos(a.id, true).find((s) => s.nome === n)!;
    return { b, a, p: p!, corte: porNome("Corte"), barba: porNome("Barba"), sobrancelha: porNome("Sobrancelha"), combo: porNome("Corte + barba") };
  }

  it("conta nova já vem com barba e sobrancelha como adicionais", () => {
    const { b, a, corte, barba, sobrancelha, combo } = montar();
    expect(b.adicionaisPara(a.id, corte.id).map((s) => s.nome)).toEqual(["Barba", "Sobrancelha"]);
    // "Corte + barba" já tem barba: só oferece sobrancelha.
    expect(b.adicionaisPara(a.id, combo.id).map((s) => s.nome)).toEqual(["Sobrancelha"]);
    expect(b.adicionaisPara(a.id, barba.id).map((s) => s.id)).toEqual([sobrancelha.id]);
  });

  it("adicionais somam tempo e preço, aparecem no nome e nos números", () => {
    const { b, a, p, corte, barba, sobrancelha } = montar();
    const marcar = (hora: string, adicionais: number[]) => b.agendar({ barbeariaId: a.id, profissionalId: p.id, servicoId: corte.id, data: "2026-10-20", hora, clienteNome: "Cliente", clienteTelefone: "5519998000001", agora: antes, adicionais });
    const id = marcar("09:00", [barba.id, sobrancelha.id]);
    const ag = b.agendamento(a.id, id)!;
    expect(ag.fim).toBe("2026-10-20T10:10"); // 30 + 30 + 10
    expect(ag.servico).toBe("Corte + Barba + Sobrancelha");
    expect(ag.adicionais).toEqual([barba.id, sobrancelha.id]);
    // O próximo horário livre respeita o tempo total.
    expect(b.horariosLivres(a.id, p.id, corte.id, "2026-10-20", antes)[0]).toBe("10:10");
    // Só com barba, 60 min: 10:10 cabe, e o combo cabe ali também.
    expect(b.horariosLivres(a.id, p.id, corte.id, "2026-10-20", antes, undefined, { adicionais: [barba.id] })).toContain("10:10");
    expect(() => marcar("11:00", [corte.id])).toThrow(/Adicional/);
    expect(b.numerosDoMes(a.id, "2026-10", new Date("2026-10-31T12:00:00Z")).faturamentoCentavos).toBe(4000 + 3000 + 1500);
  });

  it("serviço deixa de ser adicional quando o barbeiro desmarca", () => {
    const { b, a, corte, sobrancelha } = montar();
    b.atualizarServico(a.id, sobrancelha.id, { nome: "Sobrancelha", duracaoMin: 15, precoCentavos: 2000, adicional: false });
    expect(b.adicionaisPara(a.id, corte.id).map((s) => s.nome)).toEqual(["Barba"]);
  });
});
