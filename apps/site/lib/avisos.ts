import webpush from "web-push";
import { formatarData } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { obterAgenda } from "@/lib/agenda";

/**
 * Avisos no celular do barbeiro (Web Push, padrão aberto dos navegadores, sem custo).
 * Não usa WhatsApp: o aviso traz um botão que abre o WhatsApp DO BARBEIRO com a
 * mensagem de confirmação pronta — quem envia é ele, se quiser.
 */

/** Chaves VAPID: do .env se houver; senão geradas uma vez e guardadas no banco da agenda. */
export function chavesAviso(): { publica: string; privada: string } {
  if (process.env.VAPID_PUBLICA && process.env.VAPID_PRIVADA) {
    return { publica: process.env.VAPID_PUBLICA, privada: process.env.VAPID_PRIVADA };
  }
  const banco = obterAgenda();
  const guardadas = banco.configuracao("vapid");
  if (guardadas) return JSON.parse(guardadas) as { publica: string; privada: string };
  const { publicKey, privateKey } = webpush.generateVAPIDKeys();
  const chaves = { publica: publicKey, privada: privateKey };
  banco.definirConfiguracao("vapid", JSON.stringify(chaves));
  return chaves;
}

/** Texto que o barbeiro manda pro cliente confirmar o horário. */
export function mensagemConfirmacao(a: { barbearia: string; cliente: string; servico: string; profissional: string; inicio: string }): string {
  const primeiroNome = a.cliente.trim().split(/\s+/)[0];
  return `Olá, ${primeiroNome}! Aqui é da ${a.barbearia}. Confirmando seu horário: ${a.servico} com ${a.profissional}, ` +
    `${formatarData(a.inicio.slice(0, 10))} às ${a.inicio.slice(11, 16)}. Tudo certo? Se precisar remarcar, é só responder aqui.`;
}

type Aviso = { titulo: string; corpo: string; url: string; whats?: string; tag: string };

async function enviar(barbeariaId: number, aviso: Aviso): Promise<number> {
  const banco = obterAgenda();
  const inscricoes = banco.inscricoesAviso(barbeariaId);
  if (inscricoes.length === 0) return 0;
  const { publica, privada } = chavesAviso();
  const site = process.env.SITE_URL ?? "";
  const opcoes = {
    vapidDetails: { subject: site.startsWith("https://") ? site : "mailto:avisos@localhost", publicKey: publica, privateKey: privada },
    TTL: 60 * 60 * 12,
    timeout: 8000,
  };
  const resultados = await Promise.allSettled(inscricoes.map((i) =>
    webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, JSON.stringify(aviso), opcoes)));
  let entregues = 0;
  resultados.forEach((r, n) => {
    if (r.status === "fulfilled") entregues++;
    else {
      const status = (r.reason as { statusCode?: number }).statusCode;
      // 404/410: o aparelho desligou os avisos ou desinstalou; não adianta tentar de novo.
      if (status === 404 || status === 410) banco.removerInscricaoAviso(inscricoes[n]!.endpoint);
      else console.error("Falha ao enviar aviso:", status ?? r.reason);
    }
  });
  return entregues;
}

export async function avisarNovoAgendamento(barbeariaId: number, agendamentoId: number): Promise<void> {
  const banco = obterAgenda();
  const b = banco.barbeariaPorId(barbeariaId);
  const a = banco.agendamentoParaAviso(barbeariaId, agendamentoId);
  if (!b || !a) return;
  const data = a.inicio.slice(0, 10);
  await enviar(barbeariaId, {
    titulo: `Novo horário: ${a.clienteNome}`,
    corpo: `${a.servico} com ${a.profissional} · ${formatarData(data)} às ${a.inicio.slice(11, 16)}`,
    url: `/app?data=${data}#ag-${agendamentoId}`,
    whats: linkWhatsapp(a.clienteTelefone, mensagemConfirmacao({ barbearia: b.nome, cliente: a.clienteNome, servico: a.servico, profissional: a.profissional, inicio: a.inicio })),
    tag: `ag-${agendamentoId}`,
  });
}

export async function avisoDeTeste(barbeariaId: number): Promise<number> {
  return enviar(barbeariaId, { titulo: "Avisos ligados ✅", corpo: "Assim vai chegar cada horário novo marcado pelo seu site.", url: "/app", tag: "teste" });
}

/** Cliente cancelou ou remarcou pelo link: o barbeiro fica sabendo na hora. */
export async function avisarMudancaDoCliente(barbeariaId: number, m:
  | { tipo: "cancelou"; id: number; cliente: string; servico: string; inicio: string }
  | { tipo: "remarcou"; id: number; cliente: string; servico: string; inicio: string; novoInicio: string; profissional: string }): Promise<void> {
  const quando = (dh: string) => `${formatarData(dh.slice(0, 10))} às ${dh.slice(11, 16)}`;
  if (m.tipo === "cancelou") {
    await enviar(barbeariaId, {
      titulo: `${m.cliente} cancelou`,
      corpo: `${m.servico} · ${quando(m.inicio)}. O horário voltou a ficar livre no site.`,
      url: `/app?data=${m.inicio.slice(0, 10)}#ag-${m.id}`,
      tag: `ag-${m.id}`,
    });
    return;
  }
  await enviar(barbeariaId, {
    titulo: `${m.cliente} remarcou`,
    corpo: `${m.servico} com ${m.profissional}: de ${quando(m.inicio)} para ${quando(m.novoInicio)}.`,
    url: `/app?data=${m.novoInicio.slice(0, 10)}#ag-${m.id}`,
    tag: `ag-${m.id}`,
  });
}
