import { lerComprovante } from "@aprenda/agenda";
import { exigirLogin } from "@/lib/painel";

export const dynamic = "force-dynamic";

/** Comprovante de Pix: só o admin logado vê, e o arquivo abre isolado (sandbox), sem rodar nada. */
export async function GET(_req: Request, { params }: { params: Promise<{ nome: string }> }) {
  await exigirLogin();
  const { nome } = await params;
  const dados = lerComprovante(nome);
  if (!dados) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(dados), {
    headers: {
      "content-type": nome.endsWith(".pdf") ? "application/pdf" : "image/webp",
      "content-disposition": `inline; filename="${nome}"`,
      "cache-control": "private, no-store",
      "content-security-policy": "sandbox",
      "x-content-type-options": "nosniff",
    },
  });
}
