/**
 * Banco de fotos de exemplo (data/demo-fotos), que vai junto do site e enche as prévias e os
 * sites de exemplo. Aparecem SEM crédito no site da barbearia, então só entra foto que não
 * exige atribuição: CC0 ou domínio público (via Openverse), ou Unsplash (licença própria, já
 * usada nas primeiras 12).
 *
 *   NODE_USE_ENV_PROXY=1 node scripts/fotos-demo.mjs buscar "barbershop ritual" folha.png
 *     → lista e gera uma folha de contato numerada pra escolher olhando
 *   NODE_USE_ENV_PROXY=1 node scripts/fotos-demo.mjs baixar <id-openverse> <categoria> ["legenda"]
 *     → grava data/demo-fotos/<categoria>-<id>.jpg (lado maior 1600px, sem metadados) e soma no fotos.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const API = "https://api.openverse.org/v1/images/";
const PASTA = join(dirname(fileURLToPath(import.meta.url)), "../../../data/demo-fotos");
const CATEGORIAS = ["ambiente", "degrade", "corte", "barba", "navalhado", "infantil", "sobrancelha", "produtos", "equipe"];

async function json(url) {
  for (let tentativa = 1; ; tentativa++) {
    const r = await fetch(url).catch((e) => ({ ok: false, status: e.message }));
    if (r.ok) return r.json();
    if (tentativa === 4) throw new Error(`HTTP ${r.status} em ${url}`);
    await new Promise((ok) => setTimeout(ok, 1500 * tentativa));
  }
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "buscar") {
  const [q, folha] = args;
  const d = await json(`${API}?${new URLSearchParams({ q, page_size: "20", license: "cc0,pdm", ...(args[2] ? { source: args[2] } : {}) })}`);
  d.results.forEach((i, n) => console.log(n + 1, i.id, i.license, `${i.width}x${i.height}`, i.source, "|", i.title.slice(0, 70)));
  if (folha && d.results.length) {
    const minis = await Promise.all(d.results.map(async (i, n) => {
      const r = await fetch(`${API}${i.id}/thumb/`).catch(() => undefined);
      const rot = Buffer.from(`<svg width="300" height="200"><rect width="44" height="34" fill="#000"/><text x="6" y="25" font-size="22" fill="#fff" font-family="sans-serif">${n + 1}</text></svg>`);
      try {
        return await sharp(Buffer.from(await r.arrayBuffer())).resize(300, 200, { fit: "cover" }).composite([{ input: rot }]).png().toBuffer();
      } catch {
        return sharp({ create: { width: 300, height: 200, channels: 3, background: "#ccc" } }).composite([{ input: rot }]).png().toBuffer();
      }
    }));
    await sharp({ create: { width: 1200, height: 200 * Math.ceil(minis.length / 4), channels: 3, background: "#fff" } })
      .composite(minis.map((m, n) => ({ input: m, left: (n % 4) * 300, top: Math.floor(n / 4) * 200 }))).png().toFile(folha);
    console.log("folha:", folha);
  }
} else if (cmd === "baixar") {
  const [id, categoria, legenda] = args;
  if (!CATEGORIAS.includes(categoria)) throw new Error(`Categoria: ${CATEGORIAS.join(", ")}`);
  const i = await json(`${API}${id}/`);
  if (i.license !== "cc0" && i.license !== "pdm") throw new Error(`Licença ${i.license}: aqui só CC0 ou domínio público (a foto vai sem crédito).`);
  const r = await fetch(i.url);
  if (!r.ok) throw new Error(`HTTP ${r.status} baixando ${i.url}`);
  const arquivo = `${categoria}-${id.slice(0, 8)}.jpg`;
  await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(join(PASTA, arquivo));
  const lista = JSON.parse(readFileSync(join(PASTA, "fotos.json"), "utf8"));
  if (!lista.some((f) => f.arquivo === arquivo)) {
    lista.push({ arquivo, categoria, ...(legenda ? { legenda } : {}), credito: i.foreign_landing_url, licenca: i.license === "cc0" ? "CC0" : "Domínio público" });
    writeFileSync(join(PASTA, "fotos.json"), JSON.stringify(lista, null, 2) + "\n");
  }
  console.log("gravada:", arquivo, "|", i.title, "|", i.license);
} else {
  console.log("Uso: buscar <termo> [folha.png] | baixar <id> <categoria> [legenda]");
}
