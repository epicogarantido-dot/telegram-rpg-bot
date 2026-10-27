import { pedidoDoBot } from "@/lib/bot";
import { obterBanco } from "@/lib/painel";

/**
 * Chamado pelo bot: alguém pediu "falar com uma pessoa" e escreveu a dúvida (aparece no
 * /painel), ou alguém da equipe já respondeu pelo celular do bot (`resolvido`).
 */
export async function POST(req: Request) {
  if (!pedidoDoBot(req)) return Response.json({ erro: "não autorizado" }, { status: 401 });
  const corpo = (await req.json().catch(() => ({}))) as { telefone?: unknown; nome?: unknown; duvida?: unknown; resolvido?: unknown };
  if (typeof corpo.telefone !== "string" || !/^\d{10,13}$/.test(corpo.telefone)) {
    return Response.json({ erro: "dados inválidos" }, { status: 400 });
  }
  if (corpo.resolvido === true) obterBanco().resolverAtendimento(corpo.telefone);
  else if (typeof corpo.duvida === "string") obterBanco().pedirPessoa(corpo.telefone, corpo.duvida, typeof corpo.nome === "string" ? corpo.nome : undefined);
  else return Response.json({ erro: "dados inválidos" }, { status: 400 });
  return Response.json({ ok: true });
}
