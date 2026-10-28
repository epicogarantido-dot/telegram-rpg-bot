import { ErroAgenda } from "@aprenda/agenda";
import { obterAgenda } from "./agenda";
import { chaveEntreApps, modoSite, urlSaas } from "./modo";

/**
 * Venda e entrega em apps separados: o site de leads mostra os exemplos e a prévia, faz o
 * cadastro e recebe o primeiro Pix; quando o admin confirma esse Pix, a barbearia vai pro app
 * do SaaS (rota /api/entrega, com a chave entre os apps), já no ar e com o mesmo e-mail e senha.
 * Lá ficam o site do cliente, a agenda, o painel e as renovações. Com um app só, nada muda.
 */

const chave = (barbeariaId: number) => `entrega:${barbeariaId}`;

/** Endereço do site entregue (no SaaS), se esta barbearia já foi entregue. */
export function entregue(barbeariaId: number): { slug: string; site: string; painel: string } | undefined {
  const salvo = obterAgenda().configuracao(chave(barbeariaId));
  if (!salvo) return undefined;
  const { slug } = JSON.parse(salvo) as { slug: string };
  const saas = urlSaas();
  return { slug, site: `${saas}/b/${slug}`, painel: `${saas}/app/entrar` };
}

/** Este app vende e o SaaS entrega? (site de leads com SAAS_URL) */
export function vendeAqui(): boolean {
  return modoSite() === "leads";
}

/**
 * Manda a barbearia pro SaaS com os dias do Pix confirmado (que fica no histórico de lá). Repetir
 * é seguro (o SaaS devolve a que já existe pelo e-mail). Lança ErroAgenda se o SaaS não respondeu:
 * aí o Pix não é confirmado aqui.
 */
export async function entregarNoSaas(barbeariaId: number, pix: { dias: number; valorCentavos: number; txid: string }): Promise<string> {
  const dados = obterAgenda().dadosParaEntrega(barbeariaId);
  if (!dados) throw new ErroAgenda("Essa barbearia não tem conta de acesso.");
  const r = await fetch(`${urlSaas()}/api/entrega`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-chave": chaveEntreApps() ?? "" },
    body: JSON.stringify({ ...dados, dias: pix.dias, valorCentavos: pix.valorCentavos, txid: pix.txid }),
    signal: AbortSignal.timeout(60_000),
  }).catch(() => undefined);
  const corpo = (await r?.json().catch(() => ({}))) as { slug?: string; erro?: string } | undefined;
  if (!r?.ok || !corpo?.slug) {
    throw new ErroAgenda(corpo?.erro
      ? `O site das barbearias recusou: ${corpo.erro}`
      : "O site das barbearias não respondeu. Confira o SAAS_URL e se a PAINEL_SENHA é a mesma nos dois apps.");
  }
  obterAgenda().definirConfiguracao(chave(barbeariaId), JSON.stringify({ slug: corpo.slug, em: new Date().toISOString() }));
  return corpo.slug;
}
