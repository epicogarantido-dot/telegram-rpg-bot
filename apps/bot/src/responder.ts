import { buscarCursos, normalizar, type Curso } from "@aprenda/catalogo";

/**
 * Cérebro do bot: texto entra, resposta sai. Não sabe nada de WhatsApp —
 * por isso dá pra testar sem número e trocar de transporte depois
 * (API oficial, Telegram, site) sem reescrever nada.
 *
 * Conversa em árvore com opções numeradas ("responda 1, 2, 3"). Botões de
 * verdade só existem na API oficial do WhatsApp (paga); na conexão não oficial
 * eles não chegam ou aumentam o risco de banimento, e número funciona em
 * qualquer celular. Cada resposta leva no máximo UM link.
 */
export interface Contexto {
  cursos: Curso[];
  siteUrl: string;
}

/** Em que ponto da árvore a conversa está. Fica na memória do bot, por conversa. */
export type Sessao =
  | { tela: "menu"; desde: number; erros?: number }
  | { tela: "cursos"; desde: number; lista: string[]; erros?: number }
  | { tela: "curso"; desde: number; slug: string; erros?: number }
  /** `anotou`: a dúvida já foi pro painel; daqui em diante o bot só repassa, calado. */
  | { tela: "pessoa"; desde: number; anotou?: boolean; atendendo?: boolean };

/** O que o transporte faz com a resposta. */
export type Resposta =
  | { tipo: "texto"; texto: string }
  | { tipo: "entrada" } // gerar o link de entrada (o site responde)
  | { tipo: "sair" } // opt-out permanente
  // vai pra lista "esperando uma pessoa" do painel; `texto` só na primeira (o bot confirma)
  | { tipo: "pessoa"; duvida: string; texto?: string };

/** Conversa parada há mais que isso volta pro começo. */
export const SESSAO_MIN = 30;
/** Depois de pedir uma pessoa, o bot fica quieto nessa conversa por esse tempo. */
export const PESSOA_HORAS = 12;
/** Quantos cursos cabem numa lista (o resto se acha escrevendo o assunto). */
const MAX_LISTA = 8;

/** Palavras de opt-out: quem manda isso nunca mais é contatado. */
export function ehPedidoDeSaida(texto: string): boolean {
  return ["sair", "parar", "pare", "stop", "descadastrar", "remover"].includes(limpar(texto));
}

/**
 * Quem escreve isso quer entrar no site: o bot responde direto com o link de entrada.
 * É a mensagem pronta do botão "Entrar pelo WhatsApp" ("Quero entrar no Aprenda Livre")
 * e pedidos explícitos. Saudação ("oi") abre o menu, onde entrar é a opção 1.
 */
export function ehPedidoDeEntrada(texto: string): boolean {
  const t = limpar(texto);
  if (["entrar", "entra", "acessar", "acesso", "login", "link", "novo link"].includes(t)) return true;
  return ["quero entrar", "aprenda livre", "meu codigo", "manda o link", "me manda o link", "quero acessar", "link de entrada"].some((f) => t.includes(f));
}

export const RESPOSTA_SAIDA = "Pronto, você não vai mais receber mensagens nossas. Desculpe o incômodo e bom trabalho! 🙏";

function limpar(texto: string): string {
  return normalizar(texto.trim()).replace(/[!?.,;:]/g, " ").replace(/\s+/g, " ").trim();
}

const texto = (t: string): Resposta => ({ tipo: "texto", texto: t });

/** Primeiro nome do perfil do WhatsApp, se parecer nome de gente ("João", não "🔥JV🔥"). */
function primeiroNome(nome?: string): string | undefined {
  const p = nome?.trim().split(/\s+/)[0];
  return p && /^[\p{L}'-]{2,20}$/u.test(p) ? p[0]!.toUpperCase() + p.slice(1).toLowerCase() : undefined;
}

function menu(saudacao = true, nome?: string): string {
  const quem = primeiroNome(nome);
  return [
    saudacao
      ? `Oi${quem ? `, ${quem}` : ""}! 👋 Aqui é o atendimento automático do *Aprenda Livre*: cursos grátis pra quem trabalha com barbearia.`
      : "*Menu*",
    "",
    "Responda com o número:",
    "*1* · Entrar no site (receber meu link)",
    "*2* · Ver os cursos",
    "*3* · Revista (notícias e curiosidades)",
    "*4* · Site e agenda pra minha barbearia",
    "*5* · Falar com uma pessoa",
    "*0* · Não quero mais mensagens",
  ].join("\n");
}

const RODAPE = "\n\n*9* · voltar ao menu";

function url(ctx: Contexto, caminho: string): string {
  return `${ctx.siteUrl.replace(/\/$/, "")}${caminho}`;
}

/**
 * Responde uma mensagem. Devolve a resposta (ou null pra ficar quieto) e a sessão
 * nova da conversa. `agora` em ms (pra testar).
 */
export function responder(recebido: string, ctx: Contexto, sessao?: Sessao, agora = Date.now(), nome?: string): { resposta: Resposta | null; sessao: Sessao } {
  const t = limpar(recebido);
  // Sessão velha vale como conversa nova.
  const ativa = sessao && agora - sessao.desde < (sessao.tela === "pessoa" ? PESSOA_HORAS * 60 : SESSAO_MIN) * 60_000 ? sessao : undefined;
  const ir = (s: Sessao, r: Resposta | null) => ({ resposta: r, sessao: s });
  const noMenu = (r: Resposta | null) => ir({ tela: "menu", desde: agora }, r);

  if (!t) return ir(ativa ?? { tela: "menu", desde: agora }, null);
  if (ehPedidoDeSaida(recebido) || (t === "0" && ativa?.tela === "menu")) return noMenu({ tipo: "sair" });
  if (ehPedidoDeEntrada(recebido)) return noMenu({ tipo: "entrada" });
  if (["menu", "inicio", "voltar", "ajuda", "start"].includes(t.replace(/^[/!]/, ""))) return noMenu(texto(menu(false)));

  // Pediu uma pessoa: a primeira mensagem é a dúvida (vai pro painel, o bot confirma);
  // depois disso o bot fica calado e só repassa, até pedirem o menu (acima) ou mandarem 9.
  if (ativa?.tela === "pessoa") {
    if (t === "9") return noMenu(texto(menu(false)));
    // Alguém da equipe já está conversando: o bot não se mete nem reabre o pedido.
    if (ativa.atendendo) return ir(ativa, null);
    if (ativa.anotou) return ir({ ...ativa }, { tipo: "pessoa", duvida: recebido.trim() });
    return ir({ ...ativa, anotou: true }, {
      tipo: "pessoa",
      duvida: recebido.trim(),
      texto: "Anotado ✅ Uma pessoa da equipe vai responder aqui mesmo, assim que puder. Pode mandar mais detalhes se quiser.\n\n_(Pra voltar ao menu automático, mande *menu*.)_",
    });
  }

  // Sem conversa em andamento: um número de 1 a 5 vale como opção do menu (o bot pode ter
  // reiniciado no meio); o resto abre o menu ("oi", "bom dia", pergunta solta).
  if (!ativa) return opcaoDoMenu(t, ctx, agora) ?? buscaOuMenu(t, ctx, agora, true, nome);

  if (t === "9") return noMenu(texto(menu(false)));

  switch (ativa.tela) {
    case "menu":
      return opcaoDoMenu(t, ctx, agora) ?? buscaOuMenu(t, ctx, agora, false, nome, ativa.erros ?? 0);
    case "cursos": {
      const n = Number(t);
      const slug = Number.isInteger(n) && n >= 1 ? ativa.lista[n - 1] : undefined;
      const curso = slug && ctx.cursos.find((c) => c.slug === slug);
      if (curso) return ir({ tela: "curso", desde: agora, slug: curso.slug }, texto(detalhe(curso, ctx)));
      return buscaOuRepete(t, ctx, agora, ativa);
    }
    case "curso":
      if (t === "1") return noMenu({ tipo: "entrada" });
      if (t === "2") return listarCursos(ctx, agora);
      return buscaOuRepete(t, ctx, agora, ativa);
  }
}

function opcaoDoMenu(t: string, ctx: Contexto, agora: number): { resposta: Resposta; sessao: Sessao } | undefined {
  const menuSessao: Sessao = { tela: "menu", desde: agora };
  switch (t) {
    case "1":
      return { resposta: { tipo: "entrada" }, sessao: menuSessao };
    case "2":
      return listarCursos(ctx, agora);
    case "3":
      return {
        resposta: texto(`📰 *Revista da barbearia*: notícias do mercado, a série Barbearias pelo mundo e curiosidades da profissão. Tudo aberto, sem precisar entrar.\n\n${url(ctx, "/revista")}${RODAPE}`),
        sessao: menuSessao,
      };
    case "4":
      return {
        resposta: texto(
          "💈 *Site e agenda pra sua barbearia*\n\nSeu cliente vê seus cortes, vê os horários livres e marca sozinho, 24 horas. " +
            "Você recebe aviso no celular, lembra os clientes da véspera e vê quanto entrou no mês. Pagamento por Pix, sem cartão.\n\n" +
            `Veja os estilos e o preço: ${url(ctx, "/barbeiros")}` +
            "\n\n*5* · tirar uma dúvida com uma pessoa" +
            RODAPE,
        ),
        sessao: menuSessao,
      };
    case "5":
      return {
        resposta: texto("Certo! 🙋 Escreva sua dúvida aqui que uma pessoa da equipe responde assim que puder.\n\n_(Pra voltar ao menu automático, mande *menu*.)_"),
        sessao: { tela: "pessoa", desde: agora },
      };
    default:
      return undefined;
  }
}

function listarCursos(ctx: Contexto, agora: number): { resposta: Resposta; sessao: Sessao } {
  if (ctx.cursos.length === 0) return { resposta: texto(`Ainda não há cursos publicados. Volte em breve!${RODAPE}`), sessao: { tela: "menu", desde: agora } };
  // Os de barbearia primeiro: é pra quem esse bot fala.
  const ordem = [...ctx.cursos].sort((a, b) => Number(b.tags.includes("barbearia")) - Number(a.tags.includes("barbearia")));
  const lista = ordem.slice(0, MAX_LISTA);
  const linhas = lista.map((c, i) => `*${i + 1}* · ${c.titulo}`);
  const mais = ctx.cursos.length > lista.length ? `\n\n_Tem mais ${ctx.cursos.length - lista.length}: escreva o assunto (ex.: *marketing*)._` : "";
  return {
    resposta: texto(`📚 *Cursos grátis*\n\nResponda o número pra ver o curso:\n${linhas.join("\n")}${mais}${RODAPE}`),
    sessao: { tela: "cursos", desde: agora, lista: lista.map((c) => c.slug) },
  };
}

/** Texto solto: se parece assunto de curso, devolve uma lista numerada (sem links); senão, o menu. */
function buscaOuMenu(t: string, ctx: Contexto, agora: number, saudacao: boolean, nome?: string, erros = 0): { resposta: Resposta; sessao: Sessao } {
  const achou = assunto(t, ctx);
  if (achou.length > 0) return listaDaBusca(achou, agora);
  if (saudacao) return { resposta: texto(menu(true, nome)), sessao: { tela: "menu", desde: agora } };
  const opcoes = menu(false).split("\n").slice(3).join("\n");
  return { resposta: texto(naoEntendi(erros + 1, opcoes)), sessao: { tela: "menu", desde: agora, erros: erros + 1 } };
}

/**
 * "Não entendi" que muda: repetir a mesma frase irrita. Na terceira vez seguida o menu
 * claramente não está ajudando, e o bot oferece uma pessoa.
 */
function naoEntendi(vez: number, opcoes: string): string {
  if (vez >= 3) return "Parece que o menu não está ajudando 😅 Quer falar com uma pessoa da equipe? Responda *5*.\n\nOu *9* pra ver o menu de novo.";
  if (vez === 2) return `Ainda não peguei 🙏 Por aqui eu funciono com números. Escolha um:\n\n${opcoes}`;
  return `Não entendi 🤔 Responda só com o número de uma opção:\n\n${opcoes}`;
}

/** Numa lista ou num curso, texto que não é opção: tenta como assunto; senão lembra as opções. */
function buscaOuRepete(t: string, ctx: Contexto, agora: number, ativa: Extract<Sessao, { tela: "cursos" | "curso" }>): { resposta: Resposta; sessao: Sessao } {
  const achou = assunto(t, ctx);
  if (achou.length > 0) return listaDaBusca(achou, agora);
  const erros = (ativa.erros ?? 0) + 1;
  if (erros >= 3) return { resposta: texto(naoEntendi(3, "")), sessao: { tela: "menu", desde: agora, erros: 0 } };
  const dica = ativa.tela === "curso" ? "*1* pra entrar e começar, *2* pra ver outros cursos ou *9* pro menu." : "o número de um curso da lista ou *9* pro menu.";
  return { resposta: texto(`${erros === 1 ? "Não entendi 🤔" : "Ainda não peguei 🙏"} Responda ${dica}`), sessao: { ...ativa, desde: agora, erros } };
}

/** Palavras de conversa que não dizem o assunto ("oi, tudo bem", "quero um curso"). */
const PALAVRAS_DE_CONVERSA = new Set(("tudo bem bom boa dia tarde noite obrigado obrigada valeu blz beleza quero queria gostaria " +
  "saber sobre como fazer curso cursos aula aulas aprender quanto custa preco valor voce voces pode podem favor ainda " +
  "certo isso esse essa aqui alguem algum alguma tenho tem estou esta").split(" "));

/** Texto solto como assunto de curso: só palavras de verdade, e só cursos com ela no título ou na área. */
function assunto(t: string, ctx: Contexto): Curso[] {
  const termos = t.split(" ").filter((p) => p.length >= 4 && !/^\d+$/.test(p) && !PALAVRAS_DE_CONVERSA.has(p));
  if (termos.length === 0) return [];
  return buscarCursos(ctx.cursos, termos.join(" "), 5).filter((c) => {
    const onde = normalizar([c.titulo, c.area, ...c.tags].join(" "));
    return termos.some((p) => onde.includes(p));
  });
}

function listaDaBusca(achou: Curso[], agora: number): { resposta: Resposta; sessao: Sessao } {
  const linhas = achou.map((c, i) => `*${i + 1}* · ${c.titulo}`);
  return {
    resposta: texto(`🔎 Achei ${achou.length === 1 ? "este curso" : "estes cursos"}. Responda o número:\n${linhas.join("\n")}${RODAPE}`),
    sessao: { tela: "cursos", desde: agora, lista: achou.map((c) => c.slug) },
  };
}

function detalhe(c: Curso, ctx: Contexto): string {
  const licoes = c.modulos.reduce((n, m) => n + m.licoes.length, 0);
  return [
    `🎓 *${c.titulo}*`,
    c.resumo,
    `${c.modulos.length} módulos · ${licoes} lições · grátis`,
    `👉 ${url(ctx, `/cursos/${c.slug}`)}`,
    "*1* · entrar no site pra fazer as lições\n*2* · ver outros cursos\n*9* · voltar ao menu",
  ].join("\n\n");
}

/**
 * Áudio, foto, figurinha, vídeo, documento: o bot não lê. Responde uma vez pedindo texto;
 * na conversa com uma pessoa fica calado (quem atende vê a mídia no celular).
 */
export function responderMidia(sessao?: Sessao, agora = Date.now()): { resposta: Resposta | null; sessao: Sessao } {
  const ativa = sessao && agora - sessao.desde < (sessao.tela === "pessoa" ? PESSOA_HORAS * 60 : SESSAO_MIN) * 60_000 ? sessao : undefined;
  if (ativa?.tela === "pessoa") {
    return { resposta: ativa.anotou || ativa.atendendo ? null : { tipo: "pessoa", duvida: "[mandou áudio, foto ou arquivo]" }, sessao: { ...ativa, anotou: true } };
  }
  return {
    resposta: texto("Por aqui eu só leio texto 🙏 Responda com o número de uma opção, ou *5* pra falar com uma pessoa (ela ouve o seu áudio).\n\n" + menu(false).split("\n").slice(3).join("\n")),
    sessao: { tela: "menu", desde: agora },
  };
}

/** Alguém da equipe respondeu pelo celular do bot: o bot sai da frente nessa conversa. */
export function sessaoComPessoa(agora = Date.now()): Sessao {
  return { tela: "pessoa", desde: agora, anotou: true, atendendo: true };
}
