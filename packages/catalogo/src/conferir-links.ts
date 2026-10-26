/**
 * Abre cada link externo das matérias e cursos e lista os que não respondem.
 * Uso: npm run conferir:links            (tudo)
 *      npm run conferir:links -- <slug>  (só uma matéria ou curso)
 * Atrás de proxy, rode com NODE_USE_ENV_PROXY=1 (o Node não usa HTTPS_PROXY sozinho).
 */
import { carregarArtigos, carregarCursos } from "./carregar.ts";

const filtro = process.argv[2];
const artigos = (await carregarArtigos()).filter((a) => !filtro || a.slug === filtro);
const cursos = (await carregarCursos()).filter((c) => !filtro || c.slug === filtro);

const links = new Map<string, Set<string>>();
function anotar(url: string, onde: string) {
  if (!url.startsWith("http")) return;
  if (!links.has(url)) links.set(url, new Set());
  links.get(url)!.add(onde);
}
const doMarkdown = (texto: string) => [...texto.matchAll(/\]\((https?:[^)\s]+)\)/g)].map((m) => m[1]!);

for (const a of artigos) {
  for (const f of a.fontes) anotar(f.url, a.slug);
  for (const u of doMarkdown(a.conteudo)) anotar(u, a.slug);
}
for (const c of cursos) {
  if (c.fonte.url) anotar(c.fonte.url, c.slug);
  for (const m of c.modulos) for (const l of m.licoes) {
    if (l.urlOriginal) anotar(l.urlOriginal, c.slug);
    for (const u of doMarkdown(l.conteudo)) anotar(u, `${c.slug}/${l.id}`);
  }
}

async function status(url: string): Promise<number | string> {
  try {
    // Alguns sites recusam HEAD; GET com corpo descartado resolve.
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Mozilla/5.0 (conferir-links Aprenda Livre)" } });
    await r.body?.cancel();
    return r.status;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const lista = [...links.keys()];
const problemas: string[] = [];
for (let i = 0; i < lista.length; i += 8) {
  const lote = lista.slice(i, i + 8);
  const resultados = await Promise.all(lote.map(status));
  lote.forEach((url, j) => {
    const s = resultados[j]!;
    // 403/429: o site bloqueia robô, mas o link existe; vale abrir na mão.
    const ok = typeof s === "number" && (s < 400 || s === 403 || s === 429);
    if (!ok) problemas.push(`${s}  ${url}\n     em: ${[...links.get(url)!].join(", ")}`);
  });
}

console.log(`${lista.length} links conferidos.`);
if (problemas.length) {
  console.log(`\n${problemas.length} com problema:\n${problemas.join("\n")}`);
  process.exitCode = 1;
} else console.log("Todos responderam.");
