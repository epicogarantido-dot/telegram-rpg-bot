import { mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { porCardapio } from "@/lib/cardapio";
import { criarSitesDeExemplo, porFotosPadrao, sitesDeExemplo } from "@/lib/exemplos";
import { chaveConfere } from "@/lib/modo";

export const dynamic = "force-dynamic";

/**
 * O site de leads vendeu e o admin confirmou o primeiro Pix lá: a barbearia chega aqui já no ar,
 * com o mesmo e-mail e senha (só o hash vem), as fotos padrão do estilo e o cardápio de barbearia.
 * Só aceita quem manda a chave entre os apps (derivada da PAINEL_SENHA, a mesma nos dois).
 */
export async function POST(req: Request) {
  if (!chaveConfere(req.headers.get("x-chave"))) return new Response(null, { status: 403 });
  const d = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const texto = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : undefined);
  try {
    if (!sitesDeExemplo()[texto("tema") ?? ""]) await criarSitesDeExemplo();
    const { barbearia, nova } = obterAgenda().receberConta({
      nomeBarbearia: texto("nomeBarbearia") ?? "", telefone: texto("telefone") ?? "", tema: texto("tema") ?? "",
      cidade: texto("cidade"), bio: texto("bio"), endereco: texto("endereco"),
      nome: texto("nome") ?? "", email: texto("email") ?? "", senhaHash: texto("senhaHash") ?? "",
      dias: Number(d.dias), valorCentavos: Number(d.valorCentavos), txid: texto("txid") ?? "",
    });
    if (nova) {
      porFotosPadrao(barbearia.id, barbearia.tema);
      porCardapio(barbearia.id);
    }
    return Response.json({ slug: barbearia.slug, nova });
  } catch (e) {
    return Response.json({ erro: mensagemDeErro(e) }, { status: 400 });
  }
}
