import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gravarFoto, processarFoto } from "@aprenda/agenda";
import { PASTA_CURSOS } from "@aprenda/catalogo";
import { nomeParaMensagem, type Lead } from "@aprenda/prospeccao";
import { obterAgenda } from "./agenda";
import { urlDoSite } from "./membros";
import { obterBanco } from "./painel";

/** Fotos de exemplo (Unsplash) que vêm com o projeto: `data/demo-fotos/fotos.json`. */
const PASTA_FOTOS_DEMO = join(dirname(PASTA_CURSOS), "demo-fotos");

interface FotoDemo { arquivo: string; categoria: string; legenda?: string }

/** Link que vai pro barbeiro: o site com o nome dele e o convite pra virar dono. */
export function linkDaDemonstracao(slug: string, convite: string): string {
  return `${urlDoSite()}/b/${slug}?convite=${encodeURIComponent(convite)}`;
}

/**
 * Monta a demonstração pro lead: site com o nome da barbearia, o estilo escolhido e as fotos de
 * exemplo (passando por `processarFoto`, como qualquer foto). Guarda slug e convite no lead.
 */
export async function criarDemonstracaoParaLead(lead: Lead, tema: string): Promise<string> {
  const agenda = obterAgenda();
  const { barbearia, convite } = agenda.criarDemonstracao({
    nome: nomeParaMensagem(lead.nome),
    tema,
    cidade: lead.cidade ? nomeParaMensagem(lead.cidade) : undefined,
    lead: lead.placeId,
  });
  const fotos = JSON.parse(await readFile(join(PASTA_FOTOS_DEMO, "fotos.json"), "utf8")) as FotoDemo[];
  let capa: string | undefined;
  for (const f of fotos) {
    const proc = await processarFoto(await readFile(join(PASTA_FOTOS_DEMO, f.arquivo)));
    const arquivo = agenda.registrarFoto(barbearia.id, { categoria: f.categoria, legenda: f.legenda, largura: proc.largura, altura: proc.altura });
    gravarFoto(arquivo, proc);
    if (!capa && f.categoria === "ambiente") capa = arquivo;
  }
  const foto = agenda.fotos(barbearia.id).find((f) => f.arquivo === capa);
  if (foto) agenda.definirCapa(barbearia.id, foto.id);
  obterBanco().guardarDemonstracao(lead.placeId, barbearia.slug, convite);
  return linkDaDemonstracao(barbearia.slug, convite);
}
