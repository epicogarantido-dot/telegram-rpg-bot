const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10-25" → "25 de outubro de 2026" (sem depender do fuso do servidor). */
export function dataPorExtenso(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  return `${d} de ${MESES[(m ?? 1) - 1]} de ${a}`;
}
