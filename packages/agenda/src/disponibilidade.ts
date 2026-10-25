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
}

/**
 * Horários de início livres num dia para um serviço de `duracao` minutos.
 * Puro: recebe tudo pronto, devolve ["09:00", "09:30", ...]. É o coração
 * do agendamento, por isso é testado à parte.
 */
export function horariosLivres(opcoes: {
  data: Data;
  expediente: Expediente | undefined;
  duracao: number;
  ocupados: Ocupado[];
  agora: DataHora;
  passo?: number;
  antecedenciaMin?: number;
}): string[] {
  const { data, expediente, duracao, ocupados, agora } = opcoes;
  if (!expediente) return [];
  const passo = opcoes.passo ?? 30;
  const abre = paraMinutos(expediente.abre);
  const fecha = paraMinutos(expediente.fecha);

  const bloqueios: [number, number][] = ocupados
    .filter((o) => o.inicio.startsWith(data))
    .map((o) => [paraMinutos(o.inicio.slice(11)), paraMinutos(o.fim.slice(11))]);
  if (expediente.pausaInicio && expediente.pausaFim) {
    bloqueios.push([paraMinutos(expediente.pausaInicio), paraMinutos(expediente.pausaFim)]);
  }

  let minimo = -1;
  const hoje = agora.slice(0, 10);
  if (data < hoje) return [];
  if (data === hoje) minimo = paraMinutos(agora.slice(11)) + (opcoes.antecedenciaMin ?? 30);

  const livres: string[] = [];
  for (let ini = abre; ini + duracao <= fecha; ini += passo) {
    if (ini < minimo) continue;
    const fim = ini + duracao;
    if (bloqueios.some(([a, b]) => ini < b && fim > a)) continue;
    livres.push(deMinutos(ini));
  }
  return livres;
}
