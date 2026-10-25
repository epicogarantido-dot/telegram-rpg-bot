import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Estabelecimento } from "./google-places.ts";

/**
 * Banco local (SQLite) com os leads. Fica em data/privado/, que está no
 * .gitignore: são dados de terceiros (LGPD) e não vão pro GitHub.
 * Quando o SaaS for pro ar, isto migra pro Postgres/Supabase.
 */
export const STATUS = ["novo", "contatado", "respondeu", "entrou", "cliente", "nao_contatar"] as const;
export type Status = (typeof STATUS)[number];

export interface Lead extends Estabelecimento {
  nicho: string;
  cidade: string;
  status: Status;
  observacao?: string;
  criadoEm: string;
  contatadoEm?: string;
}

export interface Inscricao {
  id: number;
  nome: string;
  telefone: string;
  negocio?: string;
  cidade?: string;
  interesse: string;
  criadoEm: string;
}

function caminhoPadrao(): string {
  if (process.env.PROSPECCAO_DB) return process.env.PROSPECCAO_DB;
  let dir = process.cwd();
  while (!existsSync(join(dir, "data"))) {
    const pai = dirname(dir);
    if (pai === dir) throw new Error("Pasta data/ não encontrada; defina PROSPECCAO_DB.");
    dir = pai;
  }
  return join(dir, "data", "privado", "prospeccao.db");
}

const COLUNAS = `place_id AS placeId, nicho, cidade, nome, endereco, telefone, site, nota, avaliacoes,
  maps_url AS mapsUrl, status, observacao, criado_em AS criadoEm, contatado_em AS contatadoEm`;

export class BancoProspeccao {
  readonly db: DatabaseSync;

  constructor(caminho = caminhoPadrao()) {
    if (caminho !== ":memory:") mkdirSync(/*turbopackIgnore: true*/ dirname(caminho), { recursive: true });
    this.db = new DatabaseSync(caminho);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        place_id TEXT PRIMARY KEY,
        nicho TEXT NOT NULL,
        cidade TEXT NOT NULL,
        nome TEXT NOT NULL,
        endereco TEXT, telefone TEXT, site TEXT, nota REAL, avaliacoes INTEGER, maps_url TEXT,
        status TEXT NOT NULL DEFAULT 'novo',
        observacao TEXT,
        criado_em TEXT NOT NULL,
        contatado_em TEXT
      );
      CREATE INDEX IF NOT EXISTS leads_telefone ON leads(telefone);
      -- Telefones que pediram pra não ser contatados. Separado dos leads de
      -- propósito: sobrevive mesmo se o lead for apagado e recoletado.
      CREATE TABLE IF NOT EXISTS bloqueados (telefone TEXT PRIMARY KEY, criado_em TEXT NOT NULL);
      -- Quem se inscreveu sozinho pelo site (opt-in): o lead mais valioso.
      CREATE TABLE IF NOT EXISTS inscricoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL, telefone TEXT NOT NULL, negocio TEXT, cidade TEXT,
        interesse TEXT NOT NULL, criado_em TEXT NOT NULL
      );
    `);
  }

  /** Insere sem sobrescrever o status de quem já existe. Devolve quantos eram novos. */
  salvarEstabelecimentos(lista: Estabelecimento[], nicho: string, cidade: string): number {
    const ins = this.db.prepare(`
      INSERT INTO leads (place_id, nicho, cidade, nome, endereco, telefone, site, nota, avaliacoes, maps_url, status, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(place_id) DO UPDATE SET
        nome = excluded.nome, endereco = excluded.endereco, telefone = excluded.telefone,
        site = excluded.site, nota = excluded.nota, avaliacoes = excluded.avaliacoes, maps_url = excluded.maps_url`);
    const existe = this.db.prepare("SELECT 1 FROM leads WHERE place_id = ?");
    const agora = new Date().toISOString();
    let novos = 0;
    for (const e of lista) {
      if (!existe.get(e.placeId)) novos++;
      const status: Status = e.telefone && this.estaBloqueado(e.telefone) ? "nao_contatar" : "novo";
      ins.run(e.placeId, nicho, cidade, e.nome, e.endereco ?? null, e.telefone ?? null, e.site ?? null,
        e.nota ?? null, e.avaliacoes ?? null, e.mapsUrl ?? null, status, agora);
    }
    return novos;
  }

  listar(filtro: { status?: Status; nicho?: string; limite?: number } = {}): Lead[] {
    const where: string[] = [];
    const args: (string | number)[] = [];
    if (filtro.status) { where.push("status = ?"); args.push(filtro.status); }
    if (filtro.nicho) { where.push("nicho = ?"); args.push(filtro.nicho); }
    const sql = `SELECT ${COLUNAS} FROM leads ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY CASE status WHEN 'novo' THEN 0 ELSE 1 END, avaliacoes DESC NULLS LAST LIMIT ?`;
    return this.db.prepare(sql).all(...args, filtro.limite ?? 500) as unknown as Lead[];
  }

  marcar(placeId: string, status: Status, observacao?: string): void {
    const lead = this.db.prepare(`SELECT ${COLUNAS} FROM leads WHERE place_id = ?`).get(placeId) as Lead | undefined;
    if (!lead) throw new Error(`Lead ${placeId} não existe`);
    this.db.prepare(`UPDATE leads SET status = ?, observacao = COALESCE(?, observacao),
      contatado_em = CASE WHEN ? = 'contatado' THEN ? ELSE contatado_em END WHERE place_id = ?`)
      .run(status, observacao ?? null, status, new Date().toISOString(), placeId);
    if (status === "nao_contatar" && lead.telefone) this.bloquear(lead.telefone);
  }

  /** Opt-out: bloqueia o número e marca todos os leads com ele. Irreversível pela interface, de propósito. */
  bloquear(telefone: string): void {
    this.db.prepare("INSERT OR IGNORE INTO bloqueados (telefone, criado_em) VALUES (?, ?)").run(telefone, new Date().toISOString());
    this.db.prepare("UPDATE leads SET status = 'nao_contatar' WHERE telefone = ?").run(telefone);
  }

  estaBloqueado(telefone: string): boolean {
    return !!this.db.prepare("SELECT 1 FROM bloqueados WHERE telefone = ?").get(telefone);
  }

  /** Contatos feitos hoje — pra respeitar o limite diário. */
  contatadosHoje(): number {
    const hoje = new Date().toISOString().slice(0, 10);
    const r = this.db.prepare("SELECT COUNT(*) AS n FROM leads WHERE substr(contatado_em, 1, 10) = ?").get(hoje) as { n: number };
    return r.n;
  }

  resumo(): Record<Status, number> {
    const base = Object.fromEntries(STATUS.map((s) => [s, 0])) as Record<Status, number>;
    for (const r of this.db.prepare("SELECT status, COUNT(*) AS n FROM leads GROUP BY status").all() as { status: Status; n: number }[]) {
      base[r.status] = r.n;
    }
    return base;
  }

  inscrever(i: Omit<Inscricao, "id" | "criadoEm">): void {
    this.db.prepare(`INSERT INTO inscricoes (nome, telefone, negocio, cidade, interesse, criado_em) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(i.nome, i.telefone, i.negocio ?? null, i.cidade ?? null, i.interesse, new Date().toISOString());
  }

  inscricoes(): Inscricao[] {
    return this.db.prepare(`SELECT id, nome, telefone, negocio, cidade, interesse, criado_em AS criadoEm
      FROM inscricoes ORDER BY id DESC`).all() as unknown as Inscricao[];
  }
}
