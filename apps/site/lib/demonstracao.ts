import { ErroAgenda } from "@aprenda/agenda";
import { nomeParaMensagem, type Lead } from "@aprenda/prospeccao";
import { obterAgenda } from "./agenda";
import { urlDoSite } from "./membros";
import { obterBanco } from "./painel";
import { criarSitesDeExemplo, porFotosPadrao, sitesDeExemplo } from "./exemplos";
import { chaveEntreApps, modoSite, urlSaas } from "./modo";

/** Link que vai pro barbeiro: o site com o nome dele e o convite pra virar dono (no app do SaaS). */
export function linkDaDemonstracao(slug: string, convite: string): string {
  const base = modoSite() === "leads" ? urlSaas() : urlDoSite();
  return `${base}/b/${slug}?convite=${encodeURIComponent(convite)}`;
}

/**
 * Cria a demonstração neste app (onde fica o banco da agenda): site com o nome da barbearia,
 * o estilo escolhido e as fotos padrão do site de exemplo daquele estilo.
 */
export async function criarDemonstracaoAqui(dados: { nome: string; tema: string; cidade?: string; lead?: string }): Promise<{ slug: string; convite: string }> {
  if (!sitesDeExemplo()[dados.tema]) await criarSitesDeExemplo();
  const { barbearia, convite } = obterAgenda().criarDemonstracao(dados);
  porFotosPadrao(barbearia.id, dados.tema);
  return { slug: barbearia.slug, convite };
}

/**
 * Monta a demonstração pro lead e guarda slug e convite nele. Com o site de leads separado
 * do SaaS, pede pro app do SaaS criar (rota /api/demonstracao, com a chave entre os apps).
 */
export async function criarDemonstracaoParaLead(lead: Lead, tema: string): Promise<string> {
  const dados = {
    nome: nomeParaMensagem(lead.nome),
    tema,
    cidade: lead.cidade ? nomeParaMensagem(lead.cidade) : undefined,
    lead: lead.placeId,
  };
  let demo: { slug: string; convite: string };
  if (modoSite() === "leads") {
    const r = await fetch(`${urlSaas()}/api/demonstracao`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-chave": chaveEntreApps() ?? "" },
      body: JSON.stringify(dados),
      signal: AbortSignal.timeout(60_000),
    }).catch(() => undefined);
    if (!r?.ok) throw new ErroAgenda("O site das barbearias não respondeu. Confira o SAAS_URL e se a PAINEL_SENHA é a mesma nos dois apps.");
    demo = (await r.json()) as { slug: string; convite: string };
  } else {
    demo = await criarDemonstracaoAqui(dados);
  }
  obterBanco().guardarDemonstracao(lead.placeId, demo.slug, demo.convite);
  return linkDaDemonstracao(demo.slug, demo.convite);
}
