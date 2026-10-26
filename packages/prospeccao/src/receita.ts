import { Readable, Transform, type TransformCallback } from "node:stream";
import { createInterface } from "node:readline";
import { createInflateRaw } from "node:zlib";
import { ehCelularBR, normalizarTelefone } from "./telefone.ts";

/**
 * Fonte OFICIAL e GRATUITA de leads: os dados abertos do CNPJ que a Receita
 * Federal publica todo mês (empresas ativas, nome fantasia, endereço, telefone
 * e e-mail cadastrados). Nada de raspar site: é um arquivo público do governo.
 *
 * Os arquivos são grandes (≈5 GB de estabelecimentos), então tudo é lido em
 * fluxo: baixa, descompacta e filtra linha a linha, sem gravar o arquivo.
 * Layout: https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf
 *
 * LGPD: muitos registros são de MEI (pessoa física). Guardamos só o necessário
 * pro contato comercial, e o opt-out (SAIR) é permanente. Ver docs/prospeccao.md.
 */
export const RECEITA_WEBDAV = "https://arquivos.receitafederal.gov.br/public.php/webdav/Dados/Cadastros/CNPJ";
/** "Usuário" do compartilhamento público da Receita (muda raramente; ver docs/prospeccao.md). */
export const RECEITA_COMPARTILHAMENTO = process.env.RECEITA_COMPARTILHAMENTO ?? "gn672Ad4CF8N6TK";

/** Como cada nicho aparece na Receita: atividade (CNAE) e palavras no nome que confirmam o nicho. */
export const NICHOS_RECEITA: Record<string, { cnaes: string[]; nome: RegExp; descricao: string }> = {
  barbearia: { cnaes: ["9602501"], nome: /barb/i, descricao: "Cabeleireiros, manicure e pedicure (9602-5/01)" },
};

export interface EstabelecimentoReceita {
  cnpj: string;
  cnpjBasico: string;
  nomeFantasia?: string;
  /** Preenchido na segunda passada (arquivo de Empresas). */
  razaoSocial?: string;
  cnaePrincipal: string;
  cnaesSecundarios: string[];
  abertura?: string;
  endereco?: string;
  bairro?: string;
  uf: string;
  municipio: string;
  telefones: string[];
  email?: string;
}

/** Uma linha do CSV da Receita: campos entre aspas, separados por ";". */
export function lerLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let i = 0;
  while (i <= linha.length) {
    if (linha[i] === '"') {
      let valor = "";
      i++;
      for (;;) {
        const fim = linha.indexOf('"', i);
        if (fim < 0) { valor += linha.slice(i); i = linha.length; break; }
        valor += linha.slice(i, fim);
        i = fim + 1;
        if (linha[i] === '"') { valor += '"'; i++; continue; }
        break;
      }
      campos.push(valor);
      i++; // pula o ";"
    } else {
      const fim = linha.indexOf(";", i);
      campos.push(linha.slice(i, fim < 0 ? linha.length : fim));
      i = fim < 0 ? linha.length + 1 : fim + 1;
    }
  }
  return campos;
}

function data(aaaammdd: string | undefined): string | undefined {
  return aaaammdd && /^\d{8}$/.test(aaaammdd) ? `${aaaammdd.slice(0, 4)}-${aaaammdd.slice(4, 6)}-${aaaammdd.slice(6)}` : undefined;
}

function telefone(ddd: string | undefined, numero: string | undefined): string | undefined {
  if (!ddd?.trim() || !numero?.trim()) return undefined;
  let n = numero.replace(/\D/g, "");
  // Celular antigo cadastrado com 8 dígitos (começando com 6-9): ganha o 9 na frente.
  if (n.length === 8 && /^[6-9]/.test(n)) n = `9${n}`;
  return normalizarTelefone(`${ddd.replace(/\D/g, "").slice(-2)}${n}`);
}

/** Converte uma linha do arquivo de Estabelecimentos. Só devolve empresa ATIVA (situação 02). */
export function estabelecimentoDaLinha(campos: string[]): EstabelecimentoReceita | undefined {
  const [basico, ordem, dv, , fantasia, situacao, , , , , inicio, cnae, cnaesSec, tipoLog, logradouro, numero, complemento,
    bairro, , uf, municipio, ddd1, tel1, ddd2, tel2, , , email] = campos;
  if (situacao !== "02" || !basico || !ordem || !dv) return undefined;
  const telefones = [telefone(ddd1, tel1), telefone(ddd2, tel2)].filter((t): t is string => !!t);
  const endereco = [[tipoLog, logradouro].filter(Boolean).join(" "), numero, complemento].map((p) => p?.trim()).filter(Boolean).join(", ");
  return {
    cnpj: `${basico}${ordem}${dv}`,
    cnpjBasico: basico,
    nomeFantasia: fantasia?.trim() || undefined,
    cnaePrincipal: cnae ?? "",
    cnaesSecundarios: (cnaesSec ?? "").split(",").filter(Boolean),
    abertura: data(inicio),
    endereco: endereco || undefined,
    bairro: bairro?.trim() || undefined,
    uf: uf ?? "",
    municipio: municipio ?? "",
    telefones: [...new Set(telefones)],
    email: email?.trim().toLowerCase() || undefined,
  };
}

/** A empresa é do nicho? Atividade principal ou secundária. */
export function ehDoNicho(e: EstabelecimentoReceita, nicho: string): boolean {
  const n = NICHOS_RECEITA[nicho];
  if (!n) throw new Error(`Nicho "${nicho}" sem regra na Receita. Disponíveis: ${Object.keys(NICHOS_RECEITA).join(", ")}`);
  return n.cnaes.includes(e.cnaePrincipal) || e.cnaesSecundarios.some((c) => n.cnaes.includes(c));
}

/** O nome (fantasia ou razão social) confirma o nicho? Ex.: "barbearia", "barber". */
export function nomeConfirmaNicho(e: EstabelecimentoReceita, nicho: string): boolean {
  const n = NICHOS_RECEITA[nicho]!;
  return n.nome.test(e.nomeFantasia ?? "") || n.nome.test(e.razaoSocial ?? "");
}

/**
 * Telefone de contador: o mesmo número cadastrado em várias empresas da cidade
 * quase sempre é do escritório de contabilidade, não do dono.
 */
export function telefonesDeContador(contagem: Map<string, Set<string>>, minimo = 3): Set<string> {
  return new Set([...contagem].filter(([, empresas]) => empresas.size >= minimo).map(([t]) => t));
}

export function melhorTelefone(telefones: string[], deContador: Set<string>): { telefone?: string; celular: boolean; contador: boolean } {
  const proprios = telefones.filter((t) => !deContador.has(t));
  const escolhido = proprios.find(ehCelularBR) ?? proprios[0] ?? telefones.find(ehCelularBR) ?? telefones[0];
  return { telefone: escolhido, celular: !!escolhido && ehCelularBR(escolhido), contador: !!escolhido && deContador.has(escolhido) };
}

// ---------- leitura em fluxo dos .zip da Receita ----------

/**
 * Tira o cabeçalho do primeiro arquivo de dentro do .zip e entrega só os dados
 * comprimidos (deflate). Cada .zip da Receita tem exatamente um CSV.
 */
class CabecalhoZip extends Transform {
  private buffer = Buffer.alloc(0);
  private pular = -1;
  override _transform(pedaco: Buffer, _: BufferEncoding, pronto: TransformCallback): void {
    if (this.pular === 0) return pronto(null, pedaco);
    this.buffer = Buffer.concat([this.buffer, pedaco]);
    if (this.pular < 0) {
      if (this.buffer.length < 30) return pronto();
      if (this.buffer.readUInt32LE(0) !== 0x04034b50) return pronto(new Error("Não é um arquivo .zip"));
      if (this.buffer.readUInt16LE(8) !== 8) return pronto(new Error("Compressão do .zip não suportada"));
      this.pular = 30 + this.buffer.readUInt16LE(26) + this.buffer.readUInt16LE(28);
    }
    if (this.buffer.length < this.pular) return pronto();
    const resto = this.buffer.subarray(this.pular);
    this.pular = 0;
    this.buffer = Buffer.alloc(0);
    pronto(null, resto);
  }
}

/** Baixa um .zip da Receita e entrega as linhas do CSV (latin1), sem gravar nada em disco. */
export async function* linhasDoArquivo(mes: string, arquivo: string, opcoes: { fetch?: typeof fetch } = {}): AsyncGenerator<string> {
  const f = opcoes.fetch ?? fetch;
  const auth = Buffer.from(`${RECEITA_COMPARTILHAMENTO}:`).toString("base64");
  const r = await f(`${RECEITA_WEBDAV}/${mes}/${arquivo}`, { headers: { authorization: `Basic ${auth}` } });
  if (!r.ok || !r.body) throw new Error(`Receita respondeu ${r.status} pra ${mes}/${arquivo}`);
  const origem = Readable.fromWeb(r.body as never);
  const inflar = createInflateRaw();
  // O .zip termina com o índice depois dos dados: quando o deflate acaba, paramos de baixar.
  inflar.on("end", () => origem.destroy());
  origem.on("error", (e) => inflar.destroy(e));
  inflar.setEncoding("latin1");
  origem.pipe(new CabecalhoZip()).pipe(inflar);
  for await (const linha of createInterface({ input: inflar, crlfDelay: Infinity })) yield linha;
}

/** Último mês publicado (pasta AAAA-MM mais recente). */
export async function ultimoMes(opcoes: { fetch?: typeof fetch } = {}): Promise<string> {
  const f = opcoes.fetch ?? fetch;
  const auth = Buffer.from(`${RECEITA_COMPARTILHAMENTO}:`).toString("base64");
  const r = await f(`${RECEITA_WEBDAV}/`, { method: "PROPFIND", headers: { authorization: `Basic ${auth}`, depth: "1" } });
  const meses = [...(await r.text()).matchAll(/\/(\d{4}-\d{2})\//g)].map((m) => m[1]!).sort();
  if (!meses.length) throw new Error("Não achei os meses publicados pela Receita (o endereço pode ter mudado).");
  return meses.at(-1)!;
}

/** Códigos de município da Receita (não são os do IBGE) com esse nome. */
export async function codigosDoMunicipio(mes: string, nome: string, opcoes: { fetch?: typeof fetch } = {}): Promise<string[]> {
  const alvo = semAcento(nome).toUpperCase();
  const codigos: string[] = [];
  for await (const linha of linhasDoArquivo(mes, "Municipios.zip", opcoes)) {
    const [codigo, nomeMun] = lerLinhaCsv(linha);
    if (codigo && semAcento(nomeMun ?? "").toUpperCase() === alvo) codigos.push(codigo);
  }
  return codigos;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

export interface ResultadoReceita {
  mes: string;
  achados: (EstabelecimentoReceita & { telefone?: string; celular: boolean; telefoneDeContador: boolean; nomeConfirma: boolean })[];
  totalNaCidade: number;
}

/** Roda `tarefa` pra cada item com no máximo `limite` ao mesmo tempo. */
async function emParalelo<T>(itens: T[], limite: number, tarefa: (item: T) => Promise<void>): Promise<void> {
  const fila = [...itens];
  await Promise.all(Array.from({ length: Math.min(limite, fila.length) }, async () => {
    for (let item = fila.shift(); item !== undefined; item = fila.shift()) await tarefa(item);
  }));
}

/**
 * Passa pelos 10 arquivos de Estabelecimentos ao mesmo tempo (a Receita limita a
 * velocidade por conexão, então em paralelo é ~10x mais rápido) e depois pelos de
 * Empresas, pra pegar a razão social. Cada passada lê o Brasil inteiro, então dá pra
 * pedir várias cidades da mesma UF de uma vez sem custo extra. Leva uns 15-20 min.
 */
export async function buscarNaReceita(
  nicho: string, cidades: string | string[], uf: string,
  opcoes: { fetch?: typeof fetch; mes?: string; aoAvancar?: (msg: string) => void; conexoes?: number } = {},
): Promise<Map<string, ResultadoReceita>> {
  const avisar = opcoes.aoAvancar ?? (() => {});
  const conexoes = opcoes.conexoes ?? 10;
  const lista = Array.isArray(cidades) ? cidades : [cidades];
  const mes = opcoes.mes ?? (await ultimoMes(opcoes));
  const ufAlvo = uf.toUpperCase();

  // código do município da Receita → nome da cidade pedida
  const cidadeDoCodigo = new Map<string, string>();
  for (const cidade of lista) {
    const codigos = await codigosDoMunicipio(mes, cidade, opcoes);
    if (!codigos.length) throw new Error(`Município "${cidade}" não encontrado na tabela da Receita.`);
    for (const c of codigos) cidadeDoCodigo.set(c, cidade);
  }
  // Filtro rápido antes de quebrar a linha: o código do município aparece entre aspas.
  const marcas = [...cidadeDoCodigo.keys()].map((c) => `"${c}"`);

  const porCidade = new Map(lista.map((c) => [c, { doNicho: [] as EstabelecimentoReceita[], total: 0, telefones: new Map<string, Set<string>>() }]));
  let prontos = 0;
  await emParalelo([...Array(10).keys()], conexoes, async (i) => {
    for await (const linha of linhasDoArquivo(mes, `Estabelecimentos${i}.zip`, opcoes)) {
      if (!marcas.some((m) => linha.includes(m))) continue;
      const e = estabelecimentoDaLinha(lerLinhaCsv(linha));
      const cidade = e && e.uf === ufAlvo ? cidadeDoCodigo.get(e.municipio) : undefined;
      if (!e || !cidade) continue;
      const c = porCidade.get(cidade)!;
      c.total++;
      for (const t of e.telefones) {
        if (!c.telefones.has(t)) c.telefones.set(t, new Set());
        c.telefones.get(t)!.add(e.cnpjBasico);
      }
      if (ehDoNicho(e, nicho)) c.doNicho.push(e);
    }
    avisar(`Estabelecimentos: ${++prontos}/10 arquivos`);
  });

  // Razão social de todas: confirma o nicho pelo nome e é o único nome do MEI sem fantasia.
  const porBasico = new Map<string, EstabelecimentoReceita[]>();
  for (const { doNicho } of porCidade.values()) for (const e of doNicho) porBasico.set(e.cnpjBasico, [...(porBasico.get(e.cnpjBasico) ?? []), e]);
  if (porBasico.size) {
    prontos = 0;
    await emParalelo([...Array(10).keys()], conexoes, async (i) => {
      for await (const linha of linhasDoArquivo(mes, `Empresas${i}.zip`, opcoes)) {
        const lista = porBasico.get(linha.slice(1, 9));
        if (!lista) continue;
        const [, razao] = lerLinhaCsv(linha);
        for (const e of lista) e.razaoSocial = razao?.trim();
      }
      avisar(`Empresas (razão social): ${++prontos}/10 arquivos`);
    });
  }

  const resultados = new Map<string, ResultadoReceita>();
  for (const [cidade, c] of porCidade) {
    const deContador = telefonesDeContador(c.telefones);
    resultados.set(cidade, {
      mes, totalNaCidade: c.total,
      achados: c.doNicho.map((e) => {
        const m = melhorTelefone(e.telefones, deContador);
        return { ...e, telefone: m.telefone, celular: m.celular, telefoneDeContador: m.contador, nomeConfirma: nomeConfirmaNicho(e, nicho) };
      }),
    });
  }
  return resultados;
}

/** MEI vem como "12.345.678 FULANO DE TAL": tira o número do começo. */
export function nomeDeExibicao(e: Pick<EstabelecimentoReceita, "nomeFantasia" | "razaoSocial" | "cnpj">): string {
  const razao = e.razaoSocial?.replace(/^[\d.\s]+/, "").trim();
  return e.nomeFantasia || razao || `CNPJ ${e.cnpj}`;
}
