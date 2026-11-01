import sharp from "sharp";
import { lerFoto, type Barbearia } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";
import { barbeariaDoApp } from "@/lib/barbearia-do-app";
import { soEntrega } from "@/lib/modo";

/**
 * SaaS: o site e o painel da barbearia viram apps no celular (instalados pelo navegador, sem loja).
 * Nome, cor e ícone são os da barbearia: o ícone é a foto de capa; o do painel leva um selo de
 * agenda no canto, pra o barbeiro não confundir os dois na tela.
 */
export type TipoApp = "site" | "painel";

/** Fundo e destaque de cada estilo (os mesmos de app/(barbearias)/temas.css). */
const CORES: Record<string, { fundo: string; destaque: string; sobre: string }> = {
  silencioso: { fundo: "#ffffff", destaque: "#111111", sobre: "#ffffff" },
  atemporal: { fundo: "#ffffff", destaque: "#000000", sobre: "#ffffff" },
  cerimonia: { fundo: "#120b14", destaque: "#ffffff", sobre: "#120b14" },
  tecnico: { fundo: "#f7f8fa", destaque: "#0f1d3a", sobre: "#ffffff" },
  potencia: { fundo: "#0a0a0a", destaque: "#d7ff1e", sobre: "#0a0a0a" },
  extravagancia: { fundo: "#0c0b09", destaque: "#c9a54b", sobre: "#0c0b09" },
};
export const coresDoTema = (tema: string) => CORES[tema] ?? CORES.silencioso!;

/** A barbearia deste app (só no SaaS). */
export function barbeariaInstalavel(): Barbearia | undefined {
  return soEntrega() ? barbeariaDoApp() : undefined;
}

/** Nome curto pra embaixo do ícone (o celular corta o que passar de ~12 letras). */
function nomeCurto(nome: string): string {
  if (nome.length <= 12) return nome;
  const semBarbearia = nome.replace(/^barbearia\s+/i, "");
  return semBarbearia.length <= 12 ? semBarbearia : semBarbearia.split(/\s+/)[0]!.slice(0, 12);
}

export function manifesto(b: Barbearia, tipo: TipoApp) {
  const { fundo } = coresDoTema(b.tema);
  const site = tipo === "site";
  const icone = (t: string) => `/icone-app/${tipo}-${t}.png?v=${versaoDoIcone(b)}`;
  return {
    name: site ? b.nome : `Agenda · ${b.nome}`,
    short_name: site ? nomeCurto(b.nome) : "Agenda",
    description: site ? `Marque seu horário na ${b.nome}.` : `Agenda e avisos da ${b.nome}.`,
    id: site ? "/" : "/app",
    start_url: site ? "/" : "/app",
    scope: site ? "/" : "/app",
    display: "standalone",
    background_color: fundo,
    theme_color: fundo,
    lang: "pt-BR",
    icons: [
      { src: icone("192"), sizes: "192x192", type: "image/png" },
      { src: icone("512"), sizes: "512x512", type: "image/png" },
      { src: icone("512-mascara"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

/** Muda quando a capa muda: o celular busca o ícone novo. */
export function versaoDoIcone(b: Barbearia): string {
  const capa = fotoDaCapa(b);
  return (capa ?? b.tema).slice(-8);
}

function fotoDaCapa(b: Barbearia): string | undefined {
  const fotos = obterAgenda().fotos(b.id);
  return (fotos.find((f) => f.capa) ?? fotos.find((f) => f.categoria === "ambiente") ?? fotos[0])?.arquivo;
}

const escapar = (t: string) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Ícone quadrado em PNG: a capa (ou a inicial do nome) e, no painel, o selo de agenda. */
export async function iconeDoApp(b: Barbearia, tipo: TipoApp, tamanho: number, mascara: boolean): Promise<Buffer> {
  const cores = coresDoTema(b.tema);
  // Ícone "maskable": o celular recorta em círculo ou gota, então o desenho fica nos 80% do meio.
  const miolo = mascara ? Math.round(tamanho * 0.8) : tamanho;
  const capa = fotoDaCapa(b);
  const foto = capa ? lerFoto(`${capa}.webp`) : undefined;
  let base = foto
    ? await sharp(foto).resize(miolo, miolo, { fit: "cover", position: "attention" }).png().toBuffer()
    : await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${miolo}" height="${miolo}"><rect width="100%" height="100%" fill="${cores.destaque}"/>` +
      `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${Math.round(miolo * 0.5)}" fill="${cores.sobre}">${escapar(b.nome.replace(/^barbearia\s+/i, "").charAt(0).toUpperCase() || "B")}</text></svg>`,
    )).png().toBuffer();
  if (mascara) {
    const borda = Math.round((tamanho - miolo) / 2);
    base = await sharp(base).extend({ top: borda, bottom: tamanho - miolo - borda, left: borda, right: tamanho - miolo - borda, background: cores.fundo }).png().toBuffer();
  }
  if (tipo === "site") return base;
  // Selo de agenda no canto (dentro da área segura quando é maskable).
  const r = Math.round(tamanho * 0.17);
  const cx = mascara ? Math.round(tamanho * 0.72) : tamanho - r - Math.round(tamanho * 0.04);
  const cy = cx;
  const l = Math.round(r * 0.95);
  const selo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${cores.destaque}" stroke="${cores.fundo}" stroke-width="${Math.max(2, Math.round(r * 0.12))}"/>
    <rect x="${cx - l / 2}" y="${cy - l / 2.4}" width="${l}" height="${l * 0.85}" rx="${l * 0.12}" fill="none" stroke="${cores.sobre}" stroke-width="${Math.max(2, l * 0.11)}"/>
    <line x1="${cx - l / 2}" y1="${cy - l / 8}" x2="${cx + l / 2}" y2="${cy - l / 8}" stroke="${cores.sobre}" stroke-width="${Math.max(2, l * 0.11)}"/>
    <line x1="${cx - l / 4}" y1="${cy - l / 1.6}" x2="${cx - l / 4}" y2="${cy - l / 3.2}" stroke="${cores.sobre}" stroke-width="${Math.max(2, l * 0.11)}" stroke-linecap="round"/>
    <line x1="${cx + l / 4}" y1="${cy - l / 1.6}" x2="${cx + l / 4}" y2="${cy - l / 3.2}" stroke="${cores.sobre}" stroke-width="${Math.max(2, l * 0.11)}" stroke-linecap="round"/>
    <circle cx="${cx - l / 4}" cy="${cy + l / 5}" r="${l * 0.06}" fill="${cores.sobre}"/>
    <circle cx="${cx}" cy="${cy + l / 5}" r="${l * 0.06}" fill="${cores.sobre}"/>
    <circle cx="${cx + l / 4}" cy="${cy + l / 5}" r="${l * 0.06}" fill="${cores.sobre}"/>
  </svg>`);
  return sharp(base).composite([{ input: selo }]).png().toBuffer();
}
