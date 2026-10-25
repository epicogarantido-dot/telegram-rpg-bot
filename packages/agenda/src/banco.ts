import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { horariosLivres, type Expediente } from "./disponibilidade.ts";
import { conferirSenha, hashSenha, hashToken, novoToken } from "./senha.ts";
import { agoraNoFuso, deMinutos, diaDaSemana, paraMinutos, type Data, type DataHora } from "./tempo.ts";

/**
 * Banco do SaaS de agendamento (SQLite local). Tudo é isolado por
 * barbearia_id: nenhuma consulta pública ou do painel pode ler dados de
 * outra barbearia. Ao migrar pro Supabase, isso vira RLS por barbearia.
 */

export interface Barbearia {
  id: number;
  slug: string;
  nome: string;
  telefone: string;
  endereco?: string;
  fuso: string;
}
export interface Profissional { id: number; nome: string; ativo: number }
export interface Servico { id: number; nome: string; duracaoMin: number; precoCentavos: number; ativo: number }
export interface Agendamento {
  id: number;
  servicoId: number;
  servico: string;
  profissionalId: number;
  profissional: string;
  clienteNome: string;
  clienteTelefone: string;
  inicio: DataHora;
  fim: DataHora;
  status: "confirmado" | "cancelado";
}
export interface Usuario { id: number; barbeariaId: number; nome: string; email: string }

export class ErroAgenda extends Error {}

const DURACAO_SESSAO_DIAS = 30;

function caminhoPadrao(): string {
  if (process.env.AGENDA_DB) return process.env.AGENDA_DB;
  let dir = process.cwd();
  while (!existsSync(join(dir, "data"))) {
    const pai = dirname(dir);
    if (pai === dir) throw new Error("Pasta data/ não encontrada; defina AGENDA_DB.");
    dir = pai;
  }
  return join(dir, "data", "privado", "agenda.db");
}

export function gerarSlug(nome: string): string {
  return nome.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "barbearia";
}

export class BancoAgenda {
  readonly db: DatabaseSync;

  constructor(caminho = caminhoPadrao()) {
    if (caminho !== ":memory:") mkdirSync(/*turbopackIgnore: true*/ dirname(caminho), { recursive: true });
    this.db = new DatabaseSync(caminho);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS barbearias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE, nome TEXT NOT NULL, telefone TEXT NOT NULL,
        endereco TEXT, fuso TEXT NOT NULL DEFAULT 'America/Sao_Paulo', criado_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, senha_hash TEXT NOT NULL, criado_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessoes (
        token_hash TEXT PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id), expira_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS profissionais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        nome TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        nome TEXT NOT NULL, duracao_min INTEGER NOT NULL, preco_centavos INTEGER NOT NULL, ativo INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS expedientes (
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
        abre TEXT NOT NULL, fecha TEXT NOT NULL, pausa_inicio TEXT, pausa_fim TEXT,
        PRIMARY KEY (barbearia_id, dia_semana)
      );
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        servico_id INTEGER NOT NULL REFERENCES servicos(id),
        profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
        cliente_nome TEXT NOT NULL, cliente_telefone TEXT NOT NULL,
        inicio TEXT NOT NULL, fim TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmado', criado_em TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS agendamentos_dia ON agendamentos(barbearia_id, profissional_id, inicio);
    `);
  }

  // ---------- conta ----------

  criarConta(dados: { nomeBarbearia: string; telefone: string; nome: string; email: string; senha: string }): { barbearia: Barbearia; token: string } {
    const email = dados.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErroAgenda("E-mail inválido.");
    if (dados.senha.length < 8) throw new ErroAgenda("A senha precisa ter pelo menos 8 caracteres.");
    if (this.db.prepare("SELECT 1 FROM usuarios WHERE email = ?").get(email)) throw new ErroAgenda("Já existe conta com esse e-mail.");

    const agora = new Date().toISOString();
    let slug = gerarSlug(dados.nomeBarbearia);
    for (let n = 2; this.db.prepare("SELECT 1 FROM barbearias WHERE slug = ?").get(slug); n++) slug = `${gerarSlug(dados.nomeBarbearia)}-${n}`;

    this.db.exec("BEGIN");
    try {
      const b = this.db.prepare("INSERT INTO barbearias (slug, nome, telefone, criado_em) VALUES (?, ?, ?, ?)")
        .run(slug, dados.nomeBarbearia.trim(), dados.telefone, agora);
      const barbeariaId = Number(b.lastInsertRowid);
      const u = this.db.prepare("INSERT INTO usuarios (barbearia_id, nome, email, senha_hash, criado_em) VALUES (?, ?, ?, ?, ?)")
        .run(barbeariaId, dados.nome.trim(), email, hashSenha(dados.senha), agora);
      // Ponto de partida pra barbearia já sair usando: dá pra editar tudo no painel.
      this.db.prepare("INSERT INTO profissionais (barbearia_id, nome) VALUES (?, ?)").run(barbeariaId, dados.nome.trim());
      for (const [nome, dur, preco] of [["Corte", 30, 4000], ["Barba", 30, 3000], ["Corte + barba", 60, 6500]] as const) {
        this.db.prepare("INSERT INTO servicos (barbearia_id, nome, duracao_min, preco_centavos) VALUES (?, ?, ?, ?)").run(barbeariaId, nome, dur, preco);
      }
      for (let dia = 2; dia <= 6; dia++) {
        this.db.prepare("INSERT INTO expedientes (barbearia_id, dia_semana, abre, fecha, pausa_inicio, pausa_fim) VALUES (?, ?, '09:00', '19:00', '12:00', '13:00')").run(barbeariaId, dia);
      }
      this.db.exec("COMMIT");
      return { barbearia: this.barbeariaPorId(barbeariaId)!, token: this.criarSessao(Number(u.lastInsertRowid)) };
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  entrar(email: string, senha: string): string {
    const u = this.db.prepare("SELECT id, senha_hash FROM usuarios WHERE email = ?").get(email.trim().toLowerCase()) as
      { id: number; senha_hash: string } | undefined;
    if (!u || !conferirSenha(senha, u.senha_hash)) throw new ErroAgenda("E-mail ou senha incorretos.");
    return this.criarSessao(u.id);
  }

  private criarSessao(usuarioId: number): string {
    const { token, hash } = novoToken();
    const expira = new Date(Date.now() + DURACAO_SESSAO_DIAS * 86_400_000).toISOString();
    this.db.prepare("INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?, ?, ?)").run(hash, usuarioId, expira);
    return token;
  }

  usuarioDaSessao(token: string | undefined): Usuario | undefined {
    if (!token) return undefined;
    return this.db.prepare(`SELECT u.id, u.barbearia_id AS barbeariaId, u.nome, u.email FROM sessoes s
      JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.expira_em > ?`)
      .get(hashToken(token), new Date().toISOString()) as Usuario | undefined;
  }

  sair(token: string): void {
    this.db.prepare("DELETE FROM sessoes WHERE token_hash = ?").run(hashToken(token));
  }

  // ---------- barbearia ----------

  barbeariaPorId(id: number): Barbearia | undefined {
    return this.db.prepare("SELECT id, slug, nome, telefone, endereco, fuso FROM barbearias WHERE id = ?").get(id) as Barbearia | undefined;
  }

  barbeariaPorSlug(slug: string): Barbearia | undefined {
    return this.db.prepare("SELECT id, slug, nome, telefone, endereco, fuso FROM barbearias WHERE slug = ?").get(slug) as Barbearia | undefined;
  }

  atualizarBarbearia(id: number, dados: { nome: string; telefone: string; endereco?: string }): void {
    this.db.prepare("UPDATE barbearias SET nome = ?, telefone = ?, endereco = ? WHERE id = ?")
      .run(dados.nome.trim(), dados.telefone, dados.endereco?.trim() || null, id);
  }

  profissionais(barbeariaId: number, soAtivos = false): Profissional[] {
    return this.db.prepare(`SELECT id, nome, ativo FROM profissionais WHERE barbearia_id = ? ${soAtivos ? "AND ativo = 1" : ""} ORDER BY id`)
      .all(barbeariaId) as unknown as Profissional[];
  }

  adicionarProfissional(barbeariaId: number, nome: string): void {
    this.db.prepare("INSERT INTO profissionais (barbearia_id, nome) VALUES (?, ?)").run(barbeariaId, nome.trim());
  }

  alternarProfissional(barbeariaId: number, id: number): void {
    this.db.prepare("UPDATE profissionais SET ativo = 1 - ativo WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
  }

  servicos(barbeariaId: number, soAtivos = false): Servico[] {
    return this.db.prepare(`SELECT id, nome, duracao_min AS duracaoMin, preco_centavos AS precoCentavos, ativo
      FROM servicos WHERE barbearia_id = ? ${soAtivos ? "AND ativo = 1" : ""} ORDER BY id`).all(barbeariaId) as unknown as Servico[];
  }

  adicionarServico(barbeariaId: number, s: { nome: string; duracaoMin: number; precoCentavos: number }): void {
    if (!(s.duracaoMin >= 5 && s.duracaoMin <= 480)) throw new ErroAgenda("Duração entre 5 e 480 minutos.");
    if (!(s.precoCentavos >= 0)) throw new ErroAgenda("Preço inválido.");
    this.db.prepare("INSERT INTO servicos (barbearia_id, nome, duracao_min, preco_centavos) VALUES (?, ?, ?, ?)")
      .run(barbeariaId, s.nome.trim(), Math.round(s.duracaoMin), Math.round(s.precoCentavos));
  }

  alternarServico(barbeariaId: number, id: number): void {
    this.db.prepare("UPDATE servicos SET ativo = 1 - ativo WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
  }

  expedientes(barbeariaId: number): Map<number, Expediente> {
    const linhas = this.db.prepare(`SELECT dia_semana AS dia, abre, fecha, pausa_inicio AS pausaInicio, pausa_fim AS pausaFim
      FROM expedientes WHERE barbearia_id = ?`).all(barbeariaId) as unknown as (Expediente & { dia: number })[];
    return new Map(linhas.map(({ dia, ...e }) => [dia, { ...e, pausaInicio: e.pausaInicio ?? undefined, pausaFim: e.pausaFim ?? undefined }]));
  }

  definirExpediente(barbeariaId: number, dia: number, e: Expediente | undefined): void {
    this.db.prepare("DELETE FROM expedientes WHERE barbearia_id = ? AND dia_semana = ?").run(barbeariaId, dia);
    if (!e) return;
    const ok = (h?: string) => !h || /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
    if (![e.abre, e.fecha, e.pausaInicio, e.pausaFim].every(ok) || paraMinutos(e.abre) >= paraMinutos(e.fecha)) {
      throw new ErroAgenda("Horário de funcionamento inválido.");
    }
    this.db.prepare("INSERT INTO expedientes (barbearia_id, dia_semana, abre, fecha, pausa_inicio, pausa_fim) VALUES (?, ?, ?, ?, ?, ?)")
      .run(barbeariaId, dia, e.abre, e.fecha, e.pausaInicio || null, e.pausaFim || null);
  }

  // ---------- agenda ----------

  agendamentosDoDia(barbeariaId: number, data: Data, profissionalId?: number): Agendamento[] {
    return this.db.prepare(`SELECT a.id, a.servico_id AS servicoId, s.nome AS servico, a.profissional_id AS profissionalId,
        p.nome AS profissional, a.cliente_nome AS clienteNome, a.cliente_telefone AS clienteTelefone,
        a.inicio, a.fim, a.status
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id JOIN profissionais p ON p.id = a.profissional_id
      WHERE a.barbearia_id = ? AND a.inicio LIKE ? ${profissionalId ? "AND a.profissional_id = ?" : ""}
      ORDER BY a.inicio`)
      .all(barbeariaId, `${data}%`, ...(profissionalId ? [profissionalId] : [])) as unknown as Agendamento[];
  }

  horariosLivres(barbeariaId: number, profissionalId: number, servicoId: number, data: Data, agora?: Date): string[] {
    const b = this.barbeariaPorId(barbeariaId);
    const servico = this.servicos(barbeariaId, true).find((s) => s.id === servicoId);
    if (!b || !servico) return [];
    const ocupados = this.agendamentosDoDia(barbeariaId, data, profissionalId).filter((a) => a.status === "confirmado");
    return horariosLivres({
      data,
      expediente: this.expedientes(barbeariaId).get(diaDaSemana(data)),
      duracao: servico.duracaoMin,
      ocupados,
      agora: agoraNoFuso(b.fuso, agora),
    });
  }

  /**
   * Marca um horário. Revalida a disponibilidade dentro da transação: dois
   * clientes clicando no mesmo horário ao mesmo tempo não viram encaixe duplo.
   */
  agendar(dados: {
    barbeariaId: number; profissionalId: number; servicoId: number; data: Data; hora: string;
    clienteNome: string; clienteTelefone: string; agora?: Date;
  }): number {
    const nome = dados.clienteNome.trim();
    if (nome.length < 2) throw new ErroAgenda("Informe seu nome.");
    if (!/^\d{12,13}$/.test(dados.clienteTelefone)) throw new ErroAgenda("WhatsApp inválido.");
    const prof = this.profissionais(dados.barbeariaId, true).find((p) => p.id === dados.profissionalId);
    const servico = this.servicos(dados.barbeariaId, true).find((s) => s.id === dados.servicoId);
    if (!prof || !servico) throw new ErroAgenda("Serviço ou profissional indisponível.");

    this.db.exec("BEGIN IMMEDIATE");
    try {
      const livres = this.horariosLivres(dados.barbeariaId, dados.profissionalId, dados.servicoId, dados.data, dados.agora);
      if (!livres.includes(dados.hora)) throw new ErroAgenda("Esse horário acabou de ser ocupado. Escolha outro.");
      const fim = deMinutos(paraMinutos(dados.hora) + servico.duracaoMin);
      const r = this.db.prepare(`INSERT INTO agendamentos
          (barbearia_id, servico_id, profissional_id, cliente_nome, cliente_telefone, inicio, fim, criado_em)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(dados.barbeariaId, servico.id, prof.id, nome.slice(0, 80), dados.clienteTelefone,
          `${dados.data}T${dados.hora}`, `${dados.data}T${fim}`, new Date().toISOString());
      this.db.exec("COMMIT");
      return Number(r.lastInsertRowid);
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  agendamento(barbeariaId: number, id: number): Agendamento | undefined {
    return this.db.prepare(`SELECT a.id, a.servico_id AS servicoId, s.nome AS servico, a.profissional_id AS profissionalId,
        p.nome AS profissional, a.cliente_nome AS clienteNome, a.cliente_telefone AS clienteTelefone, a.inicio, a.fim, a.status
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id JOIN profissionais p ON p.id = a.profissional_id
      WHERE a.barbearia_id = ? AND a.id = ?`).get(barbeariaId, id) as Agendamento | undefined;
  }

  cancelar(barbeariaId: number, id: number): void {
    this.db.prepare("UPDATE agendamentos SET status = 'cancelado' WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
  }
}
