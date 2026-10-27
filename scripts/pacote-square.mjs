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

const raiz = new URL("..", import.meta.url).pathname;
const site = join(raiz, "apps/site");
const destino = join(raiz, "dist/square");
const zip = join(raiz, "dist/aprenda-livre-square.zip");
// Pra atualizar um app que já existe: sem squarecloud.config (o app já tem o dele,
// com o subdomínio certo; mandar outro pode fazer o commit não entrar).
const zipCommit = join(raiz, "dist/aprenda-livre-site-commit.zip");

const subdominio = process.env.SQUARE_SUBDOMINIO ?? "aprendalivre";
const memoria = process.env.SQUARE_MEMORIA ?? "512";

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
