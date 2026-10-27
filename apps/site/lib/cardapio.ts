import { obterAgenda } from "./agenda";

/**
 * Cardápio de uma barbearia de verdade, pros sites de exemplo e pras prévias de /montar:
 * primeiro os cortes, depois o que dá pra fazer junto (adicionais). Preços de referência de
 * barbearia de bairro; no site de cada cliente a equipe põe os preços dele.
 */
export const CARDAPIO = [
  { nome: "Corte social", duracaoMin: 30, precoCentavos: 3500, descricao: "Máquina e tesoura, alinhado do jeito clássico." },
  { nome: "Degradê", duracaoMin: 40, precoCentavos: 4000, descricao: "Do zero ao topo, com acabamento na navalha." },
  { nome: "Corte na tesoura", duracaoMin: 45, precoCentavos: 4500, descricao: "Volume e movimento pra quem gosta de cabelo maior." },
  { nome: "Navalhado e desenho", duracaoMin: 50, precoCentavos: 5000, descricao: "Risco feito à mão. Sai do jeito que você imaginou." },
  { nome: "Corte infantil", duracaoMin: 30, precoCentavos: 3000, descricao: "Com calma e paciência, até 12 anos." },
  { nome: "Corte + barba", duracaoMin: 60, precoCentavos: 6500, descricao: "O combo completo: sai pronto pra qualquer ocasião." },
  { nome: "Barba", duracaoMin: 30, precoCentavos: 3000, adicional: true, descricao: "Completa, com toalha quente, navalha e balm." },
  { nome: "Cavanhaque", duracaoMin: 15, precoCentavos: 2000, adicional: true, descricao: "Contorno e desenho do cavanhaque." },
  { nome: "Pezinho", duracaoMin: 10, precoCentavos: 1500, adicional: true, descricao: "Nuca e contorno alinhados." },
  { nome: "Sobrancelha", duracaoMin: 10, precoCentavos: 1500, adicional: true, descricao: "Acerto na navalha ou na pinça." },
  { nome: "Hidratação", duracaoMin: 15, precoCentavos: 2500, adicional: true, descricao: "Cabelo e barba macios por dias." },
  { nome: "Pigmentação da barba", duracaoMin: 20, precoCentavos: 3000, adicional: true, descricao: "Preenche as falhas e deixa a barba cheia." },
] as const;

/**
 * Troca o cardápio padrão (Corte, Barba, Corte + barba, Sobrancelha) pelo de cima. Os antigos só
 * são desligados (horário já marcado continua apontando pra eles). Rodar de novo não duplica.
 */
export function porCardapio(barbeariaId: number): void {
  const banco = obterAgenda();
  const atuais = banco.servicos(barbeariaId);
  if (atuais.some((s) => s.nome === CARDAPIO[1].nome)) return;
  for (const s of atuais) if (s.ativo) banco.alternarServico(barbeariaId, s.id);
  for (const s of CARDAPIO) banco.adicionarServico(barbeariaId, { ...s });
}
