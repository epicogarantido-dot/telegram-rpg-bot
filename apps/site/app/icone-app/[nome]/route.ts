import { barbeariaInstalavel, iconeDoApp } from "@/lib/app-instalavel";

export const dynamic = "force-dynamic";

/** Ícones dos apps do SaaS: /icone-app/site-192.png, /icone-app/painel-512-mascara.png, …-180 (iPhone). */
export async function GET(_req: Request, { params }: { params: Promise<{ nome: string }> }) {
  const b = barbeariaInstalavel();
  const m = /^(site|painel)-(180|192|512)(-mascara)?\.png$/.exec((await params).nome);
  if (!b || !m) return new Response(null, { status: 404 });
  const png = await iconeDoApp(b, m[1] as "site" | "painel", Number(m[2]), !!m[3]);
  return new Response(new Uint8Array(png), {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=86400", "x-content-type-options": "nosniff" },
  });
}
