import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashToken, novoToken } from "@aprenda/agenda";
import { ehCelularBR, normalizarTelefone } from "@aprenda/prospeccao";

/**
 * Contas dos alunos do site de cursos. Login = o próprio WhatsApp, sem senha.
 *
 * A pessoa ESCREVE pro bot (o bot só responde). A mensagem que chega do número X
 * prova que ela controla X, então o bot responde com um link pessoal que abre o
 * site já logado. O link vale uma vez e por pouco tempo; o banco guarda só o hash.
 * Quem já tem conta e quer entrar de novo pede outro link do mesmo jeito.
 */

export class ErroMembro extends Error {}

export interface Membro {
  id: number;
  telefone: string;
  nome: string;
  verificado: boolean;
}

export const SESSAO_DIAS = 180;
export const LINK_HORAS = 24;

export const LIMITES = {
  /** Links pedidos por número em 15 min. */
  linksPorTelefone: 5,
  /** Tentativas de entrar por IP em 15 min. */
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

/** Normaliza e exige celular brasileiro (WhatsApp). */
export function telefoneValido(entrada: string): string {
  const t = normalizarTelefone(entrada);
  if (!t || !ehCelularBR(t)) throw new ErroMembro("Digite um celular brasileiro com DDD, ex.: (11) 98765-4321.");
  return t;
}

/**
 * Nome vindo do perfil do WhatsApp (ou digitado na área do aluno): sem emoji,
 * sem quebra de linha, tamanho de nome. Vazio vira undefined.
 */
export function limparNome(bruto: string | undefined): string | undefined {
  const nome = (bruto ?? "").normalize("NFC").replace(/[^\p{L}\p{M}' .-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60).trim();
  return nome.length >= 2 ? nome : undefined;
}

export class BancoMembros {
  readonly db: DatabaseSync;

  constructor(caminho = caminhoPadrao()) {
    if (caminho !== ":memory:") mkdirSync(/*turbopackIgnore: true*/ dirname(caminho), { recursive: true });
    this.db = new DatabaseSync(caminho);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      -- senha_hash ficou de quando o login tinha senha; contas novas gravam vazio.
      CREATE TABLE IF NOT EXISTS membros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefone TEXT NOT NULL UNIQUE, nome TEXT NOT NULL, senha_hash TEXT NOT NULL,
        verificado_em TEXT, consentimento_em TEXT NOT NULL, criado_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessoes (
        token_hash TEXT PRIMARY KEY, membro_id INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
        expira_em TEXT NOT NULL, criado_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS links_entrada (
        token_hash TEXT PRIMARY KEY, membro_id INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
        expira_em TEXT NOT NULL, usado_em TEXT, criado_em TEXT NOT NULL
      );
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

  // ---------- entrar pelo WhatsApp ----------

  /**
   * O número `telefone` escreveu pro bot (vem do WhatsApp, não de formulário):
   * cria a conta no primeiro contato e devolve um link de entrada novo. Os links
   * anteriores ainda não usados morrem.
   */
  linkDeEntrada(telefone: string, nomePerfil?: string, agora = new Date()): { token: string; nome: string; novo: boolean } {
    const tel = telefoneValido(telefone);
    const chave = `link:${tel}`;
    if (!this.dentroDoLimite(chave, LIMITES.linksPorTelefone, agora)) {
      throw new ErroMembro(`Você pediu muitos links seguidos. Espere ${LIMITES.janelaMin} minutos e mande *entrar* de novo.`);
    }
    this.registrar(chave, agora);
    const quando = agora.toISOString();
    let m = this.db.prepare("SELECT id, nome FROM membros WHERE telefone = ?").get(tel) as { id: number; nome: string } | undefined;
    const novo = !m;
    if (!m) {
      const nome = limparNome(nomePerfil) ?? "Aluno";
      const r = this.db.prepare(`INSERT INTO membros (telefone, nome, senha_hash, verificado_em, consentimento_em, criado_em)
        VALUES (?, ?, '', ?, ?, ?)`).run(tel, nome, quando, quando, quando);
      m = { id: Number(r.lastInsertRowid), nome };
    } else {
      // Conta antiga que nunca confirmou o número: a mensagem agora confirma.
      this.db.prepare("UPDATE membros SET verificado_em = COALESCE(verificado_em, ?) WHERE id = ?").run(quando, m.id);
    }
    this.db.prepare("UPDATE links_entrada SET usado_em = ? WHERE membro_id = ? AND usado_em IS NULL").run(quando, m.id);
    const { token, hash } = novoToken();
    this.db.prepare("INSERT INTO links_entrada (token_hash, membro_id, expira_em, criado_em) VALUES (?, ?, ?, ?)")
      .run(hash, m.id, new Date(agora.getTime() + LINK_HORAS * 3_600_000).toISOString(), quando);
    return { token, nome: m.nome, novo };
  }

  /** Troca o link (uma vez só, dentro do prazo) por uma sessão. */
  entrarComLink(token: string, agora = new Date()): string {
    const r = this.db.prepare(`UPDATE links_entrada SET usado_em = ?
      WHERE token_hash = ? AND usado_em IS NULL AND expira_em > ? RETURNING membro_id AS id`)
      .get(agora.toISOString(), hashToken(token), agora.toISOString()) as { id: number } | undefined;
    if (!r) throw new ErroMembro("Esse link já foi usado ou venceu. Peça um novo no WhatsApp.");
    return this.criarSessao(r.id, agora);
  }

  criarSessao(membroId: number, agora = new Date()): string {
    const { token, hash } = novoToken();
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

  /** "Sair de todos os aparelhos": derruba todas as sessões e links ainda não usados. */
  sairDeTodos(membroId: number): void {
    this.db.prepare("DELETE FROM sessoes WHERE membro_id = ?").run(membroId);
    this.db.prepare("UPDATE links_entrada SET usado_em = ? WHERE membro_id = ? AND usado_em IS NULL").run(new Date().toISOString(), membroId);
  }

  trocarNome(membroId: number, nome: string): void {
    const limpo = limparNome(nome);
    if (!limpo) throw new ErroMembro("Escreva seu nome.");
    this.db.prepare("UPDATE membros SET nome = ? WHERE id = ?").run(limpo, membroId);
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
