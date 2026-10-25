import { lerDesafio, obterMembros } from "@/lib/membros";

export const dynamic = "force-dynamic";

/** A tela de confirmação pergunta aqui, de tempos em tempos, se a mensagem já chegou. */
export async function GET() {
  const s = obterMembros().statusDoDesafio(await lerDesafio());
  return Response.json(s ? { ativo: true, confirmado: s.confirmado, finalidade: s.finalidade } : { ativo: false });
}
