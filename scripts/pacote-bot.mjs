// Monta o zip do bot de WhatsApp pra Square Cloud (um app separado do site).
//
//   npm run pacote:bot
//
// O código do bot e dos pacotes do monorepo vira um arquivo só (esbuild). As
// dependências de verdade (baileys, pino...) vão prontas em app/node_modules,
// achadas pelo rastreador de arquivos que o Next usa: a Square Cloud não precisa
// baixar nada. Saída: dist/aprenda-livre-bot.zip
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { montarBot } from "./montar-bot.mjs";

const raiz = new URL("..", import.meta.url).pathname;
const destino = join(raiz, "dist/bot");
const zip = join(raiz, "dist/aprenda-livre-bot.zip");
const memoria = process.env.SQUARE_MEMORIA_BOT ?? "256";

rmSync(destino, { recursive: true, force: true });
rmSync(zip, { force: true });
mkdirSync(join(destino, "app"), { recursive: true });

// 1 e 2. Bundle e só as dependências usadas.
console.log("🔨 bundle do bot...");
console.log(`📦 ${await montarBot(raiz, join(destino, "app"))} arquivos de dependências`);

// 3. Cursos (o bot responde buscas no catálogo).
cpSync(join(raiz, "data/cursos"), join(destino, "data/cursos"), { recursive: true });

// 4. Ponto de entrada: carrega o .env e guarda a sessão do WhatsApp em dados/,
// que NÃO vai no zip: um commit novo não desconecta o bot.
writeFileSync(join(destino, "iniciar.mjs"), `import { existsSync } from "node:fs";
import { join } from "node:path";
const aqui = import.meta.dirname;
const env = join(aqui, ".env");
if (existsSync(env)) process.loadEnvFile(env);
process.env.NODE_ENV = "production";
process.env.APRENDA_DADOS ??= join(aqui, "data/cursos");
process.env.BOT_SESSAO ??= join(aqui, "dados/auth") + "/";
await import("./app/bot.mjs");
`);
// package.json na raiz é obrigatório; sem dependências, o npm install do servidor não faz nada.
writeFileSync(join(destino, "package.json"), JSON.stringify({ name: "aprenda-livre-bot", private: true, type: "module", dependencies: {} }, null, 2) + "\n");
writeFileSync(join(destino, "squarecloud.config"), `DISPLAY_NAME=Aprenda Livre Bot
DESCRIPTION=Bot de WhatsApp do Aprenda Livre (só responde)
MAIN=iniciar.mjs
MEMORY=${memoria}
VERSION=recommended
AUTORESTART=true
`);
writeFileSync(join(destino, ".env.example"), `# Copie para .env (ou use as variáveis de ambiente do app na Square Cloud).
SITE_URL=https://aprendalivre.squareweb.app
BOT_NUMERO=5511999999999
# Igual ao BOT_SEGREDO do site.
BOT_SEGREDO=
`);

execFileSync("zip", ["-qr", zip, "."], { cwd: destino });
console.log(`✅ ${relative(process.cwd(), zip) || zip}`);
console.log("Antes de subir: preencha SITE_URL, BOT_NUMERO e BOT_SEGREDO (igual ao do site). Ver docs/deploy-square.md.");
