import { lerFoto } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";

/** Entrega as fotos das barbearias. Só arquivos registrados no banco, com nome no formato certo. */
export async function GET(_req: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params;
  const arquivo = nome.replace(/(-p)?\.webp$/, "");
  const dados = obterAgenda().fotoExiste(arquivo) ? lerFoto(nome) : undefined;
  if (!dados) return new Response("Não encontrada", { status: 404 });
  return new Response(new Uint8Array(dados), {
    headers: {
      "content-type": "image/webp",
      // O nome muda a cada envio, então pode ficar em cache "pra sempre".
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
