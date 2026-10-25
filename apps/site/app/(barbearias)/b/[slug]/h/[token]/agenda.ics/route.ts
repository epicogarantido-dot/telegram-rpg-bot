import { gerarIcs } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";
import { montarEvento, urlAbsoluta } from "@/lib/barbearias";

/** .ics do horário do link secreto: o evento leva o link pra cancelar ou remarcar. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const b = obterAgenda().barbeariaPorSlug(slug);
  const h = b && obterAgenda().horarioDoCliente(b.id, token);
  if (!b || !h || h.status !== "confirmado") return new Response("Horário não encontrado.", { status: 404 });
  const evento = montarEvento(b, { servico: h.servico, profissional: h.profissional, inicio: h.inicio, duracaoMin: h.duracaoMin, linkGestao: urlAbsoluta(`/b/${slug}/h/${token}`) });
  return new Response(gerarIcs(evento), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="horario-${h.inicio.slice(0, 10)}.ics"`,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}
