import { normalizarTelefone } from "./telefone.ts";

/**
 * Busca de estabelecimentos pela Places API (New) — a forma oficial e
 * permitida de usar dados do Google Maps. Raspar a página do Maps viola os
 * termos do Google e quebra toda hora; não faça.
 *
 * Precisa de GOOGLE_MAPS_API_KEY com a "Places API (New)" ativada.
 * Custo: ver https://developers.google.com/maps/billing-and-pricing/pricing
 */
const URL_BUSCA = "https://places.googleapis.com/v1/places:searchText";
const CAMPOS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

export interface Estabelecimento {
  placeId: string;
  nome: string;
  endereco?: string;
  telefone?: string;
  site?: string;
  nota?: number;
  avaliacoes?: number;
  mapsUrl?: string;
}

interface RespostaPlaces {
  places?: {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    businessStatus?: string;
  }[];
  nextPageToken?: string;
}

export async function buscarEstabelecimentos(
  consulta: string,
  opcoes: { chave: string; maxPaginas?: number; fetch?: typeof fetch },
): Promise<Estabelecimento[]> {
  const f = opcoes.fetch ?? fetch;
  const achados: Estabelecimento[] = [];
  let pageToken: string | undefined;
  for (let pagina = 0; pagina < (opcoes.maxPaginas ?? 3); pagina++) {
    const r = await f(URL_BUSCA, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": opcoes.chave,
        "X-Goog-FieldMask": CAMPOS,
      },
      body: JSON.stringify({ textQuery: consulta, languageCode: "pt-BR", regionCode: "BR", pageSize: 20, pageToken }),
    });
    if (!r.ok) throw new Error(`Places API respondeu ${r.status}: ${await r.text()}`);
    const dados = (await r.json()) as RespostaPlaces;
    for (const p of dados.places ?? []) {
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      achados.push({
        placeId: p.id,
        nome: p.displayName?.text ?? "(sem nome)",
        endereco: p.formattedAddress,
        telefone: normalizarTelefone(p.internationalPhoneNumber),
        site: p.websiteUri,
        nota: p.rating,
        avaliacoes: p.userRatingCount,
        mapsUrl: p.googleMapsUri,
      });
    }
    pageToken = dados.nextPageToken;
    if (!pageToken) break;
  }
  return achados;
}
