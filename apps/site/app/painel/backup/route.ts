import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { obterAgenda } from "../../../lib/agenda";
import { exigirLogin } from "../../../lib/painel";

export const dynamic = "force-dynamic";

/** Baixa uma cópia do banco da agenda. Faça isso de vez em quando: é o único backup. */
export async function GET() {
  await exigirLogin();
  const pasta = mkdtempSync(join(tmpdir(), "backup-"));
  const arquivo = join(pasta, "agenda.db");
  try {
    obterAgenda().copiarPara(arquivo);
    const dados = readFileSync(arquivo);
    return new Response(dados, {
      headers: {
        "content-type": "application/vnd.sqlite3",
        "content-disposition": `attachment; filename="agenda-${new Date().toISOString().slice(0, 10)}.db"`,
      },
    });
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}
