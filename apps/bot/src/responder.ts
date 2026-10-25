import { buscarCursos, normalizar, type Curso } from "@aprenda/catalogo";

/**
 * Cérebro do bot: texto entra, texto sai. Não sabe nada de WhatsApp —
 * por isso dá pra testar sem número e trocar de transporte depois
 * (API oficial, Telegram, site) sem reescrever nada.
 */
export interface Contexto {
  cursos: Curso[];
  siteUrl: string;
}

const MENU = `📚 *Aprenda Livre* — cursos gratuitos do mundo todo, em português.

Comandos:
• *buscar* <assunto> — ex.: _buscar javascript_
• *areas* — lista as áreas disponíveis
• *curso* <código> — detalhes de um curso
• *menu* — mostra esta mensagem`;

export function responder(textoRecebido: string, ctx: Contexto): string | null {
  const texto = textoRecebido.trim();
  if (!texto) return null;
  const [comandoBruto = "", ...resto] = texto.split(/\s+/);
  const comando = normalizar(comandoBruto).replace(/^[!/]/, "");
  const arg = resto.join(" ");

  switch (comando) {
    case "oi":
    case "ola":
    case "menu":
    case "ajuda":
    case "start":
      return MENU;
    case "areas":
      return listarAreas(ctx);
    case "buscar":
    case "busca":
      return arg ? buscar(arg, ctx) : "Diga o assunto. Ex.: *buscar python*";
    case "curso":
      return arg ? detalhar(arg, ctx) : "Diga o código do curso. Ex.: *curso fundamentos-desenvolvimento-web*";
    default:
      // Mensagem livre vira busca: quem escreve "quero aprender inglês" quer achar curso.
      return buscar(texto, ctx, true);
  }
}

function linkCurso(c: Curso, ctx: Contexto): string {
  return `${ctx.siteUrl.replace(/\/$/, "")}/cursos/${c.slug}`;
}

function listarAreas(ctx: Contexto): string {
  const contagem = new Map<string, number>();
  for (const c of ctx.cursos) contagem.set(c.area, (contagem.get(c.area) ?? 0) + 1);
  if (contagem.size === 0) return "Ainda não há cursos publicados. Volte em breve!";
  const linhas = [...contagem].sort().map(([area, n]) => `• ${area} (${n})`);
  return `🗂️ *Áreas*\n${linhas.join("\n")}\n\nUse *buscar <área>* pra ver os cursos.`;
}

function buscar(consulta: string, ctx: Contexto, implicita = false): string {
  const achados = buscarCursos(ctx.cursos, consulta, 5);
  if (achados.length === 0) {
    return implicita
      ? `Não entendi 🤔 — e não achei curso sobre "${consulta}".\n\nMande *menu* pra ver os comandos.`
      : `Não achei curso sobre "${consulta}" ainda. Tente outro termo ou mande *areas*.`;
  }
  const linhas = achados.map((c) => `• *${c.titulo}* (${c.nivel})\n  código: ${c.slug}\n  ${linkCurso(c, ctx)}`);
  return `🔎 Cursos sobre "${consulta}":\n\n${linhas.join("\n\n")}`;
}

function detalhar(slug: string, ctx: Contexto): string {
  const c = ctx.cursos.find((x) => x.slug === normalizar(slug));
  if (!c) return `Não existe curso com o código "${slug}". Use *buscar* pra encontrar.`;
  const licoes = c.modulos.reduce((n, m) => n + m.licoes.length, 0);
  const modulos = c.modulos.map((m, i) => `${i + 1}. ${m.titulo} (${m.licoes.length} lições)`).join("\n");
  return [
    `🎓 *${c.titulo}*`,
    c.resumo,
    `Nível: ${c.nivel} · ${c.modulos.length} módulos · ${licoes} lições`,
    modulos,
    `Original: ${c.fonte.nome} (${c.fonte.licenca})`,
    `👉 ${linkCurso(c, ctx)}`,
  ].join("\n\n");
}
