import { formatarData } from "@aprenda/agenda";

/**
 * Textos do pós-atendimento. Quem envia é o barbeiro, do WhatsApp dele (o SaaS não usa bot):
 * o painel só abre a conversa com a mensagem pronta. Nada de oferecer brinde ou desconto em
 * troca de avaliação: a política do Google Maps proíbe e remove essas avaliações.
 */
function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

function quando(inicio: string): string {
  return `${formatarData(inicio.slice(0, 10))} às ${inicio.slice(11, 16)}`;
}

/** Lembrete da véspera. O link pra remarcar o cliente já recebeu ao marcar; aqui ele pode só responder. */
export function mensagemLembrete(a: { barbearia: string; cliente: string; servico: string; inicio: string }): string {
  return `Oi, ${primeiroNome(a.cliente)}! Aqui é da ${a.barbearia}. Passando pra lembrar do seu horário amanhã: ` +
    `${a.servico}, ${quando(a.inicio)}. Se não puder vir, me avisa por aqui que eu libero o horário pra outra pessoa.`;
}

export function mensagemAvaliacao(a: { barbearia: string; cliente: string; link: string }): string {
  return `Oi, ${primeiroNome(a.cliente)}! Obrigado por vir na ${a.barbearia}. Se você gostou do atendimento, ` +
    `deixa uma avaliação pra gente no Google? Ajuda muito quem está procurando barbearia: ${a.link}`;
}

export function mensagemRetorno(a: { barbearia: string; cliente: string; servico: string; inicio: string; link: string }): string {
  return `Oi, ${primeiroNome(a.cliente)}! Seu próximo horário na ${a.barbearia} está marcado: ${a.servico}, ${quando(a.inicio)}. ` +
    `Pra ver, colocar na agenda do celular, remarcar ou cancelar: ${a.link}`;
}
