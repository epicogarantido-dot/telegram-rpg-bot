import { LINK_HORAS } from "@aprenda/membros";
import { pedidoDoBot } from "@/lib/bot";
import { mensagemMembro, obterMembros, urlDoSite } from "@/lib/membros";

/**
 * Chamado pelo bot quando alguém escreve pedindo pra entrar. O número vem do próprio
 * WhatsApp (quem mandou a mensagem), então já está provado: cria a conta no primeiro
 * contato e devolve o texto da resposta com o link de entrada.
 * Protegido por segredo compartilhado (BOT_SEGREDO): sem ele, ninguém de fora gera link.
 */
export async function POST(req: Request) {
  if (!pedidoDoBot(req)) return Response.json({ erro: "não autorizado" }, { status: 401 });
  const corpo = (await req.json().catch(() => ({}))) as { telefone?: unknown; nome?: unknown };
  if (typeof corpo.telefone !== "string" || !/^\d{12,13}$/.test(corpo.telefone)) {
    return Response.json({ erro: "dados inválidos" }, { status: 400 });
  }
  const nome = typeof corpo.nome === "string" ? corpo.nome.slice(0, 120) : undefined;
  try {
    const r = obterMembros().linkDeEntrada(corpo.telefone, nome);
    const primeiro = r.nome === "Aluno" ? "" : `, ${r.nome.split(" ")[0]}`;
    const mensagem = [
      r.novo ? `Oi${primeiro}! 👋 Sua conta no Aprenda Livre está pronta.` : `Oi${primeiro}! 👋 Aqui está seu acesso.`,
      "",
      "Toque no link e você já entra, sem senha:",
      `${urlDoSite()}/e/${r.token}`,
      "",
      `Ele funciona uma vez e vale por ${LINK_HORAS} horas. Precisando de outro, é só mandar *entrar* aqui.`,
    ].join("\n");
    return Response.json({ ok: true, mensagem });
  } catch (e) {
    return Response.json({ ok: false, mensagem: mensagemMembro(e) });
  }
}
