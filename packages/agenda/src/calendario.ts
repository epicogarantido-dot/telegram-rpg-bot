import { agoraNoFuso, type DataHora } from "./tempo.ts";

/**
 * "Adicionar à minha agenda": o próprio celular do cliente lembra do horário.
 * Sem WhatsApp e sem custo — é um arquivo de calendário (.ics, padrão aberto)
 * ou o link de "novo evento" do Google Agenda.
 */
export interface EventoAgenda {
  /** Identificador estável (o mesmo horário não duplica se adicionar duas vezes). */
  uid: string;
  titulo: string;
  descricao: string;
  local?: string;
  /** Horário local da barbearia, como é guardado ("2026-10-27T14:30"). */
  inicio: DataHora;
  duracaoMin: number;
  fuso: string;
  /** Minutos antes pro lembrete. */
  lembreteMin: number;
}

/** Converte o horário local de um fuso pra instante real (UTC). */
export function paraUtc(local: DataHora, fuso: string): Date {
  const comoSeFosseUtc = Date.parse(`${local}:00Z`);
  // Quanto o fuso está deslocado nesse instante (ex.: São Paulo = −3 h).
  const deslocamento = Date.parse(`${agoraNoFuso(fuso, new Date(comoSeFosseUtc))}:00Z`) - comoSeFosseUtc;
  return new Date(comoSeFosseUtc - deslocamento);
}

/** 20261027T173000Z */
function carimbo(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapa texto pro .ics (RFC 5545: \ ; , e quebras de linha). */
function escaparIcs(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Linhas de no máximo 75 bytes; a continuação começa com espaço (RFC 5545). */
function dobrar(linha: string): string {
  const partes: string[] = [];
  let atual = "";
  for (const c of linha) {
    if (Buffer.byteLength(atual + c) > (partes.length ? 74 : 75)) { partes.push(atual); atual = ""; }
    atual += c;
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

function linhasEvento(e: EventoAgenda, agora: Date): string[] {
  const inicio = paraUtc(e.inicio, e.fuso);
  const fim = new Date(inicio.getTime() + e.duracaoMin * 60_000);
  return [
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${carimbo(agora)}`,
    `DTSTART:${carimbo(inicio)}`,
    `DTEND:${carimbo(fim)}`,
    `SUMMARY:${escaparIcs(e.titulo)}`,
    `DESCRIPTION:${escaparIcs(e.descricao)}`,
    ...(e.local ? [`LOCATION:${escaparIcs(e.local)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escaparIcs(e.titulo)}`,
    `TRIGGER:-PT${e.lembreteMin}M`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

function montar(corpo: string[], cabecalho: string[] = []): string {
  const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aprenda Livre//Agenda da barbearia//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...cabecalho, ...corpo, "END:VCALENDAR"];
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}

/** Um horário só (o cliente adiciona à agenda dele). */
export function gerarIcs(e: EventoAgenda, agora = new Date()): string {
  return montar(linhasEvento(e, agora));
}

/**
 * Calendário assinável (o barbeiro cola o link uma vez no iPhone ou no Google
 * Agenda). O app do celular busca de novo de tempos em tempos: horário novo
 * aparece, horário cancelado some.
 */
export function gerarCalendario(nome: string, eventos: EventoAgenda[], agora = new Date()): string {
  return montar(eventos.flatMap((e) => linhasEvento(e, agora)), [
    `X-WR-CALNAME:${escaparIcs(nome)}`,
    // Pede pro app atualizar a cada 15 min (o iPhone respeita; o Google decide sozinho).
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ]);
}

/** Link de "novo evento" do Google Agenda (o lembrete fica o padrão da agenda da pessoa). */
export function linkGoogleAgenda(e: Omit<EventoAgenda, "uid" | "lembreteMin">): string {
  const inicio = paraUtc(e.inicio, e.fuso);
  const fim = new Date(inicio.getTime() + e.duracaoMin * 60_000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titulo,
    dates: `${carimbo(inicio)}/${carimbo(fim)}`,
    details: e.descricao,
    ctz: e.fuso,
    ...(e.local ? { location: e.local } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
