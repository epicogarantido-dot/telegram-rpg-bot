/**
 * Foto de abertura de uma matéria da Revista, a partir do Openverse (catálogo de imagens com
 * licença aberta: Flickr, Wikimedia e outros). Baixa, recorta em 3:2, converte pra WebP sem
 * metadados e imprime o bloco "imagem" pro JSON da matéria.
 *
 *   node scripts/foto-materia.mjs buscar "barber pole"        # lista candidatas
 * Atrás de proxy: NODE_USE_ENV_PROXY=1 node scripts/foto-materia.mjs ...
 *   node scripts/foto-materia.mjs <slug> <id-do-openverse> [top|bottom|attention]  # grava public/revista/<slug>.webp
 *
 * Só aceita licença que permite uso comercial e modificação (CC0, domínio público, CC BY, CC BY-SA).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const API = "https://api.openverse.org/v1/images/";
const ROTULO = { cc0: "CC0", pdm: "Domínio público", by: "CC BY", "by-sa": "CC BY-SA" };

/** A API do Openverse às vezes devolve 500/504; tenta de novo antes de desistir. */
async function json(url) {
  for (let tentativa = 1; ; tentativa++) {
    const r = await fetch(url).catch((e) => ({ ok: false, status: e.message }));
    if (r.ok) return r.json();
    if (tentativa === 4) throw new Error(`HTTP ${r.status} em ${url}`);
    await new Promise((ok) => setTimeout(ok, 1500 * tentativa));
  }
}

function licenca(i) {
  const base = ROTULO[i.license];
  if (!base) throw new Error(`Licença ${i.license} não serve (precisa permitir uso comercial e modificação).`);
  return i.license === "cc0" || i.license === "pdm" ? base : `${base} ${i.license_version}`;
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "buscar") {
  const d = await json(`${API}?${new URLSearchParams({ q: arg, page_size: "12", license_type: "commercial,modification" })}`);
  d.results.forEach((i, n) => console.log(`${n + 1}. ${i.id}  ${i.license}${i.license_version ?? ""}  ${i.width}x${i.height}  ${i.provider}  ${i.title.slice(0, 60)}  | ${i.creator}`));
  // Folha de contato numerada pra escolher olhando (3º argumento: onde salvar o PNG).
  const folha = process.argv[4];
  if (folha && d.results.length) {
    const miniaturas = await Promise.all(d.results.map(async (i, n) => {
      const r = await fetch(`${API}${i.id}/thumb/`).catch(() => undefined);
      const base = r?.ok ? sharp(Buffer.from(await r.arrayBuffer())) : sharp({ create: { width: 300, height: 200, channels: 3, background: "#ccc" } });
      const rotulo = Buffer.from(`<svg width="300" height="200"><rect width="44" height="34" fill="#000"/><text x="8" y="25" font-size="22" fill="#fff" font-family="sans-serif">${n + 1}</text></svg>`);
      return base.resize(300, 200, { fit: "cover" }).composite([{ input: rotulo }]).png().toBuffer();
    }));
    await sharp({ create: { width: 1200, height: 200 * Math.ceil(miniaturas.length / 4), channels: 3, background: "#fff" } })
      .composite(miniaturas.map((m, n) => ({ input: m, left: (n % 4) * 300, top: Math.floor(n / 4) * 200 }))).png().toFile(folha);
  }
} else {
  const [slug, id] = [cmd, arg];
  if (!/^[a-z0-9-]+$/.test(slug ?? "") || !id) throw new Error("Uso: node scripts/foto-materia.mjs <slug> <id>");
  const i = await json(`${API}${id}/`);
  const rotulo = licenca(i);
  const r = await fetch(i.url);
  if (!r.ok) throw new Error(`Não baixou a foto: HTTP ${r.status} (${i.url})`);
  const pasta = join(import.meta.dirname, "..", "public", "revista");
  mkdirSync(pasta, { recursive: true });
  const original = sharp(Buffer.from(await r.arrayBuffer())).rotate();
  const { width = 1200, height = 800 } = await original.metadata();
  // 3:2 de até 1200 px de largura, sem aumentar foto pequena (fica borrada).
  const largura = Math.min(1200, width, Math.floor((height * 3) / 2));
  const recorte = process.argv[4] ?? "attention";
  const saida = await original.resize(largura, Math.round((largura * 2) / 3), { fit: "cover", position: recorte })
    .webp({ quality: 78 }).toBuffer();
  writeFileSync(join(pasta, `${slug}.webp`), saida);
  console.log(JSON.stringify({
    arquivo: `/revista/${slug}.webp`,
    alt: "",
    credito: `${i.creator ?? "autor desconhecido"}, via ${i.provider === "flickr" ? "Flickr" : i.provider === "wikimedia" ? "Wikimedia Commons" : i.source}`,
    licenca: rotulo,
    fonte: i.foreign_landing_url,
  }, null, 2));
  console.error(`✓ public/revista/${slug}.webp (${Math.round(saida.length / 1024)} KB) — título original: ${i.title}`);
}
