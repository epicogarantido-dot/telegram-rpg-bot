import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { horariosLivres, type Expediente } from "./disponibilidade.ts";
import { conferirSenha, hashSenha, hashToken, novoToken } from "./senha.ts";
import { randomBytes, randomUUID } from "node:crypto";
import { categoriaValida, temaValido, TEMA_PADRAO, type CategoriaFoto, type IdTema } from "./temas.ts";
import { agoraNoFuso, deMinutos, diaDaSemana, paraMinutos, somarDias, type Data, type DataHora } from "./tempo.ts";

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
  /** Último dia (inclusive) com acesso liberado. Depois disso, tudo bloqueia até o admin confirmar um Pix. */
  acessoAte: Data;
  tema: IdTema;
  bio?: string;
  cidade?: string;
  instagram?: string;
  /** Faixa de oferta no site, ex.: "10% off na primeira visita". */
  oferta?: string;
  /** Ano de abertura (vira "X anos de casa" no site). */
  desde?: number;
  /** Mostrar os preços dos serviços no site. */
  mostrarPrecos: boolean;
  /** De quantos em quantos minutos começam os horários (15 a 120). */
  intervaloMin: number;
  /** Minutos livres entre um cliente e outro (atraso, limpar a cadeira). */
  folgaMin: number;
  /** Como atende: só com horário marcado, só por ordem de chegada, ou os dois. */
  atendimento: Atendimento;
  /** Dia (no fuso da barbearia) em que o dono fechou a barbearia de última hora. */
  fechadoEm?: Data;
  /** Pessoas esperando na fila (ordem de chegada) e quando o dono informou. */
  filaPessoas?: number;
  filaAtualizadaEm?: string;
  /**
   * Site de DEMONSTRAÇÃO montado pelo Aprenda Livre pra mostrar a um barbeiro (não tem dono
   * ainda). Vale até este dia; agendar fica desligado. Vira o site dele com `assumirDemonstracao`.
   */
  demoAte?: Data;
  /**
   * Conta nova que ainda não pagou: o barbeiro monta o site no painel (fotos, equipe, preços) e
   * só ele vê a página pública. O primeiro Pix confirmado publica (`confirmarPagamento`).
   */
  emMontagem: boolean;
  /** Tirada do ar pelo admin (`suspender`), sem mexer no prazo pago. */
  suspensa: boolean;
  /** Link da página de avaliação no Google (o barbeiro cola uma vez em Configurações). */
  linkAvaliacao?: string;
  /** Em quantos dias o cliente costuma voltar, quando ele ainda não tem histórico. */
  retornoDias: number;
}

/** Categorias de foto que o cliente pode escolher como "quero esse corte" ao marcar. */
export const CATEGORIAS_REFERENCIA: string[] = ["degrade", "corte", "barba", "navalhado", "infantil"];

/** Retorno padrão sugerido pra cliente sem histórico (dá pra mudar em Configurações). */
export const RETORNO_PADRAO_DIAS = 21;

/** "Clientes que sumiram": depois de quantos dias desiste (cliente perdido) e quanto espera pra chamar de novo. */
export const SUMIDO_LIMITE_DIAS = 120;
export const CHAMADA_PAUSA_DIAS = 14;
export interface ClienteSumido {
  telefone: string;
  nome: string;
  ultimoServico: string;
  ultimaVisita: Data;
  diasSemVir: number;
  ritmoDias: number;
}

/** Plano mensal de um cliente, com o uso do mês. */
export interface PlanoCliente {
  id: number;
  telefone: string;
  nome: string;
  usosPorMes: number;
  valorCentavos: number;
  validoAte: Data;
  usadosNoMes: number;
  vencido: boolean;
}

export interface DivisaoProfissional {
  profissionalId: number;
  nome: string;
  atendidos: number;
  totalCentavos: number;
  partePct?: number;
  parteProfissionalCentavos?: number;
  parteBarbeariaCentavos?: number;
}

/** O resumo do mês no painel (ver `numerosDoMes`). */
export interface NumerosDoMes {
  atendidos: number;
  faltas: number;
  faturamentoCentavos: number;
  perdidoEmFaltasCentavos: number;
  /** De 0 a 1, aproximada. */
  ocupacao: number;
  clientes: number;
  clientesQueVoltaram: number;
  /** Atendimentos do mês em que o cliente já tem outro horário marcado depois. */
  saiuComRetorno: number;
}

/** Quantos dias uma demonstração fica no ar. */
export const DEMONSTRACAO_DIAS = 14;
/** Dias que uma conta nova (sem período grátis) tem pra montar o site antes de pagar. */
export const MONTAGEM_DIAS = 14;

export type Atendimento = "agenda" | "chegada" | "ambos";
export const INTERVALOS = [15, 20, 30, 60, 90, 120] as const;
/** Opções de folga entre clientes, em minutos. */
export const FOLGAS = [0, 5, 10, 15, 20, 30] as const;
/** Quantos horários futuros um mesmo número pode ter na mesma barbearia (marcando pelo site). */
export const MAX_HORARIOS_POR_TELEFONE = 2;
/** Fila informada há mais tempo que isso não aparece no site (pode estar errada). */
export const FILA_VALIDA_MIN = 180;

export interface Foto {
  id: number;
  /** Nome do arquivo no disco (uuid). A URL pública é /f/<arquivo>.webp */
  arquivo: string;
  categoria: CategoriaFoto;
  legenda?: string;
  largura: number;
  altura: number;
  capa: number;
  /** Se esta foto é o "antes" de outra, o arquivo da foto "depois". */
  antesDe?: string;
}

export type StatusPagamento = "aberto" | "informado" | "confirmado" | "recusado";
export interface Pagamento {
  id: number;
  barbeariaId: number;
  barbearia: string;
  txid: string;
  valorCentavos: number;
  dias: number;
  status: StatusPagamento;
  pagador?: string;
  /** Arquivo do comprovante que o barbeiro mandou (só o admin vê). */
  comprovante?: string;
  criadoEm: string;
  decididoEm?: string;
}
export interface Profissional {
  id: number; nome: string; ativo: number; especialidade?: string; fotoArquivo?: string;
  /** Porcentagem de cada serviço que fica com o profissional (parceiro ou comissão). Vazio = não divide. */
  partePct?: number;
}

/** Limite de fotos por barbearia: segura o disco do servidor. */
export const MAX_FOTOS = 80;
export interface Servico {
  id: number; nome: string; duracaoMin: number; precoCentavos: number; ativo: number;
  /** O que o serviço inclui, em poucas palavras ("toalha quente, navalha e massagem no fim"). */
  descricao?: string;
  /** Atendimento na casa do cliente: o agendamento pede o endereço. */
  emDomicilio: boolean;
  /** Oferecido como adicional de outro serviço ("+ barba", "+ sobrancelha"), além de sozinho. */
  adicional: boolean;
}
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
  /** "faltou": o cliente não apareceu (só dá pra marcar depois da hora do horário). */
  status: "confirmado" | "cancelado" | "faltou";
  /** Quando o barbeiro abriu o lembrete da véspera e o pedido de avaliação (pra não repetir). */
  lembreteEm?: string;
  avaliacaoEm?: string;
  /** Foto do portfólio que o cliente escolheu ao marcar ("quero esse corte"). */
  referenciaFoto?: string;
  /** Endereço do cliente, só em serviço em domicílio (só o barbeiro vê). */
  enderecoCliente?: string;
  /** Ids dos adicionais escolhidos (o nome já vem somado em `servico`: "Corte + Barba"). */
  adicionais?: number[];
}
/** O que o cliente vê na página do próprio horário (link secreto). */
export interface HorarioCliente extends Agendamento {
  duracaoMin: number;
  /** Já começou ou passou: não dá mais pra cancelar nem remarcar pelo link. */
  passou: boolean;
}
/** Folga em parte do dia (médico, compromisso): some do site como se estivesse ocupado. */
export interface Bloqueio {
  id: number;
  /** Sem profissional = vale pra barbearia toda. */
  profissionalId?: number;
  profissional?: string;
  inicio: DataHora;
  fim: DataHora;
  motivo?: string;
}
export interface Usuario { id: number; barbeariaId: number; nome: string; email: string }

export class ErroAgenda extends Error {}

export interface Plano {
  /** Mensalidade: cada pagamento depois do primeiro. */
  valorCentavos: number;
  /** Contratação: valor do PRIMEIRO pagamento (já inclui o primeiro período). 0/ausente = igual à mensalidade. */
  adesaoCentavos?: number;
  dias: number;
  /** Dias grátis na criação da conta. 0 = precisa pagar antes de usar. */
  testeDias: number;
  /**
   * Prazo vencido tira o site e o painel do ar (padrão). false = vencer só avisa o barbeiro (o
   * SaaS): aí só a suspensão do admin (`suspender`) tira do ar. Demonstração vence sempre.
   */
  vencerBloqueia?: boolean;
}

export function planoDoAmbiente(): Plano {
  return {
    valorCentavos: Math.round(Number(process.env.PLANO_VALOR ?? "50") * 100),
    adesaoCentavos: Math.round(Number(process.env.PLANO_ADESAO ?? "100") * 100),
    dias: Number(process.env.PLANO_DIAS ?? 30),
    testeDias: Number(process.env.PLANO_TESTE_DIAS ?? 0),
  };
}

const COLUNAS_BARBEARIA = "id, slug, nome, telefone, endereco, fuso, acesso_ate AS acessoAte, tema, bio, cidade, instagram, oferta, desde, " +
  "mostrar_precos AS mostrarPrecos, intervalo_min AS intervaloMin, folga_min AS folgaMin, atendimento, fechado_em AS fechadoEm, fila_pessoas AS filaPessoas, fila_atualizada_em AS filaAtualizadaEm, " +
  "demo_ate AS demoAte, link_avaliacao AS linkAvaliacao, retorno_dias AS retornoDias, montagem AS emMontagem, suspensa";

/** O SQLite devolve 0/1 e null; aqui vira boolean e undefined. */
function paraBarbearia<T extends Record<string, unknown>>(linha: T | undefined): (Barbearia & T) | undefined {
  if (!linha) return undefined;
  const b = { ...linha, mostrarPrecos: linha.mostrarPrecos === 1, emMontagem: linha.emMontagem === 1, suspensa: linha.suspensa === 1 } as Record<string, unknown>;
  for (const k of ["fechadoEm", "filaPessoas", "filaAtualizadaEm", "endereco", "bio", "cidade", "instagram", "oferta", "desde", "demoAte", "linkAvaliacao"]) if (b[k] === null) b[k] = undefined;
  return b as Barbearia & T;
}
const COLUNAS_FOTO = "id, arquivo, categoria, legenda, largura, altura, capa, antes_de AS antesDe";
const COLUNAS_PAGAMENTO = `p.id, p.barbearia_id AS barbeariaId, b.nome AS barbearia, p.txid, p.valor_centavos AS valorCentavos,
  p.dias, p.status, p.pagador, p.comprovante, p.criado_em AS criadoEm, p.decidido_em AS decididoEm`;

const DURACAO_SESSAO_DIAS = 30;
/** Quanto tempo vale o link de troca de senha. */
export const LINK_SENHA_HORAS = 24;

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

/** Final do e-mail de marcação das contas criadas pelo pedido sem e-mail (`criarPedido`). */
export const SEM_EMAIL = "@sem-email.invalid";

/** Conta feita pelo pedido sem e-mail: não mostrar o e-mail de marcação. */
export function semEmail(email: string | undefined): boolean {
  return !email || email.endsWith(SEM_EMAIL);
}

export function gerarSlug(nome: string): string {
  return nome.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "barbearia";
}

function nomeValido(nome: string, oque: string): string {
  const n = nome.trim().replace(/\s+/g, " ");
  if (n.length < 2 || n.length > 40) throw new ErroAgenda(`Informe ${oque} (2 a 40 letras).`);
  return n;
}

type DadosServico = { nome: string; duracaoMin: number; precoCentavos: number; descricao?: string; emDomicilio?: boolean; adicional?: boolean };

/** Máximo de adicionais num mesmo horário. */
export const MAX_ADICIONAIS = 4;

/** "Corte + Barba" já tem barba: não oferece "+ Barba" de novo. */
function semAcento(t: string): string {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function servicoValido(s: DadosServico) {
  if (!(s.duracaoMin >= 5 && s.duracaoMin <= 480)) throw new ErroAgenda("Duração entre 5 e 480 minutos.");
  if (!(s.precoCentavos >= 0 && s.precoCentavos <= 10_000_00)) throw new ErroAgenda("Preço inválido.");
  const descricao = s.descricao?.trim().replace(/\s+/g, " ") || null;
  if (descricao && descricao.length > 140) throw new ErroAgenda("A descrição do serviço tem até 140 letras.");
  return { nome: nomeValido(s.nome, "o nome do serviço"), duracaoMin: Math.round(s.duracaoMin), precoCentavos: Math.round(s.precoCentavos), descricao, emDomicilio: s.emDomicilio ? 1 : 0, adicional: s.adicional ? 1 : 0 };
}

export class BancoAgenda {
  readonly db: DatabaseSync;

  constructor(caminho = caminhoPadrao(), readonly plano: Plano = planoDoAmbiente()) {
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
      -- Link de troca de senha (o admin gera e manda pelo WhatsApp): uso único, só o hash fica aqui.
      CREATE TABLE IF NOT EXISTS trocas_senha (
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
      CREATE TABLE IF NOT EXISTS pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        txid TEXT NOT NULL UNIQUE, valor_centavos INTEGER NOT NULL, dias INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'aberto', pagador TEXT,
        criado_em TEXT NOT NULL, decidido_em TEXT
      );
    `);
    // Migrações: colunas que chegaram depois. Banco antigo ganha a coluna com valor padrão.
    this.garantirColuna("barbearias", "acesso_ate", "TEXT NOT NULL DEFAULT '1970-01-01'");
    this.garantirColuna("barbearias", "tema", `TEXT NOT NULL DEFAULT '${TEMA_PADRAO}'`);
    for (const c of ["bio", "cidade", "instagram", "oferta"]) this.garantirColuna("barbearias", c, "TEXT");
    this.garantirColuna("barbearias", "desde", "INTEGER");
    this.garantirColuna("barbearias", "mostrar_precos", "INTEGER NOT NULL DEFAULT 1");
    this.garantirColuna("barbearias", "intervalo_min", "INTEGER NOT NULL DEFAULT 30");
    this.garantirColuna("barbearias", "folga_min", "INTEGER NOT NULL DEFAULT 0");
    this.garantirColuna("barbearias", "atendimento", "TEXT NOT NULL DEFAULT 'agenda'");
    for (const c of ["fechado_em", "fila_atualizada_em"]) this.garantirColuna("barbearias", c, "TEXT");
    this.garantirColuna("barbearias", "fila_pessoas", "INTEGER");
    for (const c of ["demo_ate", "demo_token_hash", "demo_lead"]) this.garantirColuna("barbearias", c, "TEXT");
    this.garantirColuna("barbearias", "link_avaliacao", "TEXT");
    this.garantirColuna("barbearias", "montagem", "INTEGER NOT NULL DEFAULT 0");
    this.garantirColuna("barbearias", "suspensa", "INTEGER NOT NULL DEFAULT 0");
    this.garantirColuna("pagamentos", "comprovante", "TEXT");
    this.garantirColuna("servicos", "descricao", "TEXT");
    this.garantirColuna("servicos", "em_domicilio", "INTEGER NOT NULL DEFAULT 0");
    this.migrarAdicionais();
    this.garantirColuna("agendamentos", "endereco_cliente", "TEXT");
    this.garantirColuna("barbearias", "retorno_dias", `INTEGER NOT NULL DEFAULT ${RETORNO_PADRAO_DIAS}`);
    for (const c of ["lembrete_em", "avaliacao_em", "referencia_foto"]) this.garantirColuna("agendamentos", c, "TEXT");
    this.garantirColuna("profissionais", "especialidade", "TEXT");
    this.garantirColuna("profissionais", "foto_arquivo", "TEXT");
    this.garantirColuna("profissionais", "parte_pct", "INTEGER");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        arquivo TEXT NOT NULL, categoria TEXT NOT NULL, legenda TEXT,
        largura INTEGER NOT NULL, altura INTEGER NOT NULL, capa INTEGER NOT NULL DEFAULT 0,
        criado_em TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS fotos_barbearia ON fotos(barbearia_id, categoria);
    `);
    this.garantirColuna("fotos", "antes_de", "TEXT");
    this.migrarFotosCompartilhadas();
    this.db.exec("CREATE INDEX IF NOT EXISTS fotos_arquivo ON fotos(arquivo)");
    // Link do cliente: o banco guarda só o hash do token (como nas sessões).
    this.garantirColuna("agendamentos", "token_cliente", "TEXT");
    this.db.exec("CREATE INDEX IF NOT EXISTS agendamentos_token ON agendamentos(token_cliente)");
    // Link do calendário do barbeiro (assinado no celular): um da barbearia toda e um por profissional.
    this.garantirColuna("barbearias", "token_agenda", "TEXT");
    this.garantirColuna("profissionais", "token_agenda", "TEXT");
    this.db.exec(`
      -- Limites contra abuso (agendar em massa, chutar senha). Chave já vem com o tipo e um hash do IP/e-mail.
      CREATE TABLE IF NOT EXISTS tentativas (chave TEXT NOT NULL, em TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS tentativas_chave ON tentativas(chave, em);
      CREATE TABLE IF NOT EXISTS bloqueios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        profissional_id INTEGER REFERENCES profissionais(id),
        inicio TEXT NOT NULL, fim TEXT NOT NULL, motivo TEXT, criado_em TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS bloqueios_dia ON bloqueios(barbearia_id, inicio);
      -- Números que o barbeiro bloqueou (trote, quem marca e não vem).
      CREATE TABLE IF NOT EXISTS telefones_bloqueados (
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id), telefone TEXT NOT NULL, em TEXT NOT NULL,
        PRIMARY KEY (barbearia_id, telefone)
      );
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS avisos_inscricoes (
        endpoint TEXT PRIMARY KEY,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        p256dh TEXT NOT NULL, auth TEXT NOT NULL, criado_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS configuracoes (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
      -- Plano mensal do cliente (ex.: 2 cortes por mês). Cobrança é com o barbeiro; aqui só o controle.
      CREATE TABLE IF NOT EXISTS planos_clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id),
        telefone TEXT NOT NULL, nome TEXT NOT NULL, usos_por_mes INTEGER NOT NULL, valor_centavos INTEGER NOT NULL,
        valido_ate TEXT NOT NULL, criado_em TEXT NOT NULL,
        UNIQUE (barbearia_id, telefone)
      );
      -- Quando o barbeiro chamou de volta um cliente que sumiu (pra não insistir).
      CREATE TABLE IF NOT EXISTS chamadas_retorno (
        barbearia_id INTEGER NOT NULL REFERENCES barbearias(id), telefone TEXT NOT NULL, em TEXT NOT NULL,
        PRIMARY KEY (barbearia_id, telefone)
      );
    `);
  }

  /**
   * Adicionais (barba, sobrancelha). Na primeira vez: barba e sobrancelha que já existem viram
   * adicional, e quem não tem sobrancelha ganha uma (o barbeiro muda tempo e preço no painel).
   * Snapshot no horário: ids, nomes, minutos e preço, pra mudança futura não reescrever o passado.
   */
  private migrarAdicionais(): void {
    const colunas = this.db.prepare("PRAGMA table_info(servicos)").all() as { name: string }[];
    const nova = !colunas.some((c) => c.name === "adicional");
    this.garantirColuna("servicos", "adicional", "INTEGER NOT NULL DEFAULT 0");
    this.garantirColuna("agendamentos", "adicionais_ids", "TEXT");
    this.garantirColuna("agendamentos", "adicionais_nomes", "TEXT");
    this.garantirColuna("agendamentos", "adicionais_min", "INTEGER NOT NULL DEFAULT 0");
    this.garantirColuna("agendamentos", "adicionais_centavos", "INTEGER NOT NULL DEFAULT 0");
    if (!nova) return;
    this.db.exec("UPDATE servicos SET adicional = 1 WHERE lower(nome) IN ('barba', 'sobrancelha', 'sobrancelhas')");
    const semSobrancelha = this.db.prepare(`SELECT id FROM barbearias b WHERE NOT EXISTS
      (SELECT 1 FROM servicos s WHERE s.barbearia_id = b.id AND lower(s.nome) LIKE '%sobrancelha%')`).all() as { id: number }[];
    for (const { id } of semSobrancelha) this.semearSobrancelha(id);
  }

  private semearSobrancelha(barbeariaId: number): void {
    this.db.prepare("INSERT INTO servicos (barbearia_id, nome, duracao_min, preco_centavos, adicional, descricao) VALUES (?, 'Sobrancelha', 10, 1500, 1, ?)")
      .run(barbeariaId, "Acerto na navalha ou na pinça");
  }

  private garantirColuna(tabela: string, coluna: string, definicao: string): void {
    const colunas = this.db.prepare(`PRAGMA table_info(${tabela})`).all() as { name: string }[];
    if (!colunas.some((c) => c.name === coluna)) this.db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }

  // ---------- conta ----------

  private validarConta(dados: { email: string; senha: string }): string {
    const email = dados.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErroAgenda("E-mail inválido.");
    if (dados.senha.length < 8) throw new ErroAgenda("A senha precisa ter pelo menos 8 caracteres.");
    if (this.db.prepare("SELECT 1 FROM usuarios WHERE email = ?").get(email)) throw new ErroAgenda("Já existe conta com esse e-mail.");
    return email;
  }

  private slugLivre(nome: string): string {
    let slug = gerarSlug(nome);
    for (let n = 2; this.db.prepare("SELECT 1 FROM barbearias WHERE slug = ?").get(slug); n++) slug = `${gerarSlug(nome)}-${n}`;
    return slug;
  }

  /** Ponto de partida pra barbearia já sair usando: dá pra editar tudo no painel. */
  /**
   * Bancos antigos criaram `fotos.arquivo` como UNIQUE; a prévia montada pelo barbeiro divide o
   * arquivo de exemplo entre sites (`copiarFotos`). O SQLite não tira restrição: refaz a tabela.
   */
  private migrarFotosCompartilhadas(): void {
    const { sql } = this.db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'fotos'").get() as { sql: string };
    if (!/arquivo TEXT NOT NULL UNIQUE/.test(sql)) return;
    this.db.exec("BEGIN");
    try {
      this.db.exec("ALTER TABLE fotos RENAME TO fotos_antiga");
      this.db.exec(sql.replace("arquivo TEXT NOT NULL UNIQUE", "arquivo TEXT NOT NULL"));
      this.db.exec("INSERT INTO fotos SELECT * FROM fotos_antiga; DROP TABLE fotos_antiga;");
      this.db.exec("CREATE INDEX IF NOT EXISTS fotos_barbearia ON fotos(barbearia_id, categoria)");
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  private semearBarbearia(barbeariaId: number, profissional: string): void {
    this.db.prepare("INSERT INTO profissionais (barbearia_id, nome) VALUES (?, ?)").run(barbeariaId, profissional);
    for (const [nome, dur, preco, adicional] of [["Corte", 30, 4000, 0], ["Barba", 30, 3000, 1], ["Corte + barba", 60, 6500, 0]] as const) {
      this.db.prepare("INSERT INTO servicos (barbearia_id, nome, duracao_min, preco_centavos, adicional) VALUES (?, ?, ?, ?, ?)").run(barbeariaId, nome, dur, preco, adicional);
    }
    this.semearSobrancelha(barbeariaId);
    for (let dia = 2; dia <= 6; dia++) {
      this.db.prepare("INSERT INTO expedientes (barbearia_id, dia_semana, abre, fecha, pausa_inicio, pausa_fim) VALUES (?, ?, '09:00', '19:00', '12:00', '13:00')").run(barbeariaId, dia);
    }
  }

  /**
   * Conta nova: com teste grátis de N dias, já nasce publicada até o fim do teste (contando hoje).
   * Sem teste, nasce em montagem: MONTAGEM_DIAS pra arrumar o site no painel, que só o dono vê.
   */
  private acessoInicial(agora?: Date): { acessoAte: Data; montagem: number } {
    const hoje = agoraNoFuso("America/Sao_Paulo", agora).slice(0, 10);
    return this.plano.testeDias > 0
      ? { acessoAte: somarDias(hoje, this.plano.testeDias - 1), montagem: 0 }
      : { acessoAte: somarDias(hoje, MONTAGEM_DIAS - 1), montagem: 1 };
  }

  criarConta(dados: { nomeBarbearia: string; telefone: string; nome: string; email: string; senha: string; agora?: Date }): { barbearia: Barbearia; token: string } {
    const email = this.validarConta(dados);
    const agora = new Date().toISOString();
    const slug = this.slugLivre(dados.nomeBarbearia);
    const inicial = this.acessoInicial(dados.agora);
    this.db.exec("BEGIN");
    try {
      const b = this.db.prepare("INSERT INTO barbearias (slug, nome, telefone, criado_em, acesso_ate, montagem) VALUES (?, ?, ?, ?, ?, ?)")
        .run(slug, dados.nomeBarbearia.trim(), dados.telefone, agora, inicial.acessoAte, inicial.montagem);
      const barbeariaId = Number(b.lastInsertRowid);
      const u = this.db.prepare("INSERT INTO usuarios (barbearia_id, nome, email, senha_hash, criado_em) VALUES (?, ?, ?, ?, ?)")
        .run(barbeariaId, dados.nome.trim(), email, hashSenha(dados.senha), agora);
      this.semearBarbearia(barbeariaId, dados.nome.trim());
      this.db.exec("COMMIT");
      return { barbearia: this.barbeariaPorId(barbeariaId)!, token: this.criarSessao(Number(u.lastInsertRowid)) };
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  /**
   * Pedido do site de leads: só barbearia, WhatsApp e nome, sem e-mail nem senha antes do Pix.
   * A conta nasce com um e-mail de marcação (`semEmail`) e uma senha aleatória; quem fez o pedido
   * segue logado pela sessão. Se perder a sessão, o admin manda o link de nova senha e ele entra
   * com o WhatsApp e essa senha (`entrar`).
   */
  criarPedido(dados: { nomeBarbearia: string; telefone: string; nome: string; agora?: Date }): { barbearia: Barbearia; token: string } {
    if (dados.nomeBarbearia.trim().length < 2) throw new ErroAgenda("Diga o nome da barbearia.");
    if (dados.nome.trim().length < 2) throw new ErroAgenda("Diga o seu nome.");
    return this.criarConta({ ...dados, email: `pedido-${randomBytes(6).toString("hex")}${SEM_EMAIL}`, senha: randomBytes(24).toString("base64url") });
  }

  // ---------- demonstração (site de exemplo pra mostrar a um barbeiro) ----------

  /**
   * Monta um site de exemplo com o nome da barbearia do lead. Não tem dono nem login; fica
   * no ar por `dias` e não aceita agendamento. Devolve o convite (segredo): com ele o barbeiro
   * transforma a demonstração no site dele (`assumirDemonstracao`). O banco guarda só o hash.
   */
  criarDemonstracao(dados: { nome: string; tema: string; cidade?: string; lead?: string; dias?: number; agora?: Date }): { barbearia: Barbearia; convite: string } {
    const nome = dados.nome.trim();
    if (nome.length < 2) throw new ErroAgenda("Diga o nome da barbearia.");
    if (!temaValido(dados.tema)) throw new ErroAgenda("Estilo inválido.");
    const ate = somarDias(agoraNoFuso("America/Sao_Paulo", dados.agora).slice(0, 10), (dados.dias ?? DEMONSTRACAO_DIAS) - 1);
    const { token, hash } = novoToken();
    const cidade = dados.cidade?.trim() || undefined;
    this.db.exec("BEGIN");
    try {
      const b = this.db.prepare(`INSERT INTO barbearias (slug, nome, telefone, criado_em, acesso_ate, tema, cidade, bio, demo_ate, demo_token_hash, demo_lead)
        VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?)`).run(this.slugLivre(nome), nome, new Date().toISOString(), ate, dados.tema, cidade ?? null,
        `Corte, barba e atendimento caprichado${cidade ? ` em ${cidade}` : ""}. Escolha o horário e marque aqui mesmo.`, ate, hash, dados.lead ?? null);
      const id = Number(b.lastInsertRowid);
      this.semearBarbearia(id, "Barbeiro");
      this.db.exec("COMMIT");
      return { barbearia: this.barbeariaPorId(id)!, convite: token };
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  /** Demonstração ainda no ar e ainda sem dono, pelo convite. */
  demonstracaoPorConvite(convite: string | undefined, agora?: Date): Barbearia | undefined {
    if (!convite) return undefined;
    const b = paraBarbearia(this.db.prepare(`SELECT ${COLUNAS_BARBEARIA} FROM barbearias WHERE demo_token_hash = ? AND demo_ate IS NOT NULL`)
      .get(hashToken(convite)) as Record<string, unknown> | undefined);
    return b && this.acessoAtivo(b, agora) ? b : undefined;
  }

  /**
   * O barbeiro gostou e quer o site: a demonstração vira a barbearia dele, com o mesmo endereço
   * (/b/<slug>), estilo e fotos de exemplo (que ele troca pelas dele). O acesso segue o plano
   * como uma conta nova: sem período grátis, entra em montagem e publica com o Pix confirmado.
   */
  assumirDemonstracao(convite: string, dados: { telefone: string; nome: string; email: string; senha: string; nomeBarbearia?: string; agora?: Date }): { barbearia: Barbearia; token: string } {
    const demo = this.demonstracaoPorConvite(convite, dados.agora);
    if (!demo) throw new ErroAgenda("Esse convite de demonstração venceu ou já foi usado.");
    const email = this.validarConta(dados);
    const inicial = this.acessoInicial(dados.agora);
    this.db.exec("BEGIN");
    try {
      this.db.prepare(`UPDATE barbearias SET nome = ?, telefone = ?, acesso_ate = ?, montagem = ?, demo_ate = NULL, demo_token_hash = NULL WHERE id = ?`)
        .run(dados.nomeBarbearia?.trim() || demo.nome, dados.telefone, inicial.acessoAte, inicial.montagem, demo.id);
      const u = this.db.prepare("INSERT INTO usuarios (barbearia_id, nome, email, senha_hash, criado_em) VALUES (?, ?, ?, ?, ?)")
        .run(demo.id, dados.nome.trim(), email, hashSenha(dados.senha), new Date().toISOString());
      this.db.prepare("UPDATE profissionais SET nome = ? WHERE barbearia_id = ? AND nome = 'Barbeiro'").run(dados.nome.trim(), demo.id);
      this.db.exec("COMMIT");
      return { barbearia: this.barbeariaPorId(demo.id)!, token: this.criarSessao(Number(u.lastInsertRowid)) };
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  // ---------- conta criada pelo admin (vendida no site de leads) ----------

  /**
   * O cliente comprou no site de leads e o admin conferiu o Pix lá: o admin cria aqui a barbearia
   * dele, já no ar por `dias` a partir de hoje, e manda o link e a senha no WhatsApp.
   */
  criarContaPeloAdmin(dados: {
    nomeBarbearia: string; telefone: string; tema: string; cidade?: string;
    nome: string; email: string; senha: string; dias: number; agora?: Date;
  }): Barbearia {
    const email = this.validarConta(dados);
    if (!temaValido(dados.tema)) throw new ErroAgenda("Estilo inválido.");
    if (!Number.isInteger(dados.dias) || dados.dias < 1 || dados.dias > 400) throw new ErroAgenda("Dias inválidos.");
    const nomeBarbearia = dados.nomeBarbearia.trim().slice(0, 80);
    if (nomeBarbearia.length < 2) throw new ErroAgenda("Diga o nome da barbearia.");
    const hoje = agoraNoFuso("America/Sao_Paulo", dados.agora).slice(0, 10);
    const cidade = dados.cidade?.trim().slice(0, 60) || undefined;
    const nome = dados.nome.trim().slice(0, 80) || "Barbeiro";
    const agora = new Date().toISOString();
    this.db.exec("BEGIN");
    try {
      const b = this.db.prepare(`INSERT INTO barbearias (slug, nome, telefone, criado_em, acesso_ate, montagem, tema, cidade, bio)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`).run(this.slugLivre(nomeBarbearia), nomeBarbearia, dados.telefone, agora,
        somarDias(hoje, dados.dias - 1), dados.tema, cidade ?? null,
        `Corte, barba e atendimento caprichado${cidade ? ` em ${cidade}` : ""}. Escolha o horário e marque aqui mesmo.`);
      const id = Number(b.lastInsertRowid);
      this.db.prepare("INSERT INTO usuarios (barbearia_id, nome, email, senha_hash, criado_em) VALUES (?, ?, ?, ?, ?)")
        .run(id, nome, email, hashSenha(dados.senha), agora);
      this.semearBarbearia(id, nome);
      this.db.exec("COMMIT");
      return this.barbeariaPorId(id)!;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  /** Entra com o e-mail ou, sem "@", com o WhatsApp da barbearia (pedido feito sem e-mail). */
  entrar(acesso: string, senha: string): string {
    if (!acesso.includes("@")) {
      const digitos = acesso.replace(/\D/g, "");
      const telefone = digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;
      const contas = (telefone.length >= 12 ? this.db.prepare(`SELECT u.id, u.senha_hash FROM usuarios u JOIN barbearias b ON b.id = u.barbearia_id
        WHERE b.telefone = ? ORDER BY u.id DESC`).all(telefone) : []) as { id: number; senha_hash: string }[];
      const u = contas.find((c) => conferirSenha(senha, c.senha_hash));
      if (!u) throw new ErroAgenda("WhatsApp ou senha incorretos.");
      return this.criarSessao(u.id);
    }
    const u = this.db.prepare("SELECT id, senha_hash FROM usuarios WHERE email = ?").get(acesso.trim().toLowerCase()) as
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

  /**
   * App de um barbeiro só (SaaS): a página de admin entra só com a senha do .env (quem confere é
   * o site) e abre a sessão do dono da barbearia.
   */
  sessaoDoDono(barbeariaId: number): string {
    const u = this.db.prepare("SELECT id FROM usuarios WHERE barbearia_id = ? ORDER BY id LIMIT 1").get(barbeariaId) as { id: number } | undefined;
    if (!u) throw new ErroAgenda("Barbearia sem conta de acesso.");
    return this.criarSessao(u.id);
  }

  /** Derruba todas as sessões abertas da barbearia (a senha do admin mudou). */
  encerrarSessoes(barbeariaId: number): void {
    this.db.prepare("DELETE FROM sessoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE barbearia_id = ?)").run(barbeariaId);
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

  // ---------- senha: trocar no painel ou por link que o admin manda ----------

  /** Usuários (barbeiros) de uma barbearia, pro admin escolher de quem é o link. */
  usuariosDaBarbearia(barbeariaId: number): Usuario[] {
    return this.db.prepare("SELECT id, barbearia_id AS barbeariaId, nome, email FROM usuarios WHERE barbearia_id = ? ORDER BY id")
      .all(barbeariaId) as unknown as Usuario[];
  }

  /**
   * Link de troca de senha, pro barbeiro que esqueceu. O admin manda pelo WhatsApp dele.
   * Vale LINK_SENHA_HORAS, uma vez só; gerar outro invalida o anterior.
   */
  criarLinkDeSenha(usuarioId: number, agora = new Date()): string {
    if (!this.db.prepare("SELECT 1 FROM usuarios WHERE id = ?").get(usuarioId)) throw new ErroAgenda("Usuário não encontrado.");
    const { token, hash } = novoToken();
    this.db.prepare("DELETE FROM trocas_senha WHERE usuario_id = ?").run(usuarioId);
    this.db.prepare("INSERT INTO trocas_senha (token_hash, usuario_id, expira_em) VALUES (?, ?, ?)")
      .run(hash, usuarioId, new Date(agora.getTime() + LINK_SENHA_HORAS * 3_600_000).toISOString());
    return token;
  }

  /** De quem é o link (sem gastar o link): pra página mostrar "Nova senha pra fulano". */
  usuarioDoLinkDeSenha(token: string, agora = new Date()): Usuario | undefined {
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return undefined;
    return this.db.prepare(`SELECT u.id, u.barbearia_id AS barbeariaId, u.nome, u.email FROM trocas_senha t
      JOIN usuarios u ON u.id = t.usuario_id WHERE t.token_hash = ? AND t.expira_em > ?`)
      .get(hashToken(token), agora.toISOString()) as Usuario | undefined;
  }

  /** Troca a senha pelo link, gasta o link, derruba as sessões abertas e já entra. Devolve a sessão nova. */
  trocarSenhaComLink(token: string, novaSenha: string, agora = new Date()): string {
    const u = this.usuarioDoLinkDeSenha(token, agora);
    if (!u) throw new ErroAgenda("Esse link venceu ou já foi usado. Peça outro.");
    this.gravarSenha(u.id, novaSenha);
    this.db.prepare("DELETE FROM trocas_senha WHERE usuario_id = ?").run(u.id);
    return this.criarSessao(u.id);
  }

  /** Troca no painel, sabendo a senha atual. Derruba as outras sessões e devolve uma nova pra este aparelho. */
  trocarSenha(usuarioId: number, atual: string, nova: string): string {
    const u = this.db.prepare("SELECT senha_hash FROM usuarios WHERE id = ?").get(usuarioId) as { senha_hash: string } | undefined;
    if (!u || !conferirSenha(atual, u.senha_hash)) throw new ErroAgenda("A senha atual não confere.");
    this.gravarSenha(usuarioId, nova);
    return this.criarSessao(usuarioId);
  }

  private gravarSenha(usuarioId: number, nova: string): void {
    if (nova.length < 8) throw new ErroAgenda("A senha precisa ter pelo menos 8 caracteres.");
    this.db.prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?").run(hashSenha(nova), usuarioId);
    // Quem estava logado com a senha antiga (inclusive alguém que não devia) sai.
    this.db.prepare("DELETE FROM sessoes WHERE usuario_id = ?").run(usuarioId);
  }

  // ---------- barbearia ----------

  barbeariaPorId(id: number): Barbearia | undefined {
    return paraBarbearia(this.db.prepare(`SELECT ${COLUNAS_BARBEARIA} FROM barbearias WHERE id = ?`).get(id) as Record<string, unknown> | undefined);
  }

  barbeariaPorSlug(slug: string): Barbearia | undefined {
    return paraBarbearia(this.db.prepare(`SELECT ${COLUNAS_BARBEARIA} FROM barbearias WHERE slug = ?`).get(slug) as Record<string, unknown> | undefined);
  }

  atualizarBarbearia(id: number, dados: { nome: string; telefone: string; endereco?: string }): void {
    this.db.prepare("UPDATE barbearias SET nome = ?, telefone = ?, endereco = ? WHERE id = ?")
      .run(dados.nome.trim(), dados.telefone, dados.endereco?.trim() || null, id);
  }

  /** Dados do site público (tema e textos). O resto (nome, telefone, endereço) fica em atualizarBarbearia. */
  atualizarSite(id: number, dados: { tema: string; bio?: string; cidade?: string; instagram?: string; oferta?: string; desde?: number | null }): void {
    if (!temaValido(dados.tema)) throw new ErroAgenda("Tema inválido.");
    const anoAtual = new Date().getFullYear();
    if (dados.desde != null && !(Number.isInteger(dados.desde) && dados.desde >= 1900 && dados.desde <= anoAtual)) {
      throw new ErroAgenda(`Ano de abertura entre 1900 e ${anoAtual}.`);
    }
    const limpar = (v: string | undefined, max: number) => v?.trim().slice(0, max) || null;
    const insta = dados.instagram?.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
    if (insta && !/^[A-Za-z0-9._]{1,30}$/.test(insta)) throw new ErroAgenda("Instagram inválido. Use só o @ do perfil.");
    this.db.prepare("UPDATE barbearias SET tema = ?, bio = ?, cidade = ?, instagram = ?, oferta = ?, desde = ? WHERE id = ?")
      .run(dados.tema, limpar(dados.bio, 400), limpar(dados.cidade, 60), insta || null, limpar(dados.oferta, 80), dados.desde ?? null, id);
  }

  profissionais(barbeariaId: number, soAtivos = false): Profissional[] {
    return (this.db.prepare(`SELECT id, nome, ativo, especialidade, foto_arquivo AS fotoArquivo, parte_pct AS partePct FROM profissionais
      WHERE barbearia_id = ? ${soAtivos ? "AND ativo = 1" : ""} ORDER BY id`)
      .all(barbeariaId) as unknown as Profissional[]).map((p) => ({ ...p, partePct: p.partePct ?? undefined }));
  }

  atualizarProfissional(barbeariaId: number, id: number, dados: { nome?: string; especialidade?: string; fotoArquivo?: string | null; partePct?: number | null }): void {
    if (dados.fotoArquivo && !this.fotoDaBarbearia(barbeariaId, dados.fotoArquivo)) throw new ErroAgenda("Foto inválida.");
    if (dados.partePct !== undefined) {
      if (dados.partePct !== null && !(Number.isInteger(dados.partePct) && dados.partePct >= 0 && dados.partePct <= 100)) {
        throw new ErroAgenda("A parte do profissional vai de 0 a 100%.");
      }
      this.db.prepare("UPDATE profissionais SET parte_pct = ? WHERE id = ? AND barbearia_id = ?").run(dados.partePct, id, barbeariaId);
    }
    if (dados.nome !== undefined) {
      this.db.prepare("UPDATE profissionais SET nome = ? WHERE id = ? AND barbearia_id = ?").run(nomeValido(dados.nome, "o nome do profissional"), id, barbeariaId);
    }
    this.db.prepare(`UPDATE profissionais SET especialidade = COALESCE(?, especialidade),
        foto_arquivo = CASE WHEN ? THEN ? ELSE foto_arquivo END WHERE id = ? AND barbearia_id = ?`)
      .run(dados.especialidade?.trim().slice(0, 60) ?? null, dados.fotoArquivo !== undefined ? 1 : 0, dados.fotoArquivo ?? null, id, barbeariaId);
  }

  adicionarProfissional(barbeariaId: number, nome: string): void {
    this.db.prepare("INSERT INTO profissionais (barbearia_id, nome) VALUES (?, ?)").run(barbeariaId, nomeValido(nome, "o nome do profissional"));
  }

  alternarProfissional(barbeariaId: number, id: number): void {
    this.db.prepare("UPDATE profissionais SET ativo = 1 - ativo WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
  }

  servicos(barbeariaId: number, soAtivos = false): Servico[] {
    return (this.db.prepare(`SELECT id, nome, duracao_min AS duracaoMin, preco_centavos AS precoCentavos, ativo, descricao, em_domicilio AS emDomicilio, adicional
      FROM servicos WHERE barbearia_id = ? ${soAtivos ? "AND ativo = 1" : ""} ORDER BY id`).all(barbeariaId) as unknown as (Omit<Servico, "emDomicilio" | "adicional"> & { emDomicilio: number; adicional: number })[])
      .map((x) => ({ ...x, descricao: x.descricao ?? undefined, emDomicilio: x.emDomicilio === 1, adicional: x.adicional === 1 }));
  }

  /** Adicionais que dá pra somar a um serviço: ativos, marcados como adicional, nem ele mesmo nem algo que o nome já inclui. */
  adicionaisPara(barbeariaId: number, servicoId: number): Servico[] {
    const todos = this.servicos(barbeariaId, true);
    const principal = todos.find((s) => s.id === servicoId);
    if (!principal) return [];
    const nome = semAcento(principal.nome);
    // Corte de criança: nada de barba, química ou cor; só acabamento (pezinho, sobrancelha, risco, hidratação).
    const infantil = /infantil|crianca|kids/.test(nome);
    return todos.filter((s) => s.adicional && s.id !== servicoId && !nome.includes(semAcento(s.nome)) &&
      (!infantil || /sobrancelha|pezinho|risco|hidrata/.test(semAcento(s.nome))));
  }

  /** Valida os adicionais escolhidos (sem repetir) e devolve na ordem do cardápio. */
  resolverAdicionais(barbeariaId: number, servicoId: number, ids: number[]): Servico[] {
    const unicos = new Set(ids);
    if (unicos.size > MAX_ADICIONAIS) throw new ErroAgenda(`Escolha até ${MAX_ADICIONAIS} adicionais.`);
    const possiveis = this.adicionaisPara(barbeariaId, servicoId);
    if ([...unicos].some((id) => !possiveis.some((s) => s.id === id))) throw new ErroAgenda("Adicional indisponível.");
    return possiveis.filter((s) => unicos.has(s.id));
  }

  adicionarServico(barbeariaId: number, s: DadosServico): void {
    const v = servicoValido(s);
    this.db.prepare("INSERT INTO servicos (barbearia_id, nome, duracao_min, preco_centavos, descricao, em_domicilio, adicional) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(barbeariaId, v.nome, v.duracaoMin, v.precoCentavos, v.descricao, v.emDomicilio, v.adicional);
  }

  /**
   * Muda nome, duração e preço. Se a duração mudou, os horários futuros desse serviço
   * passam a terminar no novo tempo (a agenda e o calendário do barbeiro já mostram assim).
   * Devolve os horários que, com o tempo novo, encostam no cliente seguinte, pro barbeiro decidir.
   */
  atualizarServico(barbeariaId: number, id: number, s: DadosServico, agora?: Date): { ajustados: number; conflitos: Agendamento[] } {
    const v = servicoValido(s);
    const b = this.barbeariaPorId(barbeariaId);
    this.db.prepare("UPDATE servicos SET nome = ?, duracao_min = ?, preco_centavos = ?, descricao = ?, em_domicilio = ?, adicional = ? WHERE id = ? AND barbearia_id = ?")
      .run(v.nome, v.duracaoMin, v.precoCentavos, v.descricao, v.emDomicilio, v.adicional, id, barbeariaId);
    if (!b) return { ajustados: 0, conflitos: [] };
    const futuros = this.db.prepare(`SELECT id, inicio, fim, profissional_id AS profissionalId, adicionais_min AS extra FROM agendamentos
      WHERE barbearia_id = ? AND servico_id = ? AND status = 'confirmado' AND inicio > ?`)
      .all(barbeariaId, id, agoraNoFuso(b.fuso, agora)) as { id: number; inicio: string; fim: string; profissionalId: number; extra: number }[];
    const mudar = this.db.prepare("UPDATE agendamentos SET fim = ? WHERE id = ? AND barbearia_id = ?");
    const conflitos: Agendamento[] = [];
    let ajustados = 0;
    for (const a of futuros) {
      const fim = `${a.inicio.slice(0, 10)}T${deMinutos(paraMinutos(a.inicio.slice(11)) + v.duracaoMin + a.extra)}`;
      if (fim === a.fim) continue;
      mudar.run(fim, a.id, barbeariaId);
      ajustados++;
      const encosta = this.db.prepare(`SELECT 1 FROM agendamentos WHERE barbearia_id = ? AND profissional_id = ? AND status = 'confirmado'
        AND id <> ? AND inicio < ? AND fim > ?`).get(barbeariaId, a.profissionalId, a.id, fim, a.inicio);
      const ag = encosta && this.agendamento(barbeariaId, a.id);
      if (ag) conflitos.push(ag);
    }
    return { ajustados, conflitos };
  }

  // ---------- funcionamento: preços, intervalo, atendimento, fila, fechar hoje ----------

  atualizarFuncionamento(id: number, dados: { mostrarPrecos: boolean; intervaloMin: number; atendimento: string; folgaMin?: number }): void {
    if (!(INTERVALOS as readonly number[]).includes(dados.intervaloMin)) throw new ErroAgenda("Intervalo inválido.");
    if (!["agenda", "chegada", "ambos"].includes(dados.atendimento)) throw new ErroAgenda("Forma de atendimento inválida.");
    const folga = dados.folgaMin ?? this.barbeariaPorId(id)?.folgaMin ?? 0;
    if (!(FOLGAS as readonly number[]).includes(folga)) throw new ErroAgenda("Folga entre clientes inválida.");
    this.db.prepare("UPDATE barbearias SET mostrar_precos = ?, intervalo_min = ?, atendimento = ?, folga_min = ? WHERE id = ?")
      .run(dados.mostrarPrecos ? 1 : 0, dados.intervaloMin, dados.atendimento, folga, id);
  }

  /** Fecha (ou reabre) a barbearia hoje: o site mostra "Fechado hoje" e não oferece horários do dia. */
  fecharHoje(id: number, fechar: boolean, agora?: Date): void {
    const b = this.barbeariaPorId(id);
    if (!b) return;
    this.db.prepare("UPDATE barbearias SET fechado_em = ? WHERE id = ?").run(fechar ? agoraNoFuso(b.fuso, agora).slice(0, 10) : null, id);
  }

  fechadoHoje(b: Barbearia, agora?: Date): boolean {
    return !!b.fechadoEm && b.fechadoEm === agoraNoFuso(b.fuso, agora).slice(0, 10);
  }

  definirFila(id: number, pessoas: number, agora = new Date()): void {
    if (!Number.isInteger(pessoas) || pessoas < 0 || pessoas > 50) throw new ErroAgenda("Fila entre 0 e 50 pessoas.");
    this.db.prepare("UPDATE barbearias SET fila_pessoas = ?, fila_atualizada_em = ? WHERE id = ?").run(pessoas, agora.toISOString(), id);
  }

  /** Fila pro site: só se foi informada há pouco (FILA_VALIDA_MIN). Espera estimada pela média dos serviços e pela equipe. */
  filaAgora(b: Barbearia, agora = new Date()): { pessoas: number; esperaMin: number; haMin: number } | undefined {
    if (b.atendimento === "agenda" || b.filaPessoas === undefined || !b.filaAtualizadaEm) return undefined;
    const haMin = Math.floor((agora.getTime() - new Date(b.filaAtualizadaEm).getTime()) / 60_000);
    if (haMin < 0 || haMin > FILA_VALIDA_MIN) return undefined;
    const servicos = this.servicos(b.id, true);
    const media = servicos.length ? servicos.reduce((t, s) => t + s.duracaoMin, 0) / servicos.length : 30;
    const cadeiras = Math.max(1, this.profissionais(b.id, true).length);
    return { pessoas: b.filaPessoas, esperaMin: Math.round((b.filaPessoas * media) / cadeiras / 5) * 5, haMin };
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
    const linhas = this.db.prepare(`SELECT a.id, a.servico_id AS servicoId, s.nome || COALESCE(' + ' || a.adicionais_nomes, '') AS servico, a.profissional_id AS profissionalId,
        p.nome AS profissional, a.cliente_nome AS clienteNome, a.cliente_telefone AS clienteTelefone,
        a.inicio, a.fim, a.status, a.lembrete_em AS lembreteEm, a.avaliacao_em AS avaliacaoEm, a.referencia_foto AS referenciaFoto,
        a.endereco_cliente AS enderecoCliente
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id JOIN profissionais p ON p.id = a.profissional_id
      WHERE a.barbearia_id = ? AND a.inicio LIKE ? ${profissionalId ? "AND a.profissional_id = ?" : ""}
      ORDER BY a.inicio`)
      .all(barbeariaId, `${data}%`, ...(profissionalId ? [profissionalId] : [])) as unknown as Agendamento[];
    return linhas.map((a) => ({ ...a, lembreteEm: a.lembreteEm ?? undefined, avaliacaoEm: a.avaliacaoEm ?? undefined, referenciaFoto: a.referenciaFoto ?? undefined, enderecoCliente: a.enderecoCliente ?? undefined }));
  }

  /**
   * `ignorarId`: ao remarcar, o horário antigo do próprio cliente não conta como ocupado.
   * `extra.adicionais`: ids dos adicionais (somam o tempo); `extra.duracaoMin`: tempo já fechado (remarcar).
   */
  horariosLivres(barbeariaId: number, profissionalId: number, servicoId: number, data: Data, agora?: Date, ignorarId?: number,
    extra: { adicionais?: number[]; duracaoMin?: number } = {}): string[] {
    const b = this.barbeariaPorId(barbeariaId);
    const servico = this.servicos(barbeariaId, true).find((s) => s.id === servicoId);
    if (!b || !servico || b.atendimento === "chegada") return [];
    const duracao = extra.duracaoMin
      ?? servico.duracaoMin + this.resolverAdicionais(barbeariaId, servicoId, extra.adicionais ?? []).reduce((t, a) => t + a.duracaoMin, 0);
    if (b.fechadoEm === data) return [];
    const ocupados = [
      ...this.agendamentosDoDia(barbeariaId, data, profissionalId).filter((a) => a.status === "confirmado" && a.id !== ignorarId),
      // Folgas: as da barbearia toda e as deste profissional.
      ...this.bloqueiosDoDia(barbeariaId, data)
        .filter((x) => x.profissionalId === undefined || x.profissionalId === profissionalId)
        .map((x) => ({ ...x, semFolga: true })),
    ];
    return horariosLivres({
      data,
      expediente: this.expedientes(barbeariaId).get(diaDaSemana(data)),
      duracao,
      ocupados,
      agora: agoraNoFuso(b.fuso, agora),
      passo: b.intervaloMin,
      folga: b.folgaMin,
    });
  }

  /**
   * Marca um horário. Revalida a disponibilidade dentro da transação: dois
   * clientes clicando no mesmo horário ao mesmo tempo não viram encaixe duplo.
   */
  /**
   * `peloBarbeiro`: o próprio barbeiro marcando (logado no painel) não tem limite por número.
   * Pelo site, cada número pode ter até MAX_HORARIOS_POR_TELEFONE horários futuros, e número bloqueado não marca.
   */
  agendar(dados: {
    barbeariaId: number; profissionalId: number; servicoId: number; data: Data; hora: string;
    clienteNome: string; clienteTelefone: string; agora?: Date; peloBarbeiro?: boolean;
    /** Foto do portfólio da própria barbearia (categorias de trabalho, nunca equipe/ambiente/produtos). */
    referenciaFoto?: string;
    /** Obrigatório quando o serviço é em domicílio. */
    enderecoCliente?: string;
    /** Ids dos adicionais (barba, sobrancelha...): somam tempo e preço. */
    adicionais?: number[];
  }): number {
    const nome = dados.clienteNome.trim().replace(/\s+/g, " ");
    if (nome.length < 2) throw new ErroAgenda("Informe seu nome.");
    if (!/^\d{12,13}$/.test(dados.clienteTelefone)) throw new ErroAgenda("WhatsApp inválido.");
    if (!dados.peloBarbeiro) {
      if (this.telefoneBloqueado(dados.barbeariaId, dados.clienteTelefone)) {
        throw new ErroAgenda("Não foi possível agendar por aqui. Fale com a barbearia pelo WhatsApp.");
      }
      const b0 = this.barbeariaPorId(dados.barbeariaId);
      const agoraLocal = b0 ? agoraNoFuso(b0.fuso, dados.agora) : "";
      const futuros = (this.db.prepare(`SELECT COUNT(*) AS n FROM agendamentos
        WHERE barbearia_id = ? AND cliente_telefone = ? AND status = 'confirmado' AND inicio > ?`)
        .get(dados.barbeariaId, dados.clienteTelefone, agoraLocal) as { n: number }).n;
      if (futuros >= MAX_HORARIOS_POR_TELEFONE) {
        throw new ErroAgenda(`Esse número já tem ${futuros} horários marcados aqui. Pra marcar mais, fale com a barbearia.`);
      }
    }
    const b = this.barbeariaPorId(dados.barbeariaId);
    if (!b || !this.acessoAtivo(b, dados.agora)) throw new ErroAgenda("Agenda temporariamente indisponível.");
    if (b.demoAte) throw new ErroAgenda("Este site é uma demonstração: os horários são de exemplo e não dá pra marcar.");
    if (b.emMontagem && !dados.peloBarbeiro) throw new ErroAgenda("Este site ainda não foi publicado: a marcação abre quando ele for pro ar.");
    const prof = this.profissionais(dados.barbeariaId, true).find((p) => p.id === dados.profissionalId);
    const servico = this.servicos(dados.barbeariaId, true).find((s) => s.id === dados.servicoId);
    if (!prof || !servico) throw new ErroAgenda("Serviço ou profissional indisponível.");
    const referencia = dados.referenciaFoto ? this.fotoDaBarbearia(dados.barbeariaId, dados.referenciaFoto) : undefined;
    if (dados.referenciaFoto && (!referencia || !CATEGORIAS_REFERENCIA.includes(referencia.categoria))) throw new ErroAgenda("Foto de referência inválida.");
    const endereco = servico.emDomicilio ? dados.enderecoCliente?.trim().replace(/\s+/g, " ") ?? "" : "";
    if (servico.emDomicilio && (endereco.length < 8 || endereco.length > 200)) throw new ErroAgenda("Informe o endereço completo (rua, número e bairro).");
    const adicionais = this.resolverAdicionais(dados.barbeariaId, servico.id, dados.adicionais ?? []);
    const extraMin = adicionais.reduce((t, a) => t + a.duracaoMin, 0);

    this.db.exec("BEGIN IMMEDIATE");
    try {
      const livres = this.horariosLivres(dados.barbeariaId, dados.profissionalId, dados.servicoId, dados.data, dados.agora, undefined, { adicionais: adicionais.map((a) => a.id) });
      if (!livres.includes(dados.hora)) throw new ErroAgenda("Esse horário acabou de ser ocupado. Escolha outro.");
      const fim = deMinutos(paraMinutos(dados.hora) + servico.duracaoMin + extraMin);
      const r = this.db.prepare(`INSERT INTO agendamentos
          (barbearia_id, servico_id, profissional_id, cliente_nome, cliente_telefone, inicio, fim, criado_em, referencia_foto, endereco_cliente,
           adicionais_ids, adicionais_nomes, adicionais_min, adicionais_centavos)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(dados.barbeariaId, servico.id, prof.id, nome.slice(0, 80), dados.clienteTelefone,
          `${dados.data}T${dados.hora}`, `${dados.data}T${fim}`, new Date().toISOString(), referencia?.arquivo ?? null, endereco || null,
          adicionais.length ? adicionais.map((a) => a.id).join(",") : null,
          adicionais.length ? adicionais.map((a) => a.nome).join(" + ") : null,
          extraMin, adicionais.reduce((t, a) => t + a.precoCentavos, 0));
      this.db.exec("COMMIT");
      return Number(r.lastInsertRowid);
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  agendamento(barbeariaId: number, id: number): Agendamento | undefined {
    const a = this.db.prepare(`SELECT a.id, a.servico_id AS servicoId, s.nome || COALESCE(' + ' || a.adicionais_nomes, '') AS servico, a.profissional_id AS profissionalId,
        p.nome AS profissional, a.cliente_nome AS clienteNome, a.cliente_telefone AS clienteTelefone, a.inicio, a.fim, a.status,
        a.endereco_cliente AS enderecoCliente, a.adicionais_ids AS ids
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id JOIN profissionais p ON p.id = a.profissional_id
      WHERE a.barbearia_id = ? AND a.id = ?`).get(barbeariaId, id) as (Agendamento & { ids: string | null }) | undefined;
    if (!a) return undefined;
    const { ids, ...resto } = a;
    return { ...resto, enderecoCliente: a.enderecoCliente ?? undefined, adicionais: ids ? ids.split(",").map(Number) : [] };
  }

  cancelar(barbeariaId: number, id: number): void {
    this.db.prepare("UPDATE agendamentos SET status = 'cancelado' WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
  }


  // ---------- depois do atendimento: falta, retorno, lembrete, avaliação e números ----------

  /** Marca (ou desmarca) que o cliente não apareceu. Só depois da hora do horário. */
  marcarFalta(barbeariaId: number, id: number, faltou: boolean, agora?: Date): void {
    const a = this.agendamento(barbeariaId, id);
    const b = this.barbeariaPorId(barbeariaId);
    if (!a || !b) throw new ErroAgenda("Horário não encontrado.");
    if (a.inicio > agoraNoFuso(b.fuso, agora)) throw new ErroAgenda("Só dá pra marcar falta depois da hora do horário.");
    const [de, para] = faltou ? ["confirmado", "faltou"] : ["faltou", "confirmado"];
    this.db.prepare("UPDATE agendamentos SET status = ? WHERE id = ? AND barbearia_id = ? AND status = ?").run(para, id, barbeariaId, de);
  }

  /** Anota que o barbeiro abriu o lembrete da véspera ou o pedido de avaliação desse horário. */
  registrarContato(barbeariaId: number, id: number, tipo: "lembrete" | "avaliacao", agora = new Date()): void {
    const coluna = tipo === "lembrete" ? "lembrete_em" : "avaliacao_em";
    this.db.prepare(`UPDATE agendamentos SET ${coluna} = ? WHERE id = ? AND barbearia_id = ?`).run(agora.toISOString(), id, barbeariaId);
  }

  /** Configurações do pós-atendimento: link de avaliação do Google e retorno padrão. */
  atualizarPosAtendimento(id: number, dados: { linkAvaliacao?: string; retornoDias: number }): void {
    const link = dados.linkAvaliacao?.trim() || null;
    if (link && (!/^https:\/\/[^\s]+$/.test(link) || link.length > 300)) throw new ErroAgenda("Cole o link completo, começando com https://");
    const dias = Math.round(dados.retornoDias);
    if (!(dias >= 7 && dias <= 90)) throw new ErroAgenda("O retorno padrão tem que ser de 7 a 90 dias.");
    this.db.prepare("UPDATE barbearias SET link_avaliacao = ?, retorno_dias = ? WHERE id = ?").run(link, dias, id);
  }

  /** Próximo horário já marcado do cliente (depois de agora), se houver. */
  proximoDoCliente(barbeariaId: number, telefone: string, agora?: Date): DataHora | undefined {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b) return undefined;
    const r = this.db.prepare(`SELECT MIN(inicio) AS i FROM agendamentos
      WHERE barbearia_id = ? AND cliente_telefone = ? AND status = 'confirmado' AND inicio > ?`)
      .get(barbeariaId, telefone, agoraNoFuso(b.fuso, agora)) as { i: string | null };
    return r.i ?? undefined;
  }

  /**
   * Quando sugerir a volta do cliente: pelo ritmo dele (média dos últimos intervalos entre
   * visitas atendidas) ou, sem histórico, pelo retorno padrão da barbearia. Nunca antes de amanhã.
   */
  sugestaoDeRetorno(barbeariaId: number, telefone: string, agora?: Date): { data: Data; ritmoDias: number; deHistorico: boolean } {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b) throw new ErroAgenda("Barbearia não encontrada.");
    const hoje = agoraNoFuso(b.fuso, agora).slice(0, 10);
    const visitas = (this.db.prepare(`SELECT DISTINCT substr(inicio, 1, 10) AS d FROM agendamentos
      WHERE barbearia_id = ? AND cliente_telefone = ? AND status = 'confirmado' AND inicio <= ?
      ORDER BY d DESC LIMIT 5`).all(barbeariaId, telefone, agoraNoFuso(b.fuso, agora)) as { d: string }[]).map((x) => x.d);
    const ultima = visitas[0] ?? hoje;
    let ritmo = b.retornoDias;
    let deHistorico = false;
    if (visitas.length >= 2) {
      const dias = (d: string) => Date.parse(`${d}T12:00:00Z`) / 86_400_000;
      const gaps = visitas.slice(0, -1).map((d, i) => dias(d) - dias(visitas[i + 1]!));
      ritmo = Math.min(90, Math.max(7, Math.round(gaps.reduce((x, y) => x + y, 0) / gaps.length)));
      deHistorico = true;
    }
    const sugerida = somarDias(ultima, ritmo);
    return { data: sugerida > hoje ? sugerida : somarDias(hoje, 1), ritmoDias: ritmo, deHistorico };
  }

  // ---------- plano mensal do cliente ----------

  /** Cria ou atualiza o plano do cliente (um por número). Renovar = mudar o "válido até". */
  salvarPlano(barbeariaId: number, dados: { telefone: string; nome: string; usosPorMes: number; valorCentavos: number; validoAte: Data }): void {
    if (!/^\d{12,13}$/.test(dados.telefone)) throw new ErroAgenda("WhatsApp inválido.");
    const usos = Math.round(dados.usosPorMes);
    if (!(usos >= 1 && usos <= 31)) throw new ErroAgenda("Usos por mês entre 1 e 31.");
    if (!(dados.valorCentavos >= 0 && dados.valorCentavos <= 10_000_00)) throw new ErroAgenda("Valor inválido.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.validoAte)) throw new ErroAgenda("Data inválida.");
    this.db.prepare(`INSERT INTO planos_clientes (barbearia_id, telefone, nome, usos_por_mes, valor_centavos, valido_ate, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (barbearia_id, telefone) DO UPDATE SET nome = excluded.nome, usos_por_mes = excluded.usos_por_mes,
        valor_centavos = excluded.valor_centavos, valido_ate = excluded.valido_ate`)
      .run(barbeariaId, dados.telefone, nomeValido(dados.nome, "o nome do cliente"), usos, Math.round(dados.valorCentavos), dados.validoAte, new Date().toISOString());
  }

  removerPlano(barbeariaId: number, id: number): void {
    this.db.prepare("DELETE FROM planos_clientes WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
  }

  /** Planos com o uso do mês atual (horários confirmados no mês, inclusive os já marcados pra frente). */
  planos(barbeariaId: number, agora?: Date): PlanoCliente[] {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b) return [];
    const hoje = agoraNoFuso(b.fuso, agora).slice(0, 10);
    const mes = hoje.slice(0, 7);
    return (this.db.prepare(`SELECT p.id, p.telefone, p.nome, p.usos_por_mes AS usosPorMes, p.valor_centavos AS valorCentavos,
        p.valido_ate AS validoAte,
        (SELECT COUNT(*) FROM agendamentos a WHERE a.barbearia_id = p.barbearia_id AND a.cliente_telefone = p.telefone
          AND a.status = 'confirmado' AND a.inicio >= ? AND a.inicio < ?) AS usadosNoMes
      FROM planos_clientes p WHERE p.barbearia_id = ? ORDER BY p.nome`)
      .all(`${mes}-01`, `${mes}-99`, barbeariaId) as unknown as Omit<PlanoCliente, "vencido">[])
      .map((p) => ({ ...p, vencido: p.validoAte < hoje }));
  }

  /**
   * Divisão do mês por profissional: atendimentos, total pelo preço atual dos serviços e, pra
   * quem tem parte definida, quanto fica com ele e com a casa (comissão ou salão-parceiro).
   */
  divisaoDoMes(barbeariaId: number, mes: string, agora?: Date): DivisaoProfissional[] {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b || !/^\d{4}-\d{2}$/.test(mes)) throw new ErroAgenda("Mês inválido.");
    const linhas = this.db.prepare(`SELECT a.profissional_id AS id, COUNT(*) AS atendidos, SUM(s.preco_centavos + a.adicionais_centavos) AS total
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
      WHERE a.barbearia_id = ? AND a.status = 'confirmado' AND a.inicio >= ? AND a.inicio < ? AND a.inicio <= ?
      GROUP BY a.profissional_id`).all(barbeariaId, `${mes}-01`, `${mes}-99`, agoraNoFuso(b.fuso, agora)) as { id: number; atendidos: number; total: number }[];
    const porId = new Map(linhas.map((l) => [l.id, l]));
    return this.profissionais(barbeariaId).filter((p) => p.ativo || porId.has(p.id)).map((p) => {
      const l = porId.get(p.id);
      const total = l?.total ?? 0;
      const parte = p.partePct === undefined ? undefined : Math.round((total * p.partePct) / 100);
      return { profissionalId: p.id, nome: p.nome, atendidos: l?.atendidos ?? 0, totalCentavos: total, partePct: p.partePct,
        parteProfissionalCentavos: parte, parteBarbeariaCentavos: parte === undefined ? undefined : total - parte };
    });
  }

  /**
   * Clientes que passaram do próprio ritmo de volta (com 3 dias de folga) e não têm nada
   * marcado. Fica de fora quem foi chamado nos últimos `CHAMADA_PAUSA_DIAS`, quem sumiu há
   * mais de `SUMIDO_LIMITE_DIAS` (aí já não é atraso, é cliente perdido) e número bloqueado.
   */
  clientesSumidos(barbeariaId: number, agora?: Date): ClienteSumido[] {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b) return [];
    const agoraLocal = agoraNoFuso(b.fuso, agora);
    const hoje = agoraLocal.slice(0, 10);
    const desde = somarDias(hoje, -SUMIDO_LIMITE_DIAS);
    const chamadosDesde = new Date((agora ?? new Date()).getTime() - CHAMADA_PAUSA_DIAS * 86_400_000).toISOString();
    const linhas = this.db.prepare(`SELECT a.cliente_telefone AS telefone, MAX(a.inicio) AS ultima
      FROM agendamentos a
      WHERE a.barbearia_id = ? AND a.status = 'confirmado' AND a.inicio <= ?
        AND NOT EXISTS (SELECT 1 FROM agendamentos f WHERE f.barbearia_id = a.barbearia_id AND f.cliente_telefone = a.cliente_telefone
          AND f.status = 'confirmado' AND f.inicio > ?)
        AND NOT EXISTS (SELECT 1 FROM telefones_bloqueados t WHERE t.barbearia_id = a.barbearia_id AND t.telefone = a.cliente_telefone)
        AND NOT EXISTS (SELECT 1 FROM chamadas_retorno c WHERE c.barbearia_id = a.barbearia_id AND c.telefone = a.cliente_telefone AND c.em > ?)
      GROUP BY a.cliente_telefone HAVING ultima >= ?`)
      .all(barbeariaId, agoraLocal, agoraLocal, chamadosDesde, desde) as { telefone: string; ultima: string }[];
    const ultimo = this.db.prepare(`SELECT a.cliente_nome AS nome, s.nome || COALESCE(' + ' || a.adicionais_nomes, '') AS servico FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
      WHERE a.barbearia_id = ? AND a.cliente_telefone = ? AND a.inicio = ?`);
    const dias = (d: string) => Date.parse(`${d}T12:00:00Z`) / 86_400_000;
    return linhas.flatMap((l) => {
      const { ritmoDias } = this.sugestaoDeRetorno(barbeariaId, l.telefone, agora);
      const semVir = Math.round(dias(hoje) - dias(l.ultima.slice(0, 10)));
      if (semVir < ritmoDias + 3) return [];
      const u = ultimo.get(barbeariaId, l.telefone, l.ultima) as { nome: string; servico: string };
      return [{ telefone: l.telefone, nome: u.nome, ultimoServico: u.servico, ultimaVisita: l.ultima.slice(0, 10), diasSemVir: semVir, ritmoDias }];
    }).sort((x, y) => (y.diasSemVir - y.ritmoDias) - (x.diasSemVir - x.ritmoDias));
  }

  /** Anota que o barbeiro chamou o cliente de volta (some da lista por uns dias). */
  registrarChamada(barbeariaId: number, telefone: string, agora = new Date()): void {
    this.db.prepare(`INSERT INTO chamadas_retorno (barbearia_id, telefone, em) VALUES (?, ?, ?)
      ON CONFLICT (barbearia_id, telefone) DO UPDATE SET em = excluded.em`).run(barbeariaId, telefone, agora.toISOString());
  }

  /**
   * Os números do mês (até agora): atendidos, faltas, faturamento estimado pelo preço atual dos
   * serviços, ocupação aproximada (minutos atendidos ÷ minutos de expediente × profissionais
   * ativos), clientes que voltaram e quantos atendimentos saíram com o próximo horário marcado.
   */
  numerosDoMes(barbeariaId: number, mes: string, agora?: Date): NumerosDoMes {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b || !/^\d{4}-\d{2}$/.test(mes)) throw new ErroAgenda("Mês inválido.");
    const agoraLocal = agoraNoFuso(b.fuso, agora);
    const inicioMes = `${mes}-01`;
    const linhas = this.db.prepare(`SELECT a.id, a.cliente_telefone AS telefone, a.inicio, a.fim, a.status, s.preco_centavos + a.adicionais_centavos AS preco
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
      WHERE a.barbearia_id = ? AND a.inicio >= ? AND a.inicio < ? AND a.inicio <= ? AND a.status IN ('confirmado', 'faltou')`)
      .all(barbeariaId, inicioMes, `${mes}-99`, agoraLocal) as { id: number; telefone: string; inicio: string; fim: string; status: string; preco: number }[];
    const atendidos = linhas.filter((l) => l.status === "confirmado");
    const faltas = linhas.filter((l) => l.status === "faltou");
    const minutos = (l: { inicio: string; fim: string }) => paraMinutos(l.fim.slice(11)) - paraMinutos(l.inicio.slice(11));

    // Capacidade: expediente de cada dia do mês até hoje, vezes os profissionais ativos.
    const exped = this.expedientes(barbeariaId);
    const profs = Math.max(1, this.profissionais(barbeariaId, true).length);
    let capacidade = 0;
    for (let d = inicioMes; d.startsWith(mes) && d <= agoraLocal.slice(0, 10); d = somarDias(d, 1)) {
      const e = exped.get(diaDaSemana(d));
      if (!e) continue;
      let m = paraMinutos(e.fecha) - paraMinutos(e.abre);
      if (e.pausaInicio && e.pausaFim) m -= paraMinutos(e.pausaFim) - paraMinutos(e.pausaInicio);
      capacidade += Math.max(0, m) * profs;
    }
    const minutosAtendidos = atendidos.reduce((t, l) => t + minutos(l), 0);

    const jaVieramAntes = new Set((this.db.prepare(`SELECT DISTINCT cliente_telefone AS t FROM agendamentos
      WHERE barbearia_id = ? AND status = 'confirmado' AND inicio < ?`).all(barbeariaId, inicioMes) as { t: string }[]).map((x) => x.t));
    const clientes = new Set(atendidos.map((l) => l.telefone));
    const proximo = this.db.prepare(`SELECT 1 FROM agendamentos WHERE barbearia_id = ? AND cliente_telefone = ?
      AND status IN ('confirmado', 'faltou') AND inicio > ? LIMIT 1`);
    const comRetorno = atendidos.filter((l) => proximo.get(barbeariaId, l.telefone, l.inicio)).length;

    return {
      atendidos: atendidos.length,
      faltas: faltas.length,
      faturamentoCentavos: atendidos.reduce((t, l) => t + l.preco, 0),
      perdidoEmFaltasCentavos: faltas.reduce((t, l) => t + l.preco, 0),
      ocupacao: capacidade > 0 ? Math.min(1, minutosAtendidos / capacidade) : 0,
      clientes: clientes.size,
      clientesQueVoltaram: [...clientes].filter((t) => jaVieramAntes.has(t)).length,
      saiuComRetorno: comRetorno,
    };
  }

  // ---------- folga em parte do dia ----------

  bloqueiosDoDia(barbeariaId: number, data: Data): Bloqueio[] {
    const linhas = this.db.prepare(`SELECT x.id, x.profissional_id AS profissionalId, p.nome AS profissional, x.inicio, x.fim, x.motivo
      FROM bloqueios x LEFT JOIN profissionais p ON p.id = x.profissional_id
      WHERE x.barbearia_id = ? AND x.inicio LIKE ? ORDER BY x.inicio`).all(barbeariaId, `${data}%`) as Record<string, unknown>[];
    return linhas.map((l) => ({ ...l, profissionalId: l.profissionalId ?? undefined, profissional: l.profissional ?? undefined, motivo: l.motivo ?? undefined })) as Bloqueio[];
  }

  /**
   * Bloqueia um período de um dia (pra todos ou um profissional). Não cancela
   * ninguém: devolve os horários já marcados nesse período pro barbeiro decidir.
   */
  bloquearPeriodo(barbeariaId: number, dados: { data: Data; de: string; ate: string; profissionalId?: number; motivo?: string }): { id: number; conflitos: Agendamento[] } {
    const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data) || !hora.test(dados.de) || !hora.test(dados.ate)) throw new ErroAgenda("Dia ou horário inválido.");
    if (paraMinutos(dados.de) >= paraMinutos(dados.ate)) throw new ErroAgenda("O fim precisa ser depois do começo.");
    if (dados.profissionalId !== undefined && !this.profissionais(barbeariaId).some((p) => p.id === dados.profissionalId)) {
      throw new ErroAgenda("Profissional não encontrado.");
    }
    const inicio = `${dados.data}T${dados.de}`;
    const fim = `${dados.data}T${dados.ate}`;
    const r = this.db.prepare("INSERT INTO bloqueios (barbearia_id, profissional_id, inicio, fim, motivo, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
      .run(barbeariaId, dados.profissionalId ?? null, inicio, fim, dados.motivo?.trim().slice(0, 60) || null, new Date().toISOString());
    const conflitos = this.agendamentosDoDia(barbeariaId, dados.data, dados.profissionalId)
      .filter((a) => a.status === "confirmado" && a.inicio < fim && a.fim > inicio);
    return { id: Number(r.lastInsertRowid), conflitos };
  }

  removerBloqueio(barbeariaId: number, id: number): void {
    this.db.prepare("DELETE FROM bloqueios WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
  }

  /** Folgas num intervalo (pro calendário do barbeiro). */
  bloqueiosEntre(barbeariaId: number, desde: Data, ate: Data, profissionalId?: number): Bloqueio[] {
    const linhas = this.db.prepare(`SELECT x.id, x.profissional_id AS profissionalId, p.nome AS profissional, x.inicio, x.fim, x.motivo
      FROM bloqueios x LEFT JOIN profissionais p ON p.id = x.profissional_id
      WHERE x.barbearia_id = ? AND x.inicio >= ? AND x.inicio < ?
        ${profissionalId ? "AND (x.profissional_id IS NULL OR x.profissional_id = ?)" : ""}
      ORDER BY x.inicio`).all(barbeariaId, desde, `${ate}T99`, ...(profissionalId ? [profissionalId] : [])) as Record<string, unknown>[];
    return linhas.map((l) => ({ ...l, profissionalId: l.profissionalId ?? undefined, profissional: l.profissional ?? undefined, motivo: l.motivo ?? undefined })) as Bloqueio[];
  }

  // ---------- travas contra abuso ----------

  /**
   * Conta uma tentativa e recusa se passou do limite na janela. A chave já vem
   * pronta (ex.: "agendar:ip:<hash>:<barbearia>") — nunca o IP ou e-mail puro.
   */
  consumirLimite(chave: string, max: number, janelaMin: number, mensagem: string, agora = new Date()): void {
    const desde = new Date(agora.getTime() - janelaMin * 60_000).toISOString();
    const n = (this.db.prepare("SELECT COUNT(*) AS n FROM tentativas WHERE chave = ? AND em > ?").get(chave, desde) as { n: number }).n;
    if (n >= max) throw new ErroAgenda(mensagem);
    this.db.prepare("INSERT INTO tentativas (chave, em) VALUES (?, ?)").run(chave, agora.toISOString());
    // Faxina de vez em quando: nada aqui precisa de mais de 2 dias.
    if (Math.random() < 0.02) this.db.prepare("DELETE FROM tentativas WHERE em < ?").run(new Date(agora.getTime() - 2 * 86_400_000).toISOString());
  }

  /** Quantas tentativas na janela (sem contar uma nova). */
  contarTentativas(chave: string, janelaMin: number, agora = new Date()): number {
    const desde = new Date(agora.getTime() - janelaMin * 60_000).toISOString();
    return (this.db.prepare("SELECT COUNT(*) AS n FROM tentativas WHERE chave = ? AND em > ?").get(chave, desde) as { n: number }).n;
  }

  limparTentativas(chave: string): void {
    this.db.prepare("DELETE FROM tentativas WHERE chave = ?").run(chave);
  }

  telefoneBloqueado(barbeariaId: number, telefone: string): boolean {
    return !!this.db.prepare("SELECT 1 FROM telefones_bloqueados WHERE barbearia_id = ? AND telefone = ?").get(barbeariaId, telefone);
  }

  /** Bloqueia o número e cancela os horários futuros dele. Devolve quantos cancelou. */
  bloquearTelefone(barbeariaId: number, telefone: string, agora?: Date): number {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b || !/^\d{12,13}$/.test(telefone)) throw new ErroAgenda("Número inválido.");
    this.db.prepare("INSERT OR IGNORE INTO telefones_bloqueados (barbearia_id, telefone, em) VALUES (?, ?, ?)").run(barbeariaId, telefone, new Date().toISOString());
    return Number(this.db.prepare(`UPDATE agendamentos SET status = 'cancelado'
      WHERE barbearia_id = ? AND cliente_telefone = ? AND status = 'confirmado' AND inicio > ?`)
      .run(barbeariaId, telefone, agoraNoFuso(b.fuso, agora)).changes);
  }

  desbloquearTelefone(barbeariaId: number, telefone: string): void {
    this.db.prepare("DELETE FROM telefones_bloqueados WHERE barbearia_id = ? AND telefone = ?").run(barbeariaId, telefone);
  }

  telefonesBloqueados(barbeariaId: number): { telefone: string; em: string }[] {
    return this.db.prepare("SELECT telefone, em FROM telefones_bloqueados WHERE barbearia_id = ? ORDER BY em DESC").all(barbeariaId) as { telefone: string; em: string }[];
  }

  // ---------- calendário do barbeiro (link secreto assinado no celular) ----------

  /**
   * Link do calendário: da barbearia toda (sem profissionalId) ou de um profissional.
   * Fica guardado como veio (o painel precisa mostrar de novo); "renovar" invalida o antigo.
   */
  tokenAgenda(barbeariaId: number, profissionalId?: number, renovar = false): string {
    const tabela = profissionalId === undefined ? "barbearias" : "profissionais";
    const where = profissionalId === undefined ? "id = ?" : "id = ? AND barbearia_id = ?";
    const args = profissionalId === undefined ? [barbeariaId] : [profissionalId, barbeariaId];
    const atual = this.db.prepare(`SELECT token_agenda AS t FROM ${tabela} WHERE ${where}`).get(...args) as { t: string | null } | undefined;
    if (!atual) throw new ErroAgenda("Profissional não encontrado.");
    if (atual.t && !renovar) return atual.t;
    const token = randomBytes(24).toString("base64url");
    this.db.prepare(`UPDATE ${tabela} SET token_agenda = ? WHERE ${where}`).run(token, ...args);
    return token;
  }

  /** De quem é o link do calendário (ou undefined se não existe / foi renovado). */
  donoDoTokenAgenda(token: string): { barbeariaId: number; profissionalId?: number } | undefined {
    if (!/^[A-Za-z0-9_-]{30,40}$/.test(token)) return undefined;
    const b = this.db.prepare("SELECT id FROM barbearias WHERE token_agenda = ?").get(token) as { id: number } | undefined;
    if (b) return { barbeariaId: b.id };
    const p = this.db.prepare("SELECT id, barbearia_id AS b FROM profissionais WHERE token_agenda = ?").get(token) as { id: number; b: number } | undefined;
    return p && { barbeariaId: p.b, profissionalId: p.id };
  }

  /** Horários confirmados num intervalo de datas (pro calendário do barbeiro). */
  agendamentosEntre(barbeariaId: number, desde: Data, ate: Data, profissionalId?: number): (Agendamento & { duracaoMin: number })[] {
    // Duração pelo fim gravado: é o que ocupa a agenda (muda junto quando o barbeiro muda o tempo do serviço).
    return this.db.prepare(`SELECT a.id, a.servico_id AS servicoId, s.nome || COALESCE(' + ' || a.adicionais_nomes, '') AS servico,
        CAST(round((julianday(a.fim) - julianday(a.inicio)) * 1440) AS INTEGER) AS duracaoMin,
        a.profissional_id AS profissionalId, p.nome AS profissional, a.cliente_nome AS clienteNome,
        a.cliente_telefone AS clienteTelefone, a.inicio, a.fim, a.status
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id JOIN profissionais p ON p.id = a.profissional_id
      WHERE a.barbearia_id = ? AND a.status = 'confirmado' AND a.inicio >= ? AND a.inicio < ?
        ${profissionalId ? "AND a.profissional_id = ?" : ""}
      ORDER BY a.inicio`)
      .all(barbeariaId, desde, `${ate}T99`, ...(profissionalId ? [profissionalId] : [])) as unknown as (Agendamento & { duracaoMin: number })[];
  }

  // ---------- link do cliente: ver, cancelar e remarcar sem login ----------

  /** Cria o link secreto do horário. O token só existe aqui e na mão do cliente. */
  criarLinkCliente(barbeariaId: number, id: number): string {
    const { token, hash } = novoToken();
    const r = this.db.prepare("UPDATE agendamentos SET token_cliente = ? WHERE id = ? AND barbearia_id = ?").run(hash, id, barbeariaId);
    if (r.changes !== 1) throw new ErroAgenda("Horário não encontrado.");
    return token;
  }

  horarioDoCliente(barbeariaId: number, token: string, agora?: Date): HorarioCliente | undefined {
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return undefined;
    // Duração pelo fim gravado: inclui os adicionais (vale ao remarcar).
    const a = this.db.prepare(`SELECT a.id, a.servico_id AS servicoId, s.nome || COALESCE(' + ' || a.adicionais_nomes, '') AS servico,
        CAST(round((julianday(a.fim) - julianday(a.inicio)) * 1440) AS INTEGER) AS duracaoMin,
        a.profissional_id AS profissionalId, p.nome AS profissional, a.cliente_nome AS clienteNome,
        a.cliente_telefone AS clienteTelefone, a.inicio, a.fim, a.status
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id JOIN profissionais p ON p.id = a.profissional_id
      WHERE a.token_cliente = ? AND a.barbearia_id = ?`).get(hashToken(token), barbeariaId) as Omit<HorarioCliente, "passou"> | undefined;
    const b = this.barbeariaPorId(barbeariaId);
    if (!a || !b) return undefined;
    return { ...a, passou: a.inicio <= agoraNoFuso(b.fuso, agora) };
  }

  /** Devolve o horário cancelado (pra avisar o barbeiro). */
  cancelarPeloCliente(barbeariaId: number, token: string, agora?: Date): HorarioCliente {
    const h = this.horarioDoCliente(barbeariaId, token, agora);
    if (!h) throw new ErroAgenda("Horário não encontrado.");
    if (h.status !== "confirmado") throw new ErroAgenda("Esse horário já foi cancelado.");
    if (h.passou) throw new ErroAgenda("Esse horário já começou. Fale com a barbearia pelo WhatsApp.");
    this.cancelar(barbeariaId, h.id);
    return { ...h, status: "cancelado" };
  }

  /** Troca dia, hora e profissional do mesmo horário (mesmo serviço e cliente). Revalida na transação. */
  remarcarPeloCliente(barbeariaId: number, token: string, novo: { profissionalId: number; data: Data; hora: string }, agora?: Date): { antes: HorarioCliente; depois: DataHora } {
    const h = this.horarioDoCliente(barbeariaId, token, agora);
    if (!h) throw new ErroAgenda("Horário não encontrado.");
    if (h.status !== "confirmado") throw new ErroAgenda("Esse horário foi cancelado. Marque um novo.");
    if (h.passou) throw new ErroAgenda("Esse horário já começou. Fale com a barbearia pelo WhatsApp.");
    const b = this.barbeariaPorId(barbeariaId);
    if (!b || !this.acessoAtivo(b, agora)) throw new ErroAgenda("Agenda temporariamente indisponível.");
    if (!this.profissionais(barbeariaId, true).some((p) => p.id === novo.profissionalId)) throw new ErroAgenda("Profissional indisponível.");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const livres = this.horariosLivres(barbeariaId, novo.profissionalId, h.servicoId, novo.data, agora, h.id, { duracaoMin: h.duracaoMin });
      if (!livres.includes(novo.hora)) throw new ErroAgenda("Esse horário acabou de ser ocupado. Escolha outro.");
      const inicio = `${novo.data}T${novo.hora}`;
      const fim = `${novo.data}T${deMinutos(paraMinutos(novo.hora) + h.duracaoMin)}`;
      this.db.prepare("UPDATE agendamentos SET profissional_id = ?, inicio = ?, fim = ? WHERE id = ? AND barbearia_id = ?")
        .run(novo.profissionalId, inicio, fim, h.id, barbeariaId);
      this.db.exec("COMMIT");
      return { antes: h, depois: inicio };
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  // ---------- assinatura (Pix com confirmação manual) ----------

  /**
   * Site e painel no ar? Suspensa pelo admin, nunca. Com `vencerBloqueia: false` (o SaaS), conta
   * de barbeiro fica no ar mesmo depois do prazo (o painel só avisa); demonstração vence sempre.
   */
  acessoAtivo(b: Barbearia, agora?: Date): boolean {
    if (b.suspensa) return false;
    if (this.plano.vencerBloqueia === false && !b.demoAte && !b.emMontagem) return true;
    return this.dentroDoPrazo(b, agora);
  }

  /** O período pago (acesso_ate) ainda não acabou? É o que vira "em dia" ou "atrasada". */
  dentroDoPrazo(b: Barbearia, agora?: Date): boolean {
    return agoraNoFuso(b.fuso, agora).slice(0, 10) <= b.acessoAte;
  }

  /** Dias restantes contando hoje (0 = bloqueado). */
  diasRestantes(b: Barbearia, agora?: Date): number {
    const hoje = agoraNoFuso(b.fuso, agora).slice(0, 10);
    if (hoje > b.acessoAte) return 0;
    return Math.round((Date.parse(b.acessoAte) - Date.parse(hoje)) / 86_400_000) + 1;
  }

  /** Já teve algum pagamento confirmado (ou seja, já pagou a contratação)? */
  jaContratou(barbeariaId: number): boolean {
    return !!this.db.prepare("SELECT 1 FROM pagamentos WHERE barbearia_id = ? AND status = 'confirmado' LIMIT 1").get(barbeariaId);
  }

  /** Valor da próxima cobrança: contratação na primeira vez, mensalidade depois. */
  valorDaProximaCobranca(barbeariaId: number): number {
    const adesao = this.plano.adesaoCentavos ?? 0;
    return adesao > 0 && !this.jaContratou(barbeariaId) ? adesao : this.plano.valorCentavos;
  }

  /** Pagamento em aberto da barbearia; cria um se não houver. Evita uma pilha de cobranças repetidas. */
  pagamentoAberto(barbeariaId: number): Pagamento {
    const valor = this.valorDaProximaCobranca(barbeariaId);
    const existente = this.db.prepare(`SELECT ${COLUNAS_PAGAMENTO} FROM pagamentos p JOIN barbearias b ON b.id = p.barbearia_id
      WHERE p.barbearia_id = ? AND p.status IN ('aberto', 'informado') ORDER BY p.id DESC LIMIT 1`).get(barbeariaId) as Pagamento | undefined;
    // Se o preço mudou e o barbeiro ainda não disse que pagou, a cobrança em aberto acompanha o preço novo.
    if (existente && existente.status === "aberto" && existente.valorCentavos !== valor) {
      this.db.prepare("UPDATE pagamentos SET valor_centavos = ?, dias = ? WHERE id = ?").run(valor, this.plano.dias, existente.id);
      return this.pagamentoAberto(barbeariaId);
    }
    if (existente) return existente;
    const txid = `AG${barbeariaId}X${randomBytes(4).toString("hex").toUpperCase()}`;
    this.db.prepare(`INSERT INTO pagamentos (barbearia_id, txid, valor_centavos, dias, criado_em) VALUES (?, ?, ?, ?, ?)`)
      .run(barbeariaId, txid, valor, this.plano.dias, new Date().toISOString());
    return this.pagamentoAberto(barbeariaId);
  }

  /** Barbeiro avisa que pagou. Não libera nada: só coloca na fila do admin. */
  informarPagamento(barbeariaId: number, pagamentoId: number, pagador: string): void {
    const r = this.db.prepare(`UPDATE pagamentos SET status = 'informado', pagador = ?
      WHERE id = ? AND barbearia_id = ? AND status IN ('aberto', 'informado')`).run(pagador.trim().slice(0, 80) || null, pagamentoId, barbeariaId);
    if (r.changes === 0) throw new ErroAgenda("Pagamento não encontrado.");
  }

  /**
   * Liga o comprovante (já gravado em disco) ao pagamento em aberto e põe na fila do admin.
   * Não libera nada. Devolve o comprovante anterior, se havia, pra quem chamou apagar.
   */
  anexarComprovante(barbeariaId: number, pagamentoId: number, arquivo: string, pagador: string): string | undefined {
    const antes = this.db.prepare("SELECT comprovante FROM pagamentos WHERE id = ? AND barbearia_id = ? AND status IN ('aberto', 'informado')")
      .get(pagamentoId, barbeariaId) as { comprovante: string | null } | undefined;
    if (!antes) throw new ErroAgenda("Pagamento não encontrado.");
    this.db.prepare("UPDATE pagamentos SET status = 'informado', comprovante = ?, pagador = COALESCE(?, pagador) WHERE id = ?")
      .run(arquivo, pagador.trim().slice(0, 80) || null, pagamentoId);
    return antes.comprovante ?? undefined;
  }

  pagamento(pagamentoId: number): Pagamento | undefined {
    const p = this.db.prepare(`SELECT ${COLUNAS_PAGAMENTO} FROM pagamentos p JOIN barbearias b ON b.id = p.barbearia_id WHERE p.id = ?`)
      .get(pagamentoId) as Pagamento | undefined;
    return p && { ...p, pagador: p.pagador ?? undefined, comprovante: p.comprovante ?? undefined };
  }

  pagamentosDaBarbearia(barbeariaId: number): Pagamento[] {
    return this.db.prepare(`SELECT ${COLUNAS_PAGAMENTO} FROM pagamentos p JOIN barbearias b ON b.id = p.barbearia_id
      WHERE p.barbearia_id = ? ORDER BY p.id DESC`).all(barbeariaId) as unknown as Pagamento[];
  }

  // ---------- admin ----------

  pagamentosPendentes(): Pagamento[] {
    return this.db.prepare(`SELECT ${COLUNAS_PAGAMENTO} FROM pagamentos p JOIN barbearias b ON b.id = p.barbearia_id
      WHERE p.status IN ('informado', 'aberto') ORDER BY CASE p.status WHEN 'informado' THEN 0 ELSE 1 END, p.id`)
      .all() as unknown as Pagamento[];
  }

  /** Admin conferiu o extrato: soma os dias a partir de hoje ou do fim do acesso atual, o que for maior. */
  confirmarPagamento(pagamentoId: number, agora?: Date): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const p = this.db.prepare("SELECT barbearia_id AS barbeariaId, dias, status FROM pagamentos WHERE id = ?").get(pagamentoId) as
        { barbeariaId: number; dias: number; status: StatusPagamento } | undefined;
      if (!p || (p.status !== "aberto" && p.status !== "informado")) throw new ErroAgenda("Pagamento já decidido ou inexistente.");
      const b = this.barbeariaPorId(p.barbeariaId)!;
      const hoje = agoraNoFuso(b.fuso, agora).slice(0, 10);
      // Os dias de montagem não contam: o mês pago começa no dia em que o site vai pro ar.
      const base = !b.emMontagem && b.acessoAte >= hoje ? somarDias(b.acessoAte, 1) : hoje;
      this.db.prepare("UPDATE barbearias SET acesso_ate = ?, montagem = 0 WHERE id = ?").run(somarDias(base, p.dias - 1), b.id);
      this.db.prepare("UPDATE pagamentos SET status = 'confirmado', decidido_em = ? WHERE id = ?").run(new Date().toISOString(), pagamentoId);
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  recusarPagamento(pagamentoId: number): void {
    this.db.prepare("UPDATE pagamentos SET status = 'recusado', decidido_em = ? WHERE id = ? AND status IN ('aberto', 'informado')")
      .run(new Date().toISOString(), pagamentoId);
  }

  todasBarbearias(): (Barbearia & { email: string })[] {
    return this.db.prepare(`SELECT ${COLUNAS_BARBEARIA.split(", ").map((c) => `b.${c}`).join(", ")},
      (SELECT email FROM usuarios u WHERE u.barbearia_id = b.id ORDER BY u.id LIMIT 1) AS email
      FROM barbearias b ORDER BY b.acesso_ate`).all().map((l) => paraBarbearia(l as Record<string, unknown>)) as unknown as (Barbearia & { email: string })[];
  }

  /** Até quando está pago, direto (no app de um barbeiro só, vem do PAGO_ATE do .env). */
  definirPrazo(barbeariaId: number, ate: Data): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ate) || Number.isNaN(Date.parse(ate))) throw new ErroAgenda("Data inválida.");
    this.db.prepare("UPDATE barbearias SET acesso_ate = ? WHERE id = ?").run(ate, barbeariaId);
  }

  /** Admin tira do ar (ou põe de volta) o site e o painel, sem mexer no prazo. */
  suspender(barbeariaId: number, suspensa: boolean): void {
    this.db.prepare("UPDATE barbearias SET suspensa = ? WHERE id = ?").run(suspensa ? 1 : 0, barbeariaId);
  }

  /**
   * Admin registrou que o barbeiro pagou (a cobrança é fora daqui): soma `dias` depois do fim do
   * prazo atual, ou a partir de hoje se ele já acabou.
   */
  renovar(barbeariaId: number, dias: number, agora?: Date): void {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b) throw new ErroAgenda("Barbearia não encontrada.");
    if (!Number.isInteger(dias) || dias < 1 || dias > 400) throw new ErroAgenda("Dias inválidos.");
    const hoje = agoraNoFuso(b.fuso, agora).slice(0, 10);
    const base = b.acessoAte >= hoje ? somarDias(b.acessoAte, 1) : hoje;
    this.db.prepare("UPDATE barbearias SET acesso_ate = ? WHERE id = ?").run(somarDias(base, dias - 1), barbeariaId);
  }

  /** Bloqueio manual imediato (ex.: estorno, fraude), com um app só: tira o prazo pra ontem. */
  bloquear(barbeariaId: number, agora?: Date): void {
    const b = this.barbeariaPorId(barbeariaId);
    if (!b) return;
    this.db.prepare("UPDATE barbearias SET acesso_ate = ? WHERE id = ?").run(somarDias(agoraNoFuso(b.fuso, agora).slice(0, 10), -1), barbeariaId);
  }

  /** Cópia consistente do banco inteiro, pra backup. */
  copiarPara(destino: string): void {
    this.db.prepare("VACUUM INTO ?").run(destino);
  }

  // ---------- fotos (portfólio) ----------

  fotos(barbeariaId: number, categoria?: CategoriaFoto): Foto[] {
    return this.db.prepare(`SELECT ${COLUNAS_FOTO} FROM fotos
      WHERE barbearia_id = ? ${categoria ? "AND categoria = ?" : ""} ORDER BY capa DESC, id DESC`)
      .all(barbeariaId, ...(categoria ? [categoria] : [])) as unknown as Foto[];
  }

  fotoDaBarbearia(barbeariaId: number, arquivo: string): Foto | undefined {
    return this.db.prepare(`SELECT ${COLUNAS_FOTO} FROM fotos WHERE barbearia_id = ? AND arquivo = ?`)
      .get(barbeariaId, arquivo) as Foto | undefined;
  }

  /** Reserva o nome do arquivo antes de gravar no disco; devolve o uuid. */
  registrarFoto(barbeariaId: number, f: { categoria: string; legenda?: string; largura: number; altura: number }): string {
    if (!categoriaValida(f.categoria)) throw new ErroAgenda("Categoria inválida.");
    const { n } = this.db.prepare("SELECT COUNT(*) AS n FROM fotos WHERE barbearia_id = ?").get(barbeariaId) as { n: number };
    if (n >= MAX_FOTOS) throw new ErroAgenda(`Limite de ${MAX_FOTOS} fotos. Apague algumas antes de enviar mais.`);
    const arquivo = randomUUID();
    this.db.prepare("INSERT INTO fotos (barbearia_id, arquivo, categoria, legenda, largura, altura, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(barbeariaId, arquivo, f.categoria, f.legenda?.trim().slice(0, 80) || null, f.largura, f.altura, new Date().toISOString());
    return arquivo;
  }

  editarFoto(barbeariaId: number, id: number, dados: { categoria: string; legenda?: string }): void {
    if (!categoriaValida(dados.categoria)) throw new ErroAgenda("Categoria inválida.");
    this.db.prepare("UPDATE fotos SET categoria = ?, legenda = ? WHERE id = ? AND barbearia_id = ?")
      .run(dados.categoria, dados.legenda?.trim().slice(0, 80) || null, id, barbeariaId);
  }

  /** A capa aparece no topo do site. Só uma por barbearia. */
  definirCapa(barbeariaId: number, id: number): void {
    this.db.exec("BEGIN");
    try {
      this.db.prepare("UPDATE fotos SET capa = 0 WHERE barbearia_id = ?").run(barbeariaId);
      this.db.prepare("UPDATE fotos SET capa = 1 WHERE id = ? AND barbearia_id = ?").run(id, barbeariaId);
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  /**
   * Apaga o registro e devolve o arquivo pra quem chamou remover do disco. Foto de exemplo
   * copiada (`copiarFotos`) divide o arquivo com outros sites: aí só some o registro.
   */
  removerFoto(barbeariaId: number, id: number): string | undefined {
    const f = this.db.prepare("SELECT arquivo FROM fotos WHERE id = ? AND barbearia_id = ?").get(id, barbeariaId) as { arquivo: string } | undefined;
    if (!f) return undefined;
    this.db.prepare("UPDATE profissionais SET foto_arquivo = NULL WHERE barbearia_id = ? AND foto_arquivo = ?").run(barbeariaId, f.arquivo);
    this.db.prepare("UPDATE fotos SET antes_de = NULL WHERE barbearia_id = ? AND antes_de = ?").run(barbeariaId, f.arquivo);
    this.db.prepare("DELETE FROM fotos WHERE id = ?").run(id);
    return this.db.prepare("SELECT 1 FROM fotos WHERE arquivo = ?").get(f.arquivo) ? undefined : f.arquivo;
  }

  /**
   * O barbeiro escolhe uma foto do acervo (as fotos de um site de exemplo) pra um espaço do site
   * dele: entra como foto dele, dividindo o arquivo. `acervoId` vem do servidor (o exemplo), nunca
   * do formulário: só dá pra pegar foto do acervo, não de outra barbearia. Devolve o id novo.
   */
  usarFotoDoAcervo(barbeariaId: number, acervoId: number, fotoId: number, categoria?: string): number {
    const f = this.db.prepare("SELECT arquivo, categoria, legenda, largura, altura FROM fotos WHERE id = ? AND barbearia_id = ?")
      .get(fotoId, acervoId) as { arquivo: string; categoria: string; legenda: string | null; largura: number; altura: number } | undefined;
    if (!f) throw new ErroAgenda("Foto não encontrada.");
    const ja = this.db.prepare("SELECT id FROM fotos WHERE barbearia_id = ? AND arquivo = ?").get(barbeariaId, f.arquivo) as { id: number } | undefined;
    if (ja) return ja.id;
    const cat = categoria ?? f.categoria;
    if (!categoriaValida(cat)) throw new ErroAgenda("Categoria inválida.");
    const { n } = this.db.prepare("SELECT COUNT(*) AS n FROM fotos WHERE barbearia_id = ?").get(barbeariaId) as { n: number };
    if (n >= MAX_FOTOS) throw new ErroAgenda(`Limite de ${MAX_FOTOS} fotos. Apague algumas antes de pôr mais.`);
    const r = this.db.prepare("INSERT INTO fotos (barbearia_id, arquivo, categoria, legenda, largura, altura, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(barbeariaId, f.arquivo, cat, f.legenda, f.largura, f.altura, new Date().toISOString());
    return Number(r.lastInsertRowid);
  }

  /**
   * Copia as fotos (e a capa) de um site pra outro sem duplicar arquivo no disco: os dois
   * registros apontam pro mesmo arquivo. Usado na prévia montada pelo próprio barbeiro.
   */
  copiarFotos(origemId: number, destinoId: number): void {
    this.db.prepare(`INSERT INTO fotos (barbearia_id, arquivo, categoria, legenda, largura, altura, capa, criado_em)
      SELECT ?, arquivo, categoria, legenda, largura, altura, capa, ? FROM fotos WHERE barbearia_id = ? ORDER BY id`)
      .run(destinoId, new Date().toISOString(), origemId);
  }

  /**
   * Marca a foto `id` como o "antes" da foto `arquivoDepois` (mesma barbearia).
   * null desfaz. Vira o comparador arrastável de antes e depois no site.
   */
  definirAntes(barbeariaId: number, id: number, arquivoDepois: string | null): void {
    const antes = this.db.prepare("SELECT arquivo FROM fotos WHERE id = ? AND barbearia_id = ?").get(id, barbeariaId) as { arquivo: string } | undefined;
    if (!antes) throw new ErroAgenda("Foto não encontrada.");
    if (arquivoDepois) {
      if (arquivoDepois === antes.arquivo || !this.fotoDaBarbearia(barbeariaId, arquivoDepois)) throw new ErroAgenda("Escolha outra foto como \"depois\".");
    }
    this.db.prepare("UPDATE fotos SET antes_de = ? WHERE id = ?").run(arquivoDepois, id);
  }

  paresAntesDepois(barbeariaId: number): { antes: Foto; depois: Foto }[] {
    const fotos = this.fotos(barbeariaId);
    const porArquivo = new Map(fotos.map((f) => [f.arquivo, f]));
    return fotos.flatMap((f) => {
      const depois = f.antesDe ? porArquivo.get(f.antesDe) : undefined;
      return depois ? [{ antes: f, depois }] : [];
    });
  }

  /** Atendimentos confirmados pelo site (vira contador no tema Luxo Técnico). */
  totalAtendimentos(barbeariaId: number): number {
    return (this.db.prepare("SELECT COUNT(*) AS n FROM agendamentos WHERE barbearia_id = ? AND status = 'confirmado'").get(barbeariaId) as { n: number }).n;
  }

  /** A rota pública de imagem só entrega arquivo que está registrado no banco. */
  fotoExiste(arquivo: string): boolean {
    return !!this.db.prepare("SELECT 1 FROM fotos WHERE arquivo = ?").get(arquivo);
  }

  // ---------- avisos no celular do barbeiro (Web Push) ----------

  /** Guarda o aparelho que pediu avisos. Se o mesmo endpoint já existia, passa a ser desta barbearia. */
  salvarInscricaoAviso(barbeariaId: number, inscricao: { endpoint: string; p256dh: string; auth: string }): void {
    const { endpoint, p256dh, auth } = inscricao;
    if (!/^https:\/\/[^\s]{10,}$/.test(endpoint) || endpoint.length > 1000) throw new ErroAgenda("Aparelho inválido.");
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{10,100}$/.test(auth)) throw new ErroAgenda("Aparelho inválido.");
    const total = (this.db.prepare("SELECT COUNT(*) AS n FROM avisos_inscricoes WHERE barbearia_id = ? AND endpoint <> ?").get(barbeariaId, endpoint) as { n: number }).n;
    if (total >= 10) throw new ErroAgenda("Limite de 10 aparelhos com aviso. Desligue em algum antes.");
    this.db.prepare(`INSERT INTO avisos_inscricoes (endpoint, barbearia_id, p256dh, auth, criado_em) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET barbearia_id = excluded.barbearia_id, p256dh = excluded.p256dh, auth = excluded.auth`)
      .run(endpoint, barbeariaId, p256dh, auth, new Date().toISOString());
  }

  inscricoesAviso(barbeariaId: number): { endpoint: string; p256dh: string; auth: string }[] {
    return this.db.prepare("SELECT endpoint, p256dh, auth FROM avisos_inscricoes WHERE barbearia_id = ?").all(barbeariaId) as { endpoint: string; p256dh: string; auth: string }[];
  }

  /** Remove um aparelho: pelo próprio barbeiro (com barbeariaId) ou quando o serviço de push diz que ele sumiu. */
  removerInscricaoAviso(endpoint: string, barbeariaId?: number): void {
    if (barbeariaId === undefined) this.db.prepare("DELETE FROM avisos_inscricoes WHERE endpoint = ?").run(endpoint);
    else this.db.prepare("DELETE FROM avisos_inscricoes WHERE endpoint = ? AND barbearia_id = ?").run(endpoint, barbeariaId);
  }

  configuracao(chave: string): string | undefined {
    return (this.db.prepare("SELECT valor FROM configuracoes WHERE chave = ?").get(chave) as { valor: string } | undefined)?.valor;
  }

  definirConfiguracao(chave: string, valor: string): void {
    this.db.prepare("INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor").run(chave, valor);
  }

  /** Dados de um agendamento pra montar o aviso (só da própria barbearia). */
  agendamentoParaAviso(barbeariaId: number, id: number): { clienteNome: string; clienteTelefone: string; inicio: string; servico: string; profissional: string; referenciaFoto: string | null } | undefined {
    return this.db.prepare(`SELECT a.cliente_nome AS clienteNome, a.cliente_telefone AS clienteTelefone, a.inicio,
        s.nome || COALESCE(' + ' || a.adicionais_nomes, '') AS servico, p.nome AS profissional, a.referencia_foto AS referenciaFoto
      FROM agendamentos a JOIN servicos s ON s.id = a.servico_id JOIN profissionais p ON p.id = a.profissional_id
      WHERE a.id = ? AND a.barbearia_id = ?`).get(id, barbeariaId) as ReturnType<BancoAgenda["agendamentoParaAviso"]>;
  }
}
