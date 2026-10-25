import { cookies } from "next/headers";
import { mesmaOrigem, obterMembros } from "@/lib/membros";

export const dynamic = "force-dynamic";

async function membro() {
  const m = obterMembros().membroDaSessao((await cookies()).get("sessao_aluno")?.value);
  return m?.verificado ? m : undefined;
}

const SLUG = /^[a-z0-9_-]{1,80}$/i;

export async function GET(req: Request) {
  const curso = new URL(req.url).searchParams.get("curso") ?? "";
  const m = await membro();
  if (!m || !SLUG.test(curso)) return Response.json({ logado: !!m, concluidas: [] });
  const concluidas = [...obterMembros().licoesConcluidas(m.id, curso)].map((c) => c.split("/")[1]);
  return Response.json({ logado: true, nome: m.nome.split(" ")[0], concluidas });
}

export async function POST(req: Request) {
  if (!mesmaOrigem(req)) return Response.json({ erro: "origem inválida" }, { status: 403 });
  const m = await membro();
  if (!m) return Response.json({ erro: "faça login" }, { status: 401 });
  const corpo = (await req.json().catch(() => ({}))) as { curso?: unknown; licao?: unknown; concluida?: unknown };
  if (typeof corpo.curso !== "string" || typeof corpo.licao !== "string" || !SLUG.test(corpo.curso) || !SLUG.test(corpo.licao)) {
    return Response.json({ erro: "dados inválidos" }, { status: 400 });
  }
  obterMembros().marcarLicao(m.id, corpo.curso, corpo.licao, corpo.concluida === true);
  return Response.json({ ok: true });
}
