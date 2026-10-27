import { mensagemDeErro } from "@/lib/agenda";
import { criarDemonstracaoAqui } from "@/lib/demonstracao";
import { chaveConfere } from "@/lib/modo";

export const dynamic = "force-dynamic";

/**
 * O painel de leads (em outro app) pede uma demonstração pra um lead. Só aceita quem manda a
 * chave entre os apps (derivada da PAINEL_SENHA, a mesma nos dois).
 */
export async function POST(req: Request) {
  if (!chaveConfere(req.headers.get("x-chave"))) return new Response(null, { status: 403 });
  const d = (await req.json().catch(() => ({}))) as { nome?: unknown; tema?: unknown; cidade?: unknown; lead?: unknown };
  if (typeof d.nome !== "string" || typeof d.tema !== "string") return Response.json({ erro: "nome e tema" }, { status: 400 });
  try {
    return Response.json(await criarDemonstracaoAqui({
      nome: d.nome.slice(0, 60), tema: d.tema,
      cidade: typeof d.cidade === "string" ? d.cidade.slice(0, 60) : undefined,
      lead: typeof d.lead === "string" ? d.lead.slice(0, 200) : undefined,
    }));
  } catch (e) {
    return Response.json({ erro: mensagemDeErro(e) }, { status: 400 });
  }
}
