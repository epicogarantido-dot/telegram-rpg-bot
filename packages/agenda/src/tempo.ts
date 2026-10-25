/**
 * Horários são guardados como "data local da barbearia" sem fuso
 * ("2026-10-27T14:30"). Barbearia não muda de fuso, e assim a agenda
 * mostra exatamente o que o barbeiro digitou. O fuso só entra pra saber
 * "que horas são agora lá" (não deixar marcar no passado).
 */
export type Data = string; // "2026-10-27"
export type DataHora = string; // "2026-10-27T14:30"

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

export function deMinutos(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function agoraNoFuso(fuso: string, agora = new Date()): DataHora {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(agora).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(data: Data): number {
  return new Date(`${data}T12:00:00Z`).getUTCDay();
}

export function somarDias(data: Data, dias: number): Data {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function dataValida(data: string): data is Data {
  return /^\d{4}-\d{2}-\d{2}$/.test(data) && !Number.isNaN(new Date(`${data}T12:00:00Z`).getTime());
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export function nomeDia(dia: number): string {
  return DIAS[dia]!;
}

export function formatarData(data: Data): string {
  const [a, m, d] = data.split("-");
  return `${nomeDia(diaDaSemana(data))}, ${d}/${m}/${a}`;
}
