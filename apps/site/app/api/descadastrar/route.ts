import { assinaturaConfere } from "@/lib/emails";
import { obterBanco } from "@/lib/painel";

/** Descadastro de um clique (List-Unsubscribe-Post, RFC 8058): o Gmail e outros chamam com POST. */
export async function POST(req: Request) {
  const u = new URL(req.url);
  const e = u.searchParams.get("e") ?? "", t = u.searchParams.get("t") ?? "";
  if (!assinaturaConfere(e, t)) return new Response("Link inválido", { status: 400 });
  obterBanco().sairDoEmail(e);
  return new Response("ok");
}
