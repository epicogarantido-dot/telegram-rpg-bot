import { agoraNoFuso, gerarCalendario, somarDias } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { obterAgenda } from "@/lib/agenda";
import { mensagemConfirmacao } from "@/lib/avisos";

/**
 * Calendário do barbeiro, assinado uma vez no iPhone ou no Google Agenda
 * (/agenda/<token>.ics). Traz os horários de 30 dias atrás a 90 dias à frente,
 * com lembrete 15 min antes e o WhatsApp do cliente com a confirmação pronta.
 * Tem dado de cliente: só abre com o link secreto e com o acesso em dia.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const token = (await params).arquivo.replace(/\.ics$/, "");
  const banco = obterAgenda();
  const dono = banco.donoDoTokenAgenda(token);
  const b = dono && banco.barbeariaPorId(dono.barbeariaId);
  if (!dono || !b) return new Response("Calendário não encontrado.", { status: 404 });
  if (!banco.acessoAtivo(b)) return new Response("Acesso vencido. Renove pelo painel.", { status: 403 });

  const prof = dono.profissionalId ? banco.profissionais(b.id).find((p) => p.id === dono.profissionalId) : undefined;
  const hoje = agoraNoFuso(b.fuso).slice(0, 10);
  const horarios = banco.agendamentosEntre(b.id, somarDias(hoje, -30), somarDias(hoje, 90), dono.profissionalId);
  const eventos = horarios.map((a) => ({
    uid: `ag-${a.id}@${b.slug}`,
    titulo: `${a.servico} · ${a.clienteNome}${prof ? "" : ` (${a.profissional.split(" ")[0]})`}`,
    descricao: [
      `Cliente: ${a.clienteNome}`,
      `Com: ${a.profissional}`,
      `Confirmar no WhatsApp: ${linkWhatsapp(a.clienteTelefone, mensagemConfirmacao({ barbearia: b.nome, cliente: a.clienteNome, servico: a.servico, profissional: a.profissional, inicio: a.inicio }))}`,
    ].join("\n"),
    inicio: a.inicio,
    duracaoMin: a.duracaoMin,
    fuso: b.fuso,
    lembreteMin: 15,
  }));
  // Folgas também aparecem, pra ninguém marcar compromisso por cima sem querer.
  for (const f of banco.bloqueiosEntre(b.id, somarDias(hoje, -30), somarDias(hoje, 90), dono.profissionalId)) {
    const min = (h: string) => Number(h.slice(11, 13)) * 60 + Number(h.slice(14, 16));
    eventos.push({
      uid: `folga-${f.id}@${b.slug}`,
      titulo: `Folga${f.profissional && !prof ? ` · ${f.profissional.split(" ")[0]}` : ""}${f.motivo ? ` (${f.motivo})` : ""}`,
      descricao: "Bloqueado no painel: o site não oferece horários nesse período.",
      inicio: f.inicio,
      duracaoMin: Math.max(1, min(f.fim) - min(f.inicio)),
      fuso: b.fuso,
      lembreteMin: 0,
    });
  }
  const nome = prof ? `${prof.nome.split(" ")[0]} · ${b.nome}` : `Agenda · ${b.nome}`;
  return new Response(gerarCalendario(nome, eventos), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="agenda.ics"`,
      "cache-control": "private, max-age=300",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}
