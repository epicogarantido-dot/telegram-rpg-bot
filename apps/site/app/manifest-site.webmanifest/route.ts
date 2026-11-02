import { barbeariaInstalavel, manifesto } from "@/lib/app-instalavel";

export const dynamic = "force-dynamic";

/** SaaS: o site da barbearia como app no celular do cliente (ícone e nome da barbearia). */
export function GET(req: Request) {
  const b = barbeariaInstalavel();
  if (!b) return new Response(null, { status: 404 });
  return Response.json(manifesto(b, "site", new URL(req.url).searchParams.get("inicio") ?? undefined), { headers: { "content-type": "application/manifest+json", "cache-control": "no-cache" } });
}
