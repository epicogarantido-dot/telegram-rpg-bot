import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

/**
 * Qual versão está no ar (gravada pelo pacote da Square Cloud em VERSAO.txt).
 * Serve pra conferir se um commit novo entrou mesmo depois de reiniciar.
 */
export function GET() {
  const arquivo = join(process.env.APRENDA_RAIZ ?? process.cwd(), "VERSAO.txt");
  const versao = existsSync(arquivo) ? readFileSync(arquivo, "utf8").trim() : "desenvolvimento";
  return new Response(`${versao}\nNode ${process.version}\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
