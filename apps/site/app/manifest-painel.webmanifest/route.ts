import { barbeariaInstalavel, manifesto } from "@/lib/app-instalavel";

export const dynamic = "force-dynamic";

/** SaaS: o painel como app no celular do barbeiro (ícone da barbearia com o selo de agenda). */
export function GET() {
  const b = barbeariaInstalavel();
  if (!b) return new Response(null, { status: 404 });
  return Response.json(manifesto(b, "painel"), { headers: { "content-type": "application/manifest+json", "cache-control": "no-cache" } });
}
