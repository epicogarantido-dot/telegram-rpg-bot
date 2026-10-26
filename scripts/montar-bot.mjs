// Monta o bot de WhatsApp numa pasta pronta pra rodar sem npm install:
// pasta/bot.mjs (bot + pacotes do monorepo num arquivo só, via esbuild) e
// pasta/node_modules (só as dependências que ele usa, achadas pelo rastreador
// de arquivos que o Next usa). Usado pelo zip do site (bot junto) e pelo zip
// só do bot.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { build } from "esbuild";

/** Dependências npm do bot: ficam fora do bundle e vão como estão. */
const EXTERNAS = ["baileys", "pino", "qrcode-terminal", "@hapi/boom"];

export async function montarBot(raiz, pasta) {
  // Bundle dentro do repositório, pra o rastreador achar o node_modules da raiz.
  const temporario = join(raiz, "apps/bot/.pacote");
  rmSync(temporario, { recursive: true, force: true });
  const bundle = join(temporario, "bot.mjs");
  await build({
    entryPoints: [join(raiz, "apps/bot/src/index.ts")],
    outfile: bundle,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    external: EXTERNAS,
    // Pacotes CommonJS dentro do bundle ESM ainda chamam require().
    banner: { js: 'import { createRequire as __criarRequire } from "node:module"; const require = __criarRequire(import.meta.url);' },
    logLevel: "warning",
  });

  const requireDoNext = createRequire(join(raiz, "apps/site/package.json"));
  const { nodeFileTrace } = requireDoNext("next/dist/compiled/@vercel/nft");
  const { fileList } = await nodeFileTrace([bundle], { base: raiz });
  mkdirSync(pasta, { recursive: true });
  let copiados = 0;
  for (const arquivo of fileList) {
    if (!arquivo.startsWith("node_modules/")) continue;
    const alvo = join(pasta, arquivo);
    mkdirSync(dirname(alvo), { recursive: true });
    cpSync(join(raiz, arquivo), alvo, { dereference: true });
    copiados++;
  }
  cpSync(bundle, join(pasta, "bot.mjs"));
  rmSync(temporario, { recursive: true, force: true });
  return copiados;
}
