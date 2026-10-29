import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exigirBarbeiro, obterAgenda } from "@/lib/agenda";
import { soEntrega } from "@/lib/modo";

export const dynamic = "force-dynamic";

/**
 * SaaS (um app por barbeiro): o banco do app é só desta barbearia, então o próprio barbeiro baixa
 * a cópia (clientes, horários, serviços). Fora do SaaS a cópia é do admin, em /painel/backup.
 */
export async function GET() {
  if (!soEntrega()) return new Response(null, { status: 404 });
  const { barbearia } = await exigirBarbeiro();
  const pasta = mkdtempSync(join(tmpdir(), "backup-"));
  const arquivo = join(pasta, "agenda.db");
  try {
    obterAgenda().copiarPara(arquivo);
    return new Response(readFileSync(arquivo), {
      headers: {
        "content-type": "application/vnd.sqlite3",
        "content-disposition": `attachment; filename="${barbearia.slug}-${new Date().toISOString().slice(0, 10)}.db"`,
      },
    });
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}
