import { diaDaSemana, somarDias, type Data } from "@aprenda/agenda";

/**
 * Datas do ano que rendem ação na barbearia, com uma ideia pronta e a matéria da Revista que
 * explica. O painel mostra a próxima (até 45 dias antes), pra dar tempo de preparar.
 */
export interface DataDaBarbearia {
  dia: Data;
  titulo: string;
  ideia: string;
  link?: string;
}

/** Segundo domingo de agosto (Dia dos Pais no Brasil). */
function diaDosPais(ano: number): Data {
  let d: Data = `${ano}-08-01`;
  while (diaDaSemana(d) !== 0) d = somarDias(d, 1);
  return somarDias(d, 7);
}

function datasDoAno(ano: number): DataDaBarbearia[] {
  return [
    { dia: `${ano}-01-18`, titulo: "Dia Nacional do Barbeiro (18/01)", ideia: "Homenageie a equipe e conte a história da profissão nas redes.", link: "/revista/dia-nacional-do-barbeiro-18-de-janeiro" },
    { dia: diaDosPais(ano), titulo: "Dia dos Pais", ideia: "Combo pai e filho na mesma visita, com horário marcado lado a lado." },
    { dia: `${ano}-11-01`, titulo: "Novembro Azul", ideia: "Concurso do bigode no mês e um recado de saúde: vá ao médico.", link: "/revista/movember-e-novembro-azul" },
    { dia: `${ano}-11-20`, titulo: "Dia da Consciência Negra (20/11)", ideia: "Conte a história dos barbeiros sangradores, a origem da profissão no Brasil.", link: "/revista/barbeiros-sangradores-no-brasil-imperial" },
    { dia: `${ano}-12-01`, titulo: "Festas de fim de ano", ideia: "Abra horários extras em dezembro e avise os clientes fiéis um por um, antes de lotar." },
  ];
}

/** A próxima data a até `antecedencia` dias (inclui a de hoje). */
export function proximaData(hoje: Data, antecedencia = 45): DataDaBarbearia | undefined {
  const ano = Number(hoje.slice(0, 4));
  const limite = somarDias(hoje, antecedencia);
  return [...datasDoAno(ano), ...datasDoAno(ano + 1)]
    .filter((d) => d.dia >= hoje && d.dia <= limite)
    .sort((a, b) => a.dia.localeCompare(b.dia))[0];
}
