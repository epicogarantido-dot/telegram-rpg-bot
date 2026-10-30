import { redirect } from "next/navigation";
import { barbeariaDoApp, prepararBarbeariaDoApp } from "@/lib/barbearia-do-app";
import { soEntrega } from "@/lib/modo";

export const dynamic = "force-dynamic";

/**
 * SaaS (um app por barbeiro): o endereço principal e o /agendar (o proxy manda os dois pra cá)
 * abrem o site e o agendar da barbearia do app. Fora do SaaS, esta rota não existe.
 */
export async function GET(req: Request, { params }: { params: Promise<{ pagina?: string[] }> }) {
  if (!soEntrega()) return new Response(null, { status: 404 });
  const { pagina } = await params;
  const b = barbeariaDoApp() ?? await prepararBarbeariaDoApp();
  // O link curto com o serviço já escolhido (/agendar?servico=6) chega com a escolha.
  const busca = new URL(req.url).search;
  redirect(`/b/${b.slug}${pagina?.[0] === "agendar" ? "/agendar" : ""}${busca}`);
}
