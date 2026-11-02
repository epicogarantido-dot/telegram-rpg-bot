import { primeiroNome } from "@/lib/pos-atendimento";
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
export function mensagemConfirmacao(a: { barbearia: string; cliente: string; servico: string; profissional: string; inicio: string; sinal?: { valor: string; pix: string } }): string {
  return `Olá, ${primeiroNome(a.cliente)}! Aqui é da ${a.barbearia}. Confirmando seu horário: ${a.servico} com ${a.profissional}, ` +
    `${formatarData(a.inicio.slice(0, 10))} às ${a.inicio.slice(11, 16)}. Tudo certo? Se precisar remarcar, é só responder aqui.` +
    (a.sinal ? `\n\nPra garantir o horário, falta o sinal de ${a.sinal.valor} no Pix. Copie o código abaixo e cole no app do banco (Pix Copia e Cola):\n\n${a.sinal.pix}` : "");
}

type Aviso = { titulo: string; corpo: string; url: string; whats?: string; tag: string };

/** `profissionalId`: aviso de um horário, vai pro dono e pro barbeiro dele (não pros outros da equipe). */
async function enviar(barbeariaId: number, aviso: Aviso, profissionalId?: number): Promise<number> {
  const banco = obterAgenda();
  const inscricoes = banco.inscricoesAviso(barbeariaId, profissionalId);
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
    corpo: `${a.servico} com ${a.profissional} · ${formatarData(data)} às ${a.inicio.slice(11, 16)}${a.referenciaFoto ? " · escolheu o corte nas fotos" : ""}`,
    // Tocar no aviso abre a página do horário com o "Confirmar no WhatsApp" (mensagem pronta pro cliente).
    url: `/app/confirmar/${agendamentoId}`,
    tag: `ag-${agendamentoId}`,
  }, a.profissionalId);
}

export async function avisoDeTeste(barbeariaId: number, profissionalId?: number): Promise<number> {
  return enviar(barbeariaId, { titulo: "Avisos ligados ✅", corpo: "Assim vai chegar cada horário novo marcado pelo seu site.", url: "/app", tag: "teste" }, profissionalId);
}

/** Cliente cancelou ou remarcou pelo link: o barbeiro fica sabendo na hora. */
export async function avisarMudancaDoCliente(barbeariaId: number, m:
  | { tipo: "cancelou"; id: number; cliente: string; servico: string; inicio: string }
  | { tipo: "remarcou"; id: number; cliente: string; servico: string; inicio: string; novoInicio: string; profissional: string }): Promise<void> {
  const quando = (dh: string) => `${formatarData(dh.slice(0, 10))} às ${dh.slice(11, 16)}`;
  const prof = obterAgenda().agendamentoParaAviso(barbeariaId, m.id)?.profissionalId;
  if (m.tipo === "cancelou") {
    await enviar(barbeariaId, {
      titulo: `${m.cliente} cancelou`,
      corpo: `${m.servico} · ${quando(m.inicio)}. O horário voltou a ficar livre no site.`,
      url: `/app?data=${m.inicio.slice(0, 10)}#ag-${m.id}`,
      tag: `ag-${m.id}`,
    }, prof);
    return;
  }
  await enviar(barbeariaId, {
    titulo: `${m.cliente} remarcou`,
    corpo: `${m.servico} com ${m.profissional}: de ${quando(m.inicio)} para ${quando(m.novoInicio)}.`,
    url: `/app/confirmar/${m.id}`,
    tag: `ag-${m.id}`,
  }, prof);
}

/** Alguém está tentando encher a agenda: o barbeiro fica sabendo e pode bloquear números. */
export async function avisarRajada(barbeariaId: number): Promise<void> {
  await enviar(barbeariaId, {
    titulo: "Muitos agendamentos de uma vez",
    corpo: "Seguramos novos agendamentos por alguns minutos. Confira a agenda: se for trote, bloqueie o número no horário.",
    url: "/app",
    tag: "rajada",
  });
}

/** O admin decidiu o Pix: o barbeiro fica sabendo sem precisar abrir o painel pra conferir. */
export async function avisarPagamento(barbeariaId: number, d: { confirmado: boolean; publicou: boolean; ate?: string; nome: string }): Promise<void> {
  const aviso: Aviso = !d.confirmado
    ? { titulo: "Pagamento não confirmado", corpo: "Não achamos o seu Pix. Abra a assinatura pra conferir ou mandar o comprovante de novo.", url: "/app/assinatura", tag: "pagamento" }
    : d.publicou
      ? { titulo: "Seu site está no ar! 🎉", corpo: `Pagamento confirmado. Os clientes já podem ver o site da ${d.nome} e marcar horário.`, url: "/app", tag: "pagamento" }
      : { titulo: "Pagamento confirmado", corpo: `Acesso renovado${d.ate ? ` até ${formatarData(d.ate)}` : ""}. Obrigado!`, url: "/app/assinatura", tag: "pagamento" };
  try {
    await enviar(barbeariaId, aviso);
  } catch (e) {
    // Aviso é cortesia: falhar aqui não pode desfazer a decisão do admin.
    console.error("Falha ao avisar pagamento:", e);
  }
}

// ---------- avisos no celular do CLIENTE (lembrete do horário) ----------

type Aparelho = { endpoint: string; p256dh: string; auth: string };

async function enviarPara(aparelho: Aparelho, aviso: Aviso): Promise<"ok" | "sumiu" | "falhou"> {
  const { publica, privada } = chavesAviso();
  const site = process.env.SITE_URL ?? "";
  try {
    await webpush.sendNotification({ endpoint: aparelho.endpoint, keys: { p256dh: aparelho.p256dh, auth: aparelho.auth } }, JSON.stringify(aviso), {
      vapidDetails: { subject: site.startsWith("https://") ? site : "mailto:avisos@localhost", publicKey: publica, privateKey: privada },
      TTL: 60 * 60, timeout: 8000,
    });
    return "ok";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "sumiu";
    console.error("Falha ao avisar o cliente:", status ?? e);
    return "falhou";
  }
}

/** Logo que o cliente liga o aviso: chega na hora, pra ele ver que funcionou. */
export async function avisoClienteLigado(aparelho: Aparelho, h: { barbearia: string; slug: string; servico: string; inicio: string }): Promise<void> {
  await enviarPara(aparelho, {
    titulo: `Aviso ligado ✅`,
    corpo: `A ${h.barbearia} te avisa 1 hora antes: ${h.servico}, ${formatarData(h.inicio.slice(0, 10))} às ${h.inicio.slice(11, 16)}.`,
    url: `/b/${h.slug}`, tag: "cliente-ligado",
  });
}

/** Roda a cada poucos minutos (instrumentation.ts): manda o "daqui a 1 hora" de quem pediu. */
export async function enviarLembretesClientes(): Promise<number> {
  const banco = obterAgenda();
  let enviados = 0;
  for (const l of banco.lembretesPendentes(60)) {
    const r = await enviarPara(l, {
      titulo: `Seu horário na ${l.barbearia} é às ${l.inicio.slice(11, 16)}`,
      corpo: `${l.servico} com ${l.profissional}. Até já!`,
      url: `/b/${l.slug}`, tag: `horario-${l.agendamentoId}`,
    });
    if (r === "ok") { banco.marcarLembreteEnviado(l.endpoint, l.agendamentoId); enviados++; }
    else if (r === "sumiu") banco.removerLembreteCliente(l.endpoint);
  }
  return enviados;
}
