import type { Estabelecimento } from "./google-places.ts";
import { normalizarTelefone } from "./telefone.ts";

/**
 * Fonte GRATUITA de leads: OpenStreetMap via Overpass API. Não precisa de
 * chave nem cartão. A cobertura de telefone no Brasil é menor que a do
 * Google, mas custa zero. Dados © colaboradores do OpenStreetMap (ODbL):
 * uso interno é livre; se um dia publicar a lista, precisa dar crédito.
 *
 * Política de uso do Overpass: poucas consultas, com User-Agent próprio.
 * Não rode em laço.
 */
const OVERPASS = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";

/** Como cada nicho aparece no OSM. Acrescente nichos aqui. */
export const FILTROS_OSM: Record<string, string[]> = {
  barbearia: [
    '["shop"="barber"]',
    '["shop"="hairdresser"]["hairdresser"~"barber|male",i]',
    '["shop"="hairdresser"]["name"~"barb",i]',
  ],
  salao: ['["shop"="hairdresser"]', '["shop"="beauty"]'],
  manicure: ['["shop"="beauty"]["beauty"~"nails",i]', '["shop"="beauty"]["name"~"unha|nail|manicure",i]'],
  petshop: ['["shop"="pet"]', '["shop"="pet_grooming"]'],
  academia: ['["leisure"="fitness_centre"]'],
  oficina: ['["shop"="car_repair"]'],
};

/** Escapa aspas pra montar a consulta com segurança. */
function texto(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function montarConsulta(nicho: string, cidade: string): string {
  const filtros = FILTROS_OSM[nicho];
  if (!filtros) throw new Error(`Nicho "${nicho}" sem filtro OSM. Disponíveis: ${Object.keys(FILTROS_OSM).join(", ")}`);
  // Municípios brasileiros são admin_level 8 no OSM.
  return `[out:json][timeout:60];
area["boundary"="administrative"]["admin_level"="8"]["name"="${texto(cidade)}"]->.cidade;
(
${filtros.map((f) => `  nwr${f}(area.cidade);`).join("\n")}
);
out center tags;`;
}

interface ElementoOSM {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
}

export async function buscarNoOSM(
  nicho: string,
  cidade: string,
  opcoes: { fetch?: typeof fetch } = {},
): Promise<Estabelecimento[]> {
  const f = opcoes.fetch ?? fetch;
  const r = await f(OVERPASS, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "aprenda-livre-prospeccao/0.1" },
    body: new URLSearchParams({ data: montarConsulta(nicho, cidade) }).toString(),
  });
  if (!r.ok) throw new Error(`Overpass respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const { elements = [] } = (await r.json()) as { elements?: ElementoOSM[] };

  const vistos = new Set<string>();
  const achados: Estabelecimento[] = [];
  for (const e of elements) {
    const id = `osm:${e.type}/${e.id}`;
    if (vistos.has(id) || !e.tags?.name) continue;
    vistos.add(id);
    const t = e.tags;
    const tel = t["contact:whatsapp"] ?? t["mobile"] ?? t["contact:mobile"] ?? t["phone"] ?? t["contact:phone"];
    const endereco = [t["addr:street"], t["addr:housenumber"], t["addr:suburb"], t["addr:city"]].filter(Boolean).join(", ");
    achados.push({
      placeId: id,
      nome: t.name,
      // Campo pode ter vários números separados por ";": fica com o primeiro.
      telefone: normalizarTelefone(tel?.split(";")[0]),
      endereco: endereco || undefined,
      site: t.website ?? t["contact:website"] ?? t["contact:instagram"],
      mapsUrl: `https://www.openstreetmap.org/${e.type}/${e.id}`,
    });
  }
  return achados;
}
