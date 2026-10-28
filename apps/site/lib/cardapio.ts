import { obterAgenda } from "./agenda";

/**
 * Cardápio de uma barbearia de verdade, pros sites de exemplo, demonstrações e contas novas:
 * primeiro os cortes pelo nome que o cliente pede no balcão (low, mid, high fade, social,
 * americano...), depois o que dá pra fazer junto (adicionais). Preços de referência de
 * barbearia de bairro; no site de cada cliente a equipe põe os preços dele.
 */
export const CARDAPIO = [
  { nome: "Low fade", duracaoMin: 40, precoCentavos: 4500, descricao: "Degradê baixo, perto da orelha. Discreto e sempre alinhado." },
  { nome: "Mid fade", duracaoMin: 40, precoCentavos: 4500, descricao: "Degradê na altura das têmporas, com acabamento na navalha." },
  { nome: "High fade", duracaoMin: 40, precoCentavos: 4500, descricao: "Degradê alto, laterais quase na pele. Visual marcado." },
  { nome: "Taper fade", duracaoMin: 35, precoCentavos: 4000, descricao: "Degradê só na costeleta e na nuca. Limpo sem mudar o resto." },
  { nome: "Social", duracaoMin: 30, precoCentavos: 3500, descricao: "Máquina nas laterais e tesoura em cima. O clássico." },
  { nome: "Americano", duracaoMin: 35, precoCentavos: 4000, descricao: "Laterais baixas e topo curto, tudo bem alinhado." },
  { nome: "Corte na tesoura", duracaoMin: 45, precoCentavos: 5000, descricao: "Volume e movimento, só na tesoura." },
  { nome: "Crop francês", duracaoMin: 40, precoCentavos: 4500, descricao: "Franja curta e reta, topo texturizado." },
  { nome: "Buzz cut", duracaoMin: 20, precoCentavos: 3000, descricao: "Máquina na cabeça toda. Prático e marcante." },
  { nome: "Moicano", duracaoMin: 45, precoCentavos: 5000, descricao: "Laterais raspadas e faixa alta no meio." },
  { nome: "Mullet", duracaoMin: 45, precoCentavos: 5000, descricao: "Curto na frente e nas laterais, comprido atrás." },
  { nome: "Corte infantil", duracaoMin: 30, precoCentavos: 3000, descricao: "Com calma e paciência, até 12 anos." },
  { nome: "Corte + barba", duracaoMin: 60, precoCentavos: 6500, descricao: "O combo completo: sai pronto pra qualquer ocasião." },
  { nome: "Barba", duracaoMin: 30, precoCentavos: 3000, adicional: true, descricao: "Completa, com toalha quente, navalha e balm." },
  { nome: "Cavanhaque", duracaoMin: 15, precoCentavos: 2000, adicional: true, descricao: "Contorno e desenho do cavanhaque." },
  { nome: "Risco na navalha", duracaoMin: 15, precoCentavos: 1500, adicional: true, descricao: "Uma linha ou um desenho feito à mão." },
  { nome: "Pezinho", duracaoMin: 10, precoCentavos: 1500, adicional: true, descricao: "Nuca e contorno alinhados." },
  { nome: "Sobrancelha", duracaoMin: 10, precoCentavos: 1500, adicional: true, descricao: "Acerto na navalha ou na pinça." },
  { nome: "Hidratação", duracaoMin: 15, precoCentavos: 2500, adicional: true, descricao: "Cabelo e barba macios por dias." },
  { nome: "Pigmentação da barba", duracaoMin: 20, precoCentavos: 3000, adicional: true, descricao: "Preenche as falhas e deixa a barba cheia." },
  { nome: "Platinado", duracaoMin: 90, precoCentavos: 12000, adicional: true, descricao: "O nevou: descoloração e matização no cabelo todo." },
] as const;

/**
 * Troca o cardápio que estiver lá (o padrão da conta nova, ou um cardápio de exemplo mais antigo)
 * pelo de cima. Os antigos só são desligados (horário já marcado continua apontando pra eles).
 * Rodar de novo não duplica: o "Mid fade" ativo marca que o cardápio atual já entrou.
 */
export function porCardapio(barbeariaId: number): void {
  const banco = obterAgenda();
  const atuais = banco.servicos(barbeariaId);
  if (atuais.some((s) => s.ativo && s.nome === CARDAPIO[1].nome)) return;
  for (const s of atuais) if (s.ativo) banco.alternarServico(barbeariaId, s.id);
  for (const s of CARDAPIO) banco.adicionarServico(barbeariaId, { ...s });
}
