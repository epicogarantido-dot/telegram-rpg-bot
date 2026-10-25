import { gerarIcs } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";
import { eventoDoHorario } from "@/lib/barbearias";

/**
 * Arquivo de calendário (.ics) do horário marcado, com lembrete 1 h antes.
 * No iPhone abre direto o "Adicionar à agenda"; no computador, Outlook/Agenda.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const r = b && eventoDoHorario(b, sp);
  if (!r) return new Response("Horário não encontrado.", { status: 404 });
  return new Response(gerarIcs(r.evento), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="horario-${r.evento.inicio.slice(0, 10)}.ics"`,
      "cache-control": "no-store",
    },
  });
}
