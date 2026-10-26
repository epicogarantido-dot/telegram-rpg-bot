// Monta o zip pra subir o site na Square Cloud.
//
//   npm run pacote:square
//
// Usa o build "standalone" do Next: o zip já leva o servidor e só as
// dependências usadas, então a Square Cloud não precisa rodar npm install
// nem build (menos memória, sobe mais rápido). Saída: dist/aprenda-livre-square.zip
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { montarBot } from "./montar-bot.mjs";

const raiz = new URL("..", import.meta.url).pathname;
const site = join(raiz, "apps/site");
const destino = join(raiz, "dist/square");
const zip = join(raiz, "dist/aprenda-livre-square.zip");
// Pra atualizar um app que já existe: sem squarecloud.config (o app já tem o dele,
// com o subdomínio certo; mandar outro pode fazer o commit não entrar).
const zipCommit = join(raiz, "dist/aprenda-livre-site-commit.zip");

const subdominio = process.env.SQUARE_SUBDOMINIO ?? "aprendalivre";
// Site (~350 MB) + bot de WhatsApp (~150 MB) no mesmo app.
const memoria = process.env.SQUARE_MEMORIA ?? "768";

console.log("🔨 build do site...");
execFileSync("npm", ["run", "build:site"], { cwd: raiz, stdio: "inherit" });

rmSync(destino, { recursive: true, force: true });
rmSync(zip, { force: true });
rmSync(zipCommit, { force: true });
mkdirSync(destino, { recursive: true });

cpSync(join(site, ".next/standalone"), destino, { recursive: true });
// A Square Cloud descarta o node_modules da RAIZ do zip e roda npm install
// no lugar (docs: runtimes/introduction). Movendo pra apps/node_modules, o
// Node ainda acha os pacotes (sobe pastas a partir de apps/site/server.js)
// e nada é baixado no servidor.
renameSync(join(destino, "node_modules"), join(destino, "apps/node_modules"));
// package.json na raiz é obrigatório (senão INVALID_DEPENDENCY); sem
// dependências, o npm install do servidor não faz nada.
writeFileSync(join(destino, "package.json"), JSON.stringify({ name: "aprenda-livre-site", private: true, dependencies: {} }, null, 2) + "\n");
cpSync(join(site, ".next/static"), join(destino, "apps/site/.next/static"), { recursive: true });
if (existsSync(join(site, "public"))) cpSync(join(site, "public"), join(destino, "apps/site/public"), { recursive: true });
cpSync(join(raiz, "data/cursos"), join(destino, "data/cursos"), { recursive: true });
// A Revista também: páginas refeitas no servidor (revalidate) leem os artigos do disco.
cpSync(join(raiz, "data/artigos"), join(destino, "data/artigos"), { recursive: true });
// Bot de WhatsApp junto: o iniciar.cjs liga ele quando BOT_NUMERO está no .env.
console.log("🤖 bot de WhatsApp...");
await montarBot(raiz, join(destino, "bot"));
// Fotos de exemplo das demonstrações (lidas na hora de montar, pelo painel).
cpSync(join(raiz, "data/demo-fotos"), join(destino, "data/demo-fotos"), { recursive: true });

// Ponto de entrada: carrega o .env (se existir), fixa porta 80 (exigida
// pela Square Cloud pra sites) e sobe o servidor do Next.
writeFileSync(join(destino, "iniciar.cjs"), `const fs = require("node:fs");
const path = require("node:path");
process.chdir(__dirname);
const env = path.join(__dirname, ".env");
if (fs.existsSync(env)) process.loadEnvFile(env);
process.env.PORT ??= "80";
process.env.HOSTNAME ??= "0.0.0.0";
process.env.NODE_ENV = "production";
// Dados (agenda, leads) ficam em data/privado/, que NÃO vai no zip:
// assim um novo upload não apaga o banco. Faça backup em /painel/backup.
process.env.APRENDA_DADOS ??= path.join(__dirname, "data/cursos");
process.env.AGENDA_DB ??= path.join(__dirname, "data/privado/agenda.db");
process.env.PROSPECCAO_DB ??= path.join(__dirname, "data/privado/prospeccao.db");
process.env.MEMBROS_DB ??= path.join(__dirname, "data/privado/membros.db");
process.env.FOTOS_DIR ??= path.join(__dirname, "data/privado/fotos");
process.env.APRENDA_RAIZ ??= __dirname;
// Cache das páginas que o próprio Next grava enquanto roda. Não vem no zip, então um
// commit não troca nem apaga: sem limpar, home e Revista ficavam presas no 1º deploy.
// Apagar a cada início é seguro (ele refaz sozinho).
fs.rmSync(path.join(__dirname, "apps/site/.next/server/route-cache"), { recursive: true, force: true });

// ---------- Bot de WhatsApp, no mesmo app ----------
// Liga só com BOT_NUMERO (o chip do bot). O site mostra esse número no "Entrar pelo
// WhatsApp", e o segredo entre os dois, se não vier no .env, é sorteado a cada início
// (os dois processos recebem o mesmo). A sessão do WhatsApp fica em data/privado/whatsapp,
// fora do zip: commit e reinício não desconectam.
const numeroBot = (process.env.BOT_NUMERO ?? "").replace(/\D/g, "");
if (numeroBot) {
  process.env.BOT_WHATSAPP ??= numeroBot;
  if ((process.env.BOT_SEGREDO ?? "").length < 24) process.env.BOT_SEGREDO = require("node:crypto").randomBytes(32).toString("base64url");
  const pastaWhats = path.join(__dirname, "data/privado/whatsapp");
  fs.mkdirSync(pastaWhats, { recursive: true });
  // O /painel lê o estado da conexão daqui.
  process.env.BOT_PASTA = pastaWhats;
  let espera = 5_000;
  let bot;
  const ligarBot = () => {
    const inicio = Date.now();
    bot = require("node:child_process").spawn(process.execPath, [path.join(__dirname, "bot/bot.mjs")], {
      cwd: path.join(__dirname, "bot"),
      env: { ...process.env, BOT_SESSAO: path.join(pastaWhats, "auth") + "/", SITE_INTERNO: "http://127.0.0.1:" + process.env.PORT },
      stdio: "inherit",
    });
    bot.on("exit", (codigo) => {
      // Caiu: liga de novo, esperando mais a cada queda seguida (até 5 min).
      espera = Date.now() - inicio > 10 * 60_000 ? 5_000 : Math.min(espera * 2, 5 * 60_000);
      console.log("🤖 Bot parou (código " + codigo + "); ligando de novo em " + espera / 1000 + " s.");
      setTimeout(ligarBot, espera);
    });
  };
  for (const sinal of ["SIGTERM", "SIGINT"]) process.once(sinal, () => { bot?.kill(); process.exit(0); });
  // Dá tempo do site subir antes do bot começar a chamar a API.
  setTimeout(ligarBot, 3_000);
} else {
  console.log("🤖 Bot de WhatsApp desligado (coloque BOT_NUMERO no .env pra ligar).");
}

process.chdir(path.join(__dirname, "apps/site"));
require("./apps/site/server.js");
`);

writeFileSync(join(destino, "squarecloud.config"), `DISPLAY_NAME=Aprenda Livre
DESCRIPTION=Cursos gratuitos e agenda online para barbearias
MAIN=iniciar.cjs
MEMORY=${memoria}
VERSION=recommended
SUBDOMAIN=${subdominio}
AUTORESTART=true
`);

cpSync(join(raiz, ".env.example"), join(destino, ".env.example"));

// Versão no ar: abra /api/versao depois de reiniciar pra conferir.
const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: raiz }).toString().trim();
const versao = `${commit} · gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;
writeFileSync(join(destino, "VERSAO.txt"), versao + "\n");

execFileSync("zip", ["-qr", zip, "."], { cwd: destino });
execFileSync("zip", ["-qr", zipCommit, ".", "-x", "squarecloud.config"], { cwd: destino });
console.log(`✅ ${zip} (primeiro envio: Upload)`);
console.log(`✅ ${zipCommit} (atualizar o app que já existe: Commit e reiniciar)`);
console.log(`Versão: ${versao}`);
console.log("Antes de subir: crie o .env (copie de .env.example) com PAINEL_SENHA e os dados do Pix. Ver docs/deploy-square.md.");
