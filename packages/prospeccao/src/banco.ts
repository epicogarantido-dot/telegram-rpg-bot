import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Estabelecimento } from "./google-places.ts";
import { classificarBeleza, nomeDeExibicao, type AchadoBrasil, type ResultadoReceita } from "./receita.ts";

/**
 * Banco local (SQLite) com os leads. Fica em data/privado/, que está no
 * .gitignore: são dados de terceiros (LGPD) e não vão pro GitHub.
 * Quando o SaaS for pro ar, isto migra pro Postgres/Supabase.
 */
/** "São Paulo", "SAO PAULO" e "sao paulo" viram a mesma chave. */
export function chaveCidade(cidade: string): string {
  return cidade.normalize("NFD").replace(/\p{M}/gu, "").trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Etapas da conversa (docs/abordagem.md): 1ª mensagem → (lembrete) → respondeu → demonstração
 * enviada → cliente. "sem_resposta" sai da fila depois do lembrete; "entrou" é de quem entrou
 * no grupo/comunidade (antigo).
 */
export const STATUS = ["novo", "contatado", "lembrete", "respondeu", "demo_enviada", "cliente", "sem_resposta", "entrou", "nao_contatar"] as const;
export type Status = (typeof STATUS)[number];

export interface Lead extends Estabelecimento {
  nicho: string;
  cidade: string;
  status: Status;
  observacao?: string;
  criadoEm: string;
  contatadoEm?: string;
  uf?: string;
  /** De onde veio: osm, google, receita, manual. */
  fonte?: string;
  cnpj?: string;
  email?: string;
  instagram?: string;
  /** Alertas pra quem vai contatar: telefone fixo, do contador, nome que não confirma o nicho. */
  avisos?: string;
  abertura?: string;
  /** Quando mudou de etapa pela última vez (pro lembrete aparecer no dia certo). */
  atualizadoEm?: string;
  /** Demonstração montada pra ele: /b/<demoSlug>?convite=<demoConvite>. */
  demoSlug?: string;
  demoConvite?: string;
}

/**
 * Passos do funil de venda, na ordem: abriu o site, foi ver os estilos, abriu um exemplo, tocou
 * em "Quero", tocou no WhatsApp, abriu o cadastro, concluiu o cadastro.
 */
export const EVENTOS = ["abriu", "estilos", "exemplo", "quero", "whatsapp", "cadastro_inicio", "cadastro"] as const;
export type Evento = (typeof EVENTOS)[number];

/** Teto de origens diferentes por dia (ver `registrarOrigem`). */
export const MAX_ORIGENS_DIA = 300;

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
  maps_url AS mapsUrl, status, observacao, criado_em AS criadoEm, contatado_em AS contatadoEm,
  fonte, cnpj, email, instagram, avisos, abertura, uf, atualizado_em AS atualizadoEm, demo_slug AS demoSlug, demo_convite AS demoConvite`;

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
      -- De onde vêm as visitas (link do grupo, cartão, convite): só a contagem do dia, sem
      -- guardar quem visitou (nada de IP, cookie ou aparelho).
      CREATE TABLE IF NOT EXISTS origens (
        dia TEXT NOT NULL, origem TEXT NOT NULL, tipo TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (dia, origem, tipo)
      );
      -- Funil de venda: quantos passaram por cada passo no dia (só a contagem, sem quem).
      CREATE TABLE IF NOT EXISTS funil (
        dia TEXT NOT NULL, evento TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (dia, evento)
      );
      -- O que um lead contatado fez no site, pelo link com ?l=<codigo> que você mandou pra ele.
      CREATE TABLE IF NOT EXISTS lead_eventos (
        lead_id TEXT NOT NULL, evento TEXT NOT NULL, detalhe TEXT, em TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS lead_eventos_lead ON lead_eventos(lead_id, em);
    `);
    // Colunas novas em bancos antigos.
    const existentes = new Set((this.db.prepare("PRAGMA table_info(leads)").all() as { name: string }[]).map((c) => c.name));
    for (const coluna of ["fonte", "cnpj", "email", "instagram", "avisos", "abertura", "uf", "cidade_chave", "atualizado_em", "demo_slug", "demo_convite", "codigo"]) {
      if (!existentes.has(coluna)) this.db.exec(`ALTER TABLE leads ADD COLUMN ${coluna} TEXT`);
    }
    if (!existentes.has("cidade_chave")) {
      const atualizar = this.db.prepare("UPDATE leads SET cidade_chave = ? WHERE cidade = ?");
      for (const { cidade } of this.db.prepare("SELECT DISTINCT cidade FROM leads").all() as { cidade: string }[]) atualizar.run(chaveCidade(cidade), cidade);
    }
    // Base nacional tem centenas de milhares de leads: a lista sempre filtra por cidade e status.
    this.db.exec(`CREATE INDEX IF NOT EXISTS leads_cidade ON leads(cidade_chave, uf, status);
      CREATE INDEX IF NOT EXISTS leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS leads_instagram ON leads(instagram)`);
  }

  /**
   * Importa o resultado da Receita. Não mexe em status, Instagram nem observação de
   * quem já existe (o trabalho de quem contata não se perde ao atualizar a base).
   */
  salvarDaReceita(r: ResultadoReceita, nicho: string, cidade: string): { novos: number; total: number } {
    return this.salvarAchados(r.achados.map((e) => ({ ...e, cidade })), nicho);
  }

  /** Lote da Receita (uma cidade ou o Brasil inteiro), numa transação só. */
  salvarAchados(achados: (ResultadoReceita["achados"][number] & { cidade: string })[] | AchadoBrasil[], nicho: string): { novos: number; total: number } {
    const ins = this.db.prepare(`
      INSERT INTO leads (place_id, nicho, cidade, uf, nome, endereco, telefone, status, criado_em, fonte, cnpj, email, avisos, abertura, cidade_chave)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'receita', ?, ?, ?, ?, ?)
      ON CONFLICT(place_id) DO UPDATE SET
        nicho = excluded.nicho, nome = excluded.nome, endereco = excluded.endereco, email = excluded.email, avisos = excluded.avisos, uf = excluded.uf,
        telefone = COALESCE(leads.telefone, excluded.telefone)`);
    const existe = this.db.prepare("SELECT 1 FROM leads WHERE place_id = ?");
    const agora = new Date().toISOString();
    let novos = 0;
    this.db.exec("BEGIN");
    try {
      for (const e of achados) {
        const id = `cnpj:${e.cnpj}`;
        if (!existe.get(id)) novos++;
        const nome = nomeDeExibicao(e);
        // Barbearia, salão e manicure dividem a mesma atividade na Receita: o nome separa.
        const nichoDoLead = nicho === "barbearia" ? classificarBeleza(`${e.nomeFantasia ?? ""} ${e.razaoSocial ?? ""}`) : nicho;
        const avisos = [
          !e.telefone && "sem telefone",
          e.telefone && !e.celular && "telefone fixo (talvez sem WhatsApp)",
          e.telefoneDeContador && "telefone parece do contador",
          nichoDoLead === "beleza_indefinido" && "nome não diz se é barbearia, salão ou manicure",
        ].filter(Boolean).join("; ");
        const status: Status = e.telefone && this.estaBloqueado(e.telefone) ? "nao_contatar" : "novo";
        const endereco = [e.endereco, e.bairro].filter(Boolean).join(" - ") || null;
        ins.run(id, nichoDoLead, e.cidade, e.uf || null, nome, endereco, e.telefone ?? null, status, agora, e.cnpj, e.email ?? null, avisos || null, e.abertura ?? null, chaveCidade(e.cidade));
      }
      this.db.exec("COMMIT");
    } catch (erro) {
      this.db.exec("ROLLBACK");
      throw erro;
    }
    return { novos, total: achados.length };
  }

  /**
   * Separa barbearia, salão e manicure em leads importados antes da separação (pelo nome
   * gravado). Não mexe em status nem no trabalho de quem contatou.
   */
  reclassificarBeleza(): Record<string, number> {
    const contagem: Record<string, number> = {};
    const atualizar = this.db.prepare("UPDATE leads SET nicho = ?, avisos = ? WHERE place_id = ?");
    const linhas = this.db.prepare(`SELECT place_id AS id, nome, avisos FROM leads
      WHERE fonte = 'receita' AND nicho IN ('barbearia', 'salao', 'manicure', 'beleza_indefinido')`).all() as { id: string; nome: string; avisos: string | null }[];
    this.db.exec("BEGIN");
    try {
      for (const l of linhas) {
        const nicho = classificarBeleza(l.nome);
        const avisos = (l.avisos ?? "").split("; ").filter((a) => a && !a.startsWith("nome não diz"))
          .concat(nicho === "beleza_indefinido" ? ["nome não diz se é barbearia, salão ou manicure"] : []).join("; ");
        atualizar.run(nicho, avisos || null, l.id);
        contagem[nicho] = (contagem[nicho] ?? 0) + 1;
      }
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    return contagem;
  }

  /** Lead achado à mão (Google, Instagram, Facebook) ou completado: junta pelo telefone ou pelo @. */
  salvarManual(dados: { nome: string; cidade: string; uf?: string; nicho: string; telefone?: string; instagram?: string; observacao?: string }): { placeId: string; novo: boolean } {
    const instagram = dados.instagram?.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, "").toLowerCase() || undefined;
    const existente = this.db.prepare(`SELECT place_id AS id FROM leads WHERE (? IS NOT NULL AND telefone = ?) OR (? IS NOT NULL AND instagram = ?) LIMIT 1`)
      .get(dados.telefone ?? null, dados.telefone ?? null, instagram ?? null, instagram ?? null) as { id: string } | undefined;
    if (existente) {
      // MEI da Receita sem tipo (só o nome da pessoa) que você achou no Instagram/Google como
      // barbearia: agora sabemos o que é. O nome do negócio também passa a ser o que você viu.
      this.db.prepare(`UPDATE leads SET telefone = COALESCE(telefone, ?), instagram = COALESCE(?, instagram),
        observacao = COALESCE(?, observacao),
        nicho = CASE WHEN nicho = 'beleza_indefinido' THEN ? ELSE nicho END,
        nome = CASE WHEN nicho = 'beleza_indefinido' THEN ? ELSE nome END,
        avisos = CASE WHEN nicho = 'beleza_indefinido' THEN NULLIF(REPLACE(REPLACE(COALESCE(avisos, ''), 'nome não diz se é barbearia, salão ou manicure', ''), '; ;', ';'), '') ELSE avisos END
        WHERE place_id = ?`).run(dados.telefone ?? null, instagram ?? null, dados.observacao ?? null, dados.nicho, dados.nome.trim(), existente.id);
      return { placeId: existente.id, novo: false };
    }
    const placeId = `manual:${instagram ?? dados.telefone ?? `${Date.now()}`}`;
    const status: Status = dados.telefone && this.estaBloqueado(dados.telefone) ? "nao_contatar" : "novo";
    this.db.prepare(`INSERT INTO leads (place_id, nicho, cidade, uf, cidade_chave, nome, telefone, status, criado_em, fonte, instagram, observacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`).run(placeId, dados.nicho, dados.cidade, dados.uf?.toUpperCase() ?? null, chaveCidade(dados.cidade),
      dados.nome.trim(), dados.telefone ?? null, status, new Date().toISOString(), instagram ?? null, dados.observacao ?? null);
    return { placeId, novo: true };
  }

  /** Completar um lead (ex.: achou o @ ou o WhatsApp certo no Instagram). */
  completar(placeId: string, dados: { telefone?: string; instagram?: string }): void {
    const instagram = dados.instagram?.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, "").toLowerCase() || null;
    this.db.prepare(`UPDATE leads SET telefone = COALESCE(?, telefone), instagram = COALESCE(?, instagram) WHERE place_id = ?`)
      .run(dados.telefone ?? null, instagram, placeId);
    if (dados.telefone && this.estaBloqueado(dados.telefone)) this.db.prepare("UPDATE leads SET status = 'nao_contatar' WHERE place_id = ?").run(placeId);
  }

  /** Insere sem sobrescrever o status de quem já existe. Devolve quantos eram novos. */
  salvarEstabelecimentos(lista: Estabelecimento[], nicho: string, cidade: string): number {
    const ins = this.db.prepare(`
      INSERT INTO leads (place_id, nicho, cidade, nome, endereco, telefone, site, nota, avaliacoes, maps_url, status, criado_em, cidade_chave)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        e.nota ?? null, e.avaliacoes ?? null, e.mapsUrl ?? null, status, agora, chaveCidade(cidade));
    }
    return novos;
  }

  listar(filtro: { status?: Status; nicho?: string; cidade?: string; uf?: string; limite?: number } = {}): Lead[] {
    const where: string[] = [];
    const args: (string | number)[] = [];
    if (filtro.cidade) { where.push("cidade_chave = ?"); args.push(chaveCidade(filtro.cidade)); }
    if (filtro.uf) { where.push("uf = ?"); args.push(filtro.uf.toUpperCase()); }
    if (filtro.status) { where.push("status = ?"); args.push(filtro.status); }
    if (filtro.nicho) { where.push("nicho = ?"); args.push(filtro.nicho); }
    const sql = `SELECT ${COLUNAS} FROM leads ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY CASE status WHEN 'novo' THEN 0 ELSE 1 END, avaliacoes DESC NULLS LAST LIMIT ?`;
    return this.db.prepare(sql).all(...args, filtro.limite ?? 500) as unknown as Lead[];
  }

  marcar(placeId: string, status: Status, observacao?: string): void {
    const lead = this.db.prepare(`SELECT ${COLUNAS} FROM leads WHERE place_id = ?`).get(placeId) as Lead | undefined;
    if (!lead) throw new Error(`Lead ${placeId} não existe`);
    const agora = new Date().toISOString();
    this.db.prepare(`UPDATE leads SET status = ?, observacao = COALESCE(?, observacao), atualizado_em = ?,
      contatado_em = CASE WHEN ? = 'contatado' THEN ? ELSE contatado_em END WHERE place_id = ?`)
      .run(status, observacao ?? null, agora, status, agora, placeId);
    if (status === "nao_contatar" && lead.telefone) this.bloquear(lead.telefone);
  }

  /** Guarda a demonstração montada pro lead (o convite fica aqui, no banco privado, pra reenviar o link). */
  guardarDemonstracao(placeId: string, slug: string, convite: string): void {
    this.db.prepare("UPDATE leads SET demo_slug = ?, demo_convite = ? WHERE place_id = ?").run(slug, convite, placeId);
  }

  lead(placeId: string): Lead | undefined {
    return this.db.prepare(`SELECT ${COLUNAS} FROM leads WHERE place_id = ?`).get(placeId) as Lead | undefined;
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

  resumo(filtro: { cidade?: string; uf?: string } = {}): Record<Status, number> {
    const base = Object.fromEntries(STATUS.map((s) => [s, 0])) as Record<Status, number>;
    const where: string[] = [];
    const args: string[] = [];
    if (filtro.cidade) { where.push("cidade_chave = ?"); args.push(chaveCidade(filtro.cidade)); }
    if (filtro.uf) { where.push("uf = ?"); args.push(filtro.uf.toUpperCase()); }
    for (const r of this.db.prepare(`SELECT status, COUNT(*) AS n FROM leads ${where.length ? "WHERE " + where.join(" AND ") : ""} GROUP BY status`).all(...args) as { status: Status; n: number }[]) {
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

  // ---------- de onde vêm as visitas (contagem agregada, sem dado pessoal) ----------

  /**
   * Soma 1 na origem do dia ("grupo-o-poste-da-barbearia", "cartao", "convite"). `tipo`:
   * visita (abriu o site pelo link) ou cadastro (criou conta de barbearia vindo dele).
   * Origem estranha é ignorada; e no máximo MAX_ORIGENS_DIA origens novas por dia, pra
   * ninguém encher o banco inventando nomes.
   */
  registrarOrigem(origem: string, tipo: "visita" | "cadastro", agora = new Date()): boolean {
    if (!/^[a-z0-9-]{2,60}$/.test(origem)) return false;
    const dia = agora.toISOString().slice(0, 10);
    const existe = this.db.prepare("SELECT 1 FROM origens WHERE dia = ? AND origem = ? AND tipo = ?").get(dia, origem, tipo);
    if (!existe) {
      const n = (this.db.prepare("SELECT COUNT(*) AS n FROM origens WHERE dia = ?").get(dia) as { n: number }).n;
      if (n >= MAX_ORIGENS_DIA) return false;
    }
    this.db.prepare(`INSERT INTO origens (dia, origem, tipo, total) VALUES (?, ?, ?, 1)
      ON CONFLICT (dia, origem, tipo) DO UPDATE SET total = total + 1`).run(dia, origem, tipo);
    return true;
  }

  // ---------- funil de venda ----------

  /** Soma 1 no passo do funil do dia. Evento desconhecido é ignorado. */
  registrarEvento(evento: string, agora = new Date()): boolean {
    if (!(EVENTOS as readonly string[]).includes(evento)) return false;
    this.db.prepare(`INSERT INTO funil (dia, evento, total) VALUES (?, ?, 1)
      ON CONFLICT (dia, evento) DO UPDATE SET total = total + 1`).run(agora.toISOString().slice(0, 10), evento);
    return true;
  }

  /** Total de cada passo do funil nos últimos `dias` (na ordem do funil, com zero onde não houve). */
  resumoFunil(dias = 30, agora = new Date()): { evento: Evento; total: number }[] {
    const desde = new Date(agora.getTime() - (dias - 1) * 86_400_000).toISOString().slice(0, 10);
    const linhas = this.db.prepare("SELECT evento, SUM(total) AS total FROM funil WHERE dia >= ? GROUP BY evento").all(desde) as { evento: string; total: number }[];
    const por = new Map(linhas.map((l) => [l.evento, l.total]));
    return EVENTOS.map((evento) => ({ evento, total: por.get(evento) ?? 0 }));
  }

  /** Código curto do lead pro link (?l=), criado na primeira vez. Não é o nome: não dá pra adivinhar nem trocar. */
  codigoDoLead(placeId: string): string | undefined {
    const atual = this.db.prepare("SELECT codigo FROM leads WHERE place_id = ?").get(placeId) as { codigo: string | null } | undefined;
    if (!atual) return undefined;
    if (atual.codigo) return atual.codigo;
    for (;;) {
      const codigo = Array.from({ length: 7 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
      if (this.db.prepare("SELECT 1 FROM leads WHERE codigo = ?").get(codigo)) continue;
      this.db.prepare("UPDATE leads SET codigo = ? WHERE place_id = ?").run(codigo, placeId);
      return codigo;
    }
  }

  /**
   * O lead do link fez algo no site. O mesmo passo (e detalhe) em menos de 30 min conta uma vez só,
   * pra recarregar a página não inflar. Código que não existe é ignorado.
   */
  registrarEventoDoLead(codigo: string, evento: string, detalhe?: string, agora = new Date()): boolean {
    if (!/^[a-z0-9]{7}$/.test(codigo) || !(EVENTOS as readonly string[]).includes(evento)) return false;
    const lead = this.db.prepare("SELECT place_id AS id FROM leads WHERE codigo = ?").get(codigo) as { id: string } | undefined;
    if (!lead) return false;
    const d = detalhe && /^[a-z0-9-]{1,40}$/.test(detalhe) ? detalhe : null;
    const desde = new Date(agora.getTime() - 30 * 60_000).toISOString();
    if (this.db.prepare("SELECT 1 FROM lead_eventos WHERE lead_id = ? AND evento = ? AND detalhe IS ? AND em > ?").get(lead.id, evento, d, desde)) return false;
    this.db.prepare("INSERT INTO lead_eventos (lead_id, evento, detalhe, em) VALUES (?, ?, ?, ?)").run(lead.id, evento, d, agora.toISOString());
    return true;
  }

  /** O que o lead fez no site, do mais recente pro mais antigo. */
  eventosDoLead(placeId: string, limite = 20): { evento: Evento; detalhe?: string; em: string }[] {
    return (this.db.prepare("SELECT evento, detalhe, em FROM lead_eventos WHERE lead_id = ? ORDER BY em DESC LIMIT ?").all(placeId, limite) as { evento: Evento; detalhe: string | null; em: string }[])
      .map((e) => ({ evento: e.evento, detalhe: e.detalhe ?? undefined, em: e.em }));
  }

  /** Visitas e cadastros por origem nos últimos `dias`, das que mais trouxeram gente. */
  resumoOrigens(dias = 30, agora = new Date()): { origem: string; visitas: number; cadastros: number }[] {
    const desde = new Date(agora.getTime() - (dias - 1) * 86_400_000).toISOString().slice(0, 10);
    return this.db.prepare(`SELECT origem,
        SUM(CASE WHEN tipo = 'visita' THEN total ELSE 0 END) AS visitas,
        SUM(CASE WHEN tipo = 'cadastro' THEN total ELSE 0 END) AS cadastros
      FROM origens WHERE dia >= ? GROUP BY origem ORDER BY cadastros DESC, visitas DESC, origem`)
      .all(desde) as unknown as { origem: string; visitas: number; cadastros: number }[];
  }
}
