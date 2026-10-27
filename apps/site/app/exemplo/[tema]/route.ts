import { redirect } from "next/navigation";
import { temaValido } from "@aprenda/agenda";
import { sitesDeExemplo } from "@/lib/exemplos";

export const dynamic = "force-dynamic";

/**
 * Atalho estável pro site de exemplo de um estilo: os carrosséis (inclusive do site de leads,
 * em outro app) apontam pra cá sem precisar saber o endereço do exemplo. Sem exemplo no ar,
 * cai na montagem já com o estilo escolhido.
 */
export async function GET(req: Request, { params }: { params: Promise<{ tema: string }> }) {
  const { tema } = await params;
  // A origem do link (grupo, cartão...) segue junto, pro cadastro contar de onde veio.
  const origem = new URL(req.url).searchParams.get("origem");
  const extra = origem && /^[a-z0-9-]{2,60}$/.test(origem) ? `origem=${origem}` : "";
  const slug = temaValido(tema) ? sitesDeExemplo()[tema] : undefined;
  if (slug) redirect(`/b/${slug}${extra ? `?${extra}` : ""}`);
  redirect(`/montar?${[temaValido(tema) ? `tema=${tema}` : "", extra].filter(Boolean).join("&")}`);
}
