import { deMinutos, paraMinutos, type Data, type DataHora } from "./tempo.ts";

export interface Expediente {
  abre: string; // "09:00"
  fecha: string; // "19:00"
  /** Intervalo opcional (almoço). */
  pausaInicio?: string;
  pausaFim?: string;
}

export interface Ocupado {
  inicio: DataHora;
  fim: DataHora;
  /** Folga do barbeiro (bloqueio): não pede intervalo antes nem depois. */
  semFolga?: boolean;
}

/**
 * Horários de início livres num dia para um serviço de `duracao` minutos.
 * Puro: recebe tudo pronto, devolve ["09:00", "09:30", ...]. É o coração
 * do agendamento, por isso é testado à parte.
 *
 * `folga`: minutos livres que o barbeiro quer entre um cliente e outro (atraso,
 * limpar a cadeira). Além da grade de `passo`, oferece o horário logo depois de
 * cada cliente + folga, pra um serviço de 45 min não deixar buraco de 15.
 */
export function horariosLivres(opcoes: {
  data: Data;
  expediente: Expediente | undefined;
  duracao: number;
  ocupados: Ocupado[];
  agora: DataHora;
  passo?: number;
  antecedenciaMin?: number;
  folga?: number;
}): string[] {
  const { data, expediente, duracao, ocupados, agora } = opcoes;
  if (!expediente) return [];
  const passo = opcoes.passo ?? 30;
  const abre = paraMinutos(expediente.abre);
  const fecha = paraMinutos(expediente.fecha);

  const folga = opcoes.folga ?? 0;
  const doDia = ocupados.filter((o) => o.inicio.startsWith(data));
  // Cada cliente ocupa também a folga antes e depois dele.
  const bloqueios: [number, number][] = doDia.map((o) => {
    const f = o.semFolga ? 0 : folga;
    return [paraMinutos(o.inicio.slice(11)) - f, paraMinutos(o.fim.slice(11)) + f];
  });
  if (expediente.pausaInicio && expediente.pausaFim) {
    bloqueios.push([paraMinutos(expediente.pausaInicio), paraMinutos(expediente.pausaFim)]);
  }

  let minimo = -1;
  const hoje = agora.slice(0, 10);
  if (data < hoje) return [];
  if (data === hoje) minimo = paraMinutos(agora.slice(11)) + (opcoes.antecedenciaMin ?? 30);

  const candidatos = new Set<number>();
  for (let ini = abre; ini < fecha; ini += passo) candidatos.add(ini);
  // Encaixe: logo depois de cada cliente (já com a folga) e logo depois do almoço/bloqueio.
  for (const [, b] of bloqueios) if (b > abre && b < fecha) candidatos.add(b);

  return [...candidatos]
    .sort((x, y) => x - y)
    .filter((ini) => ini >= minimo && ini + duracao <= fecha && !bloqueios.some(([a, b]) => ini < b && ini + duracao > a))
    .map(deMinutos);
}
