import { createHash, randomBytes, randomInt } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { conferirSenha, hashSenha, hashToken, novoToken } from "@aprenda/agenda";
import { ehCelularBR, normalizarTelefone } from "@aprenda/prospeccao";

/**
 * Contas dos alunos do site de cursos: login = número de WhatsApp + senha.
 *
 * O número só vale depois de provado: o site mostra um código e a pessoa o
 * ENVIA pro WhatsApp do bot. Mensagem que chega do número X prova que quem
 * está no site controla X — sem SMS pago e sem o bot mandar mensagem a
 * ninguém (só responde). O mesmo mecanismo serve pra trocar a senha.
 */

export class ErroMembro extends Error {}

export type Finalidade = "cadastro" | "senha";

export interface Membro {
  id: number;
  telefone: string;
  nome: string;
  verificado: boolean;
}

const SESSAO_DIAS = 30;
const CODIGO_MINUTOS = 15;
/** Sem 0/O, 1/I/L: fácil de ler e digitar. */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const SENHAS_FRACAS = new Set(["12345678", "123456789", "1234567890", "senha123", "password", "qwerty123", "abc12345", "11111111", "00000000", "87654321"]);

export const LIMITES = {
  /** Falhas de login por número em 15 min. */
  porTelefone: 5,
  /** Tentativas (login, cadastro, código) por IP em 15 min. */
  porIp: 30,
  janelaMin: 15,
};

function caminhoPadrao(): string {
  if (process.env.MEMBROS_DB) return process.env.MEMBROS_DB;
  let dir = process.cwd();
  while (!existsSync(join(dir, "data"))) {
    const pai = dirname(dir);
    if (pai === dir) throw new Error("Pasta data/ não encontrada; defina MEMBROS_DB.");
    dir = pai;
  }
  return join(dir, "data", "privado", "membros.db");
}

function sha(texto: string): string {
  return createHash("sha256").update(texto).digest("hex");
}

/** Normaliza e exige celular brasileiro (WhatsApp). */
export function telefoneValido(entrada: string): string {
  const t = normalizarTelefone(entrada);
  if (!t || !ehCelularBR(t)) throw new ErroMembro("Digite um celular brasileiro com DDD, ex.: (11) 98765-4321.");
  return t;
}

export function validarSenha(senha: string): void {
  if (senha.length < 8) throw new ErroMembro("A senha precisa ter pelo menos 8 caracteres.");
  if (senha.length > 128) throw new ErroMembro("Senha longa demais.");
  if (SENHAS_FRACAS.has(senha.toLowerCase()) || /^(.)\1+$/.test(senha)) throw new ErroMembro("Essa senha é fácil de adivinhar. Escolha outra.");
}

/**
 * Acha o código numa mensagem como "Meu código: AB3K9Q" ou só "ab3k9q".
 * Todo código tem letra E número: assim palavras comuns ("buscar") nunca
 * são confundidas com código.
 */
export function extrairCodigo(texto: string): string | undefined {
  for (const m of texto.toUpperCase().matchAll(new RegExp(`(?:^|[^A-Z0-9])([${ALFABETO}]{6})(?=[^A-Z0-9]|$)`, "g"))) {
    const c = m[1]!;
    if (/\d/.test(c) && /[A-Z]/.test(c)) return c;
  }
  return undefined;
}

export class BancoMembros {
  readonly db: DatabaseSync;

  constructor(caminho = caminhoPadrao()) {
    if (caminho !== ":memory:") mkdirSync(/*turbopackIgnore: true*/ dirname(caminho), { recursive: true });
    this.db = new DatabaseSync(caminho);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS membros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefone TEXT NOT NULL UNIQUE, nome TEXT NOT NULL, senha_hash TEXT NOT NULL,
        verificado_em TEXT, consentimento_em TEXT NOT NULL, criado_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessoes (
        token_hash TEXT PRIMARY KEY, membro_id INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
        expira_em TEXT NOT NULL, criado_em TEXT NOT NULL
      );
      -- Código mostrado no site e enviado pela pessoa ao bot. "desafio" é um
      -- segredo guardado em cookie no navegador que pediu o código: só esse
      -- navegador consegue concluir o fluxo.
      CREATE TABLE IF NOT EXISTS codigos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefone TEXT NOT NULL, codigo TEXT NOT NULL, finalidade TEXT NOT NULL,
        desafio_hash TEXT NOT NULL UNIQUE, expira_em TEXT NOT NULL,
        confirmado_em TEXT, usado_em TEXT, criado_em TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS codigos_codigo ON codigos(codigo);
      CREATE TABLE IF NOT EXISTS tentativas (chave TEXT NOT NULL, em TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS tentativas_chave ON tentativas(chave, em);
      CREATE TABLE IF NOT EXISTS progresso (
        membro_id INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
        curso TEXT NOT NULL, licao TEXT NOT NULL, concluido_em TEXT NOT NULL,
        PRIMARY KEY (membro_id, curso, licao)
      );
    `);
  }

  // ---------- limite de tentativas ----------

  /** Registra uma tentativa e diz se ainda está dentro do limite. */
  private dentroDoLimite(chave: string, limite: number, agora = new Date()): boolean {
    const desde = new Date(agora.getTime() - LIMITES.janelaMin * 60_000).toISOString();
    this.db.prepare("DELETE FROM tentativas WHERE em < ?").run(desde);
    const { n } = this.db.prepare("SELECT COUNT(*) AS n FROM tentativas WHERE chave = ? AND em >= ?").get(chave, desde) as { n: number };
    return n < limite;
  }

  private registrar(chave: string, agora = new Date()): void {
    this.db.prepare("INSERT INTO tentativas (chave, em) VALUES (?, ?)").run(chave, agora.toISOString());
  }

  /** Barra o IP que está martelando o site. Chame no começo de toda ação pública. */
  checarIp(ip: string, agora?: Date): void {
    const chave = `ip:${ip}`;
    if (!this.dentroDoLimite(chave, LIMITES.porIp, agora)) throw new ErroMembro("Muitas tentativas. Espere alguns minutos e tente de novo.");
    this.registrar(chave, agora);
  }

  // ---------- cadastro e login ----------

  cadastrar(dados: { nome: string; telefone: string; senha: string; consentiu: boolean }): number {
    const nome = dados.nome.trim().replace(/\s+/g, " ");
    if (nome.length < 2 || nome.length > 80) throw new ErroMembro("Diga seu nome.");
    const telefone = telefoneValido(dados.telefone);
    validarSenha(dados.senha);
    if (!dados.consentiu) throw new ErroMembro("Marque a autorização pra continuar.");

    const existente = this.db.prepare("SELECT id, verificado_em AS v FROM membros WHERE telefone = ?").get(telefone) as { id: number; v: string | null } | undefined;
    const agora = new Date().toISOString();
    if (existente?.v) throw new ErroMembro("Esse número já tem conta. Entre ou use \"Esqueci a senha\".");
    if (existente) {
      // Cadastro anterior nunca confirmado: quem provar o número fica com ele.
      this.db.prepare("UPDATE membros SET nome = ?, senha_hash = ?, consentimento_em = ? WHERE id = ?").run(nome, hashSenha(dados.senha), agora, existente.id);
      this.db.prepare("DELETE FROM sessoes WHERE membro_id = ?").run(existente.id);
      return existente.id;
    }
    const r = this.db.prepare("INSERT INTO membros (telefone, nome, senha_hash, consentimento_em, criado_em) VALUES (?, ?, ?, ?, ?)")
      .run(telefone, nome, hashSenha(dados.senha), agora, agora);
    return Number(r.lastInsertRowid);
  }

  /** Devolve token de sessão. Mensagem de erro igual pra número inexistente e senha errada. */
  entrar(telefoneDigitado: string, senha: string, agora?: Date): { token: string; verificado: boolean } {
    const telefone = normalizarTelefone(telefoneDigitado) ?? "";
    const chave = `login:${telefone}`;
    if (!this.dentroDoLimite(chave, LIMITES.porTelefone, agora)) {
      throw new ErroMembro(`Muitas tentativas pra esse número. Espere ${LIMITES.janelaMin} minutos ou troque a senha.`);
    }
    const m = this.db.prepare("SELECT id, senha_hash AS h, verificado_em AS v FROM membros WHERE telefone = ?").get(telefone) as
      { id: number; h: string; v: string | null } | undefined;
    // Sem conta, confere contra um hash qualquer: o tempo de resposta não entrega se o número existe.
    const ok = conferirSenha(senha, m?.h ?? HASH_FALSO);
    if (!m || !ok) {
      this.registrar(chave, agora);
      throw new ErroMembro("Número ou senha incorretos.");
    }
    return { token: this.criarSessao(m.id), verificado: !!m.v };
  }

  criarSessao(membroId: number): string {
    const { token, hash } = novoToken();
    const agora = new Date();
    this.db.prepare("INSERT INTO sessoes (token_hash, membro_id, expira_em, criado_em) VALUES (?, ?, ?, ?)")
      .run(hash, membroId, new Date(agora.getTime() + SESSAO_DIAS * 86_400_000).toISOString(), agora.toISOString());
    return token;
  }

  membroDaSessao(token: string | undefined): Membro | undefined {
    if (!token) return undefined;
    const r = this.db.prepare(`SELECT m.id, m.telefone, m.nome, m.verificado_em AS v FROM sessoes s
      JOIN membros m ON m.id = s.membro_id WHERE s.token_hash = ? AND s.expira_em > ?`)
      .get(hashToken(token), new Date().toISOString()) as { id: number; telefone: string; nome: string; v: string | null } | undefined;
    return r && { id: r.id, telefone: r.telefone, nome: r.nome, verificado: !!r.v };
  }

  sair(token: string): void {
    this.db.prepare("DELETE FROM sessoes WHERE token_hash = ?").run(hashToken(token));
  }

  // ---------- código pelo WhatsApp ----------

  /** Gera o código pro navegador. Devolve o código (pra mostrar) e o desafio (pro cookie). */
  novoCodigo(telefoneDigitado: string, finalidade: Finalidade, agora = new Date()): { codigo: string; desafio: string; telefone: string } {
    const telefone = telefoneValido(telefoneDigitado);
    if (finalidade === "senha" && !this.db.prepare("SELECT 1 FROM membros WHERE telefone = ? AND verificado_em IS NOT NULL").get(telefone)) {
      // Não revela se o número existe: gera um código que nunca vai funcionar.
      return { codigo: gerarCodigo(), desafio: randomBytes(24).toString("base64url"), telefone };
    }
    // Um código ativo por número/finalidade: os antigos morrem.
    this.db.prepare("UPDATE codigos SET usado_em = ? WHERE telefone = ? AND finalidade = ? AND usado_em IS NULL").run(agora.toISOString(), telefone, finalidade);
    const codigo = gerarCodigo();
    const desafio = randomBytes(24).toString("base64url");
    this.db.prepare(`INSERT INTO codigos (telefone, codigo, finalidade, desafio_hash, expira_em, criado_em) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(telefone, codigo, finalidade, sha(desafio), new Date(agora.getTime() + CODIGO_MINUTOS * 60_000).toISOString(), agora.toISOString());
    return { codigo, desafio, telefone };
  }

  /**
   * Chamado pelo bot quando chega mensagem. `telefone` é o número que ENVIOU
   * (vem do WhatsApp, não da pessoa). Só confirma se bater com o número do código.
   */
  confirmarPeloWhatsapp(telefone: string, texto: string, agora = new Date()): { ok: boolean; mensagem: string } | undefined {
    const codigo = extrairCodigo(texto);
    if (!codigo) return undefined;
    // Busca pelo par código + número que enviou: código de outro número simplesmente não existe aqui.
    const c = this.db.prepare(`SELECT id, finalidade FROM codigos
      WHERE codigo = ? AND telefone = ? AND usado_em IS NULL AND confirmado_em IS NULL AND expira_em > ? ORDER BY id DESC LIMIT 1`)
      .get(codigo, telefone, agora.toISOString()) as { id: number; finalidade: Finalidade } | undefined;
    if (!c) {
      return { ok: false, mensagem: "Não achei esse código pra este número. Ele vale 15 minutos e precisa sair do mesmo WhatsApp que você digitou no site. Gere outro se precisar." };
    }
    this.db.prepare("UPDATE codigos SET confirmado_em = ? WHERE id = ?").run(agora.toISOString(), c.id);
    if (c.finalidade === "cadastro") {
      this.db.prepare("UPDATE membros SET verificado_em = COALESCE(verificado_em, ?) WHERE telefone = ?").run(agora.toISOString(), telefone);
      return { ok: true, mensagem: "✅ Número confirmado! Pode voltar pro site, sua conta já está liberada." };
    }
    return { ok: true, mensagem: "✅ Confirmado! Volte pro site pra criar a nova senha." };
  }

  /** Estado do código do navegador (o site consulta enquanto a pessoa manda a mensagem). */
  statusDoDesafio(desafio: string | undefined, agora = new Date()): { finalidade: Finalidade; telefone: string; codigo: string; confirmado: boolean } | undefined {
    if (!desafio) return undefined;
    const c = this.db.prepare(`SELECT telefone, codigo, finalidade, confirmado_em AS conf FROM codigos
      WHERE desafio_hash = ? AND usado_em IS NULL AND expira_em > ?`).get(sha(desafio), agora.toISOString()) as
      { telefone: string; codigo: string; finalidade: Finalidade; conf: string | null } | undefined;
    return c && { finalidade: c.finalidade, telefone: c.telefone, codigo: c.codigo, confirmado: !!c.conf };
  }

  /** Conclui o cadastro no navegador que pediu: consome o código e abre sessão. */
  concluirCadastro(desafio: string | undefined): string {
    const s = this.statusDoDesafio(desafio);
    if (!s || s.finalidade !== "cadastro" || !s.confirmado) throw new ErroMembro("Ainda não recebemos sua mensagem no WhatsApp.");
    this.db.prepare("UPDATE codigos SET usado_em = ? WHERE desafio_hash = ?").run(new Date().toISOString(), sha(desafio!));
    const m = this.db.prepare("SELECT id FROM membros WHERE telefone = ?").get(s.telefone) as { id: number };
    return this.criarSessao(m.id);
  }

  /** Troca a senha depois de provar o número; derruba todas as sessões antigas. */
  redefinirSenha(desafio: string | undefined, novaSenha: string): string {
    const s = this.statusDoDesafio(desafio);
    if (!s || s.finalidade !== "senha" || !s.confirmado) throw new ErroMembro("Confirme pelo WhatsApp antes de trocar a senha.");
    validarSenha(novaSenha);
    const m = this.db.prepare("SELECT id FROM membros WHERE telefone = ?").get(s.telefone) as { id: number };
    this.db.exec("BEGIN");
    try {
      this.db.prepare("UPDATE membros SET senha_hash = ? WHERE id = ?").run(hashSenha(novaSenha), m.id);
      this.db.prepare("DELETE FROM sessoes WHERE membro_id = ?").run(m.id);
      this.db.prepare("DELETE FROM tentativas WHERE chave = ?").run(`login:${s.telefone}`);
      this.db.prepare("UPDATE codigos SET usado_em = ? WHERE desafio_hash = ?").run(new Date().toISOString(), sha(desafio!));
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    return this.criarSessao(m.id);
  }

  /** Admin: confirma o número na mão (ex.: bot fora do ar). */
  verificarManualmente(telefone: string): void {
    this.db.prepare("UPDATE membros SET verificado_em = COALESCE(verificado_em, ?) WHERE telefone = ?").run(new Date().toISOString(), telefone);
  }

  // ---------- progresso nos cursos ----------

  marcarLicao(membroId: number, curso: string, licao: string, concluida: boolean): void {
    if (concluida) {
      this.db.prepare("INSERT OR IGNORE INTO progresso (membro_id, curso, licao, concluido_em) VALUES (?, ?, ?, ?)")
        .run(membroId, curso, licao, new Date().toISOString());
    } else {
      this.db.prepare("DELETE FROM progresso WHERE membro_id = ? AND curso = ? AND licao = ?").run(membroId, curso, licao);
    }
  }

  licoesConcluidas(membroId: number, curso?: string): Set<string> {
    const linhas = (curso
      ? this.db.prepare("SELECT curso, licao FROM progresso WHERE membro_id = ? AND curso = ?").all(membroId, curso)
      : this.db.prepare("SELECT curso, licao FROM progresso WHERE membro_id = ?").all(membroId)) as { curso: string; licao: string }[];
    return new Set(linhas.map((l) => `${l.curso}/${l.licao}`));
  }

  // ---------- admin / LGPD ----------

  resumo(): { total: number; verificados: number; ultimos7: number } {
    const semana = new Date(Date.now() - 7 * 86_400_000).toISOString();
    return this.db.prepare(`SELECT COUNT(*) AS total, COUNT(verificado_em) AS verificados,
      SUM(CASE WHEN criado_em >= ? THEN 1 ELSE 0 END) AS ultimos7 FROM membros`).get(semana) as { total: number; verificados: number; ultimos7: number };
  }

  listar(limite = 200): (Membro & { criadoEm: string })[] {
    return (this.db.prepare(`SELECT id, telefone, nome, verificado_em AS v, criado_em AS criadoEm FROM membros ORDER BY id DESC LIMIT ?`)
      .all(limite) as { id: number; telefone: string; nome: string; v: string | null; criadoEm: string }[])
      .map(({ v, ...m }) => ({ ...m, verificado: !!v }));
  }

  /** Direito de exclusão (LGPD): apaga conta, sessões e progresso. */
  excluirConta(membroId: number): void {
    this.db.prepare("DELETE FROM membros WHERE id = ?").run(membroId);
  }

  copiarPara(destino: string): void {
    this.db.prepare("VACUUM INTO ?").run(destino);
  }
}

function gerarCodigo(): string {
  for (;;) {
    const c = Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
    if (/\d/.test(c) && /[A-Z]/.test(c)) return c;
  }
}

const HASH_FALSO = hashSenha(randomBytes(16).toString("hex"));
