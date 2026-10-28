import { nomeParaMensagem, type Lead } from "@aprenda/prospeccao";
import { obterAgenda } from "./agenda";
import { urlDoSite } from "./membros";
import { obterBanco } from "./painel";
import { criarSitesDeExemplo, porFotosPadrao, sitesDeExemplo } from "./exemplos";

/** Link que vai pro barbeiro: o site com o nome dele e o convite pra virar dono (neste app, onde se vende). */
export function linkDaDemonstracao(slug: string, convite: string): string {
  return `${urlDoSite()}/b/${slug}?convite=${encodeURIComponent(convite)}`;
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

/** Monta a demonstração pro lead e guarda slug e convite nele. */
export async function criarDemonstracaoParaLead(lead: Lead, tema: string): Promise<string> {
  const demo = await criarDemonstracaoAqui({
    nome: nomeParaMensagem(lead.nome),
    tema,
    cidade: lead.cidade ? nomeParaMensagem(lead.cidade) : undefined,
    lead: lead.placeId,
  });
  obterBanco().guardarDemonstracao(lead.placeId, demo.slug, demo.convite);
  return linkDaDemonstracao(demo.slug, demo.convite);
}
