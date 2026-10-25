import type { Lead } from "./banco.ts";

/**
 * Mensagem de primeiro contato. Regras que mantêm isso cordial (e longe de
 * spam/banimento): diz quem é, por que está escrevendo pra ESTE negócio,
 * oferece algo útil e gratuito, não pede nada, e explica como não receber mais.
 */
export interface ConfigConvite {
  remetente: string; // "João, do Aprenda Livre"
  linkComunidade: string; // link do grupo/canal
  nichoPlural: string; // "barbeiros"
}

export function primeiroNome(nomeNegocio: string): string {
  return nomeNegocio.replace(/\s*[-|–].*$/, "").trim();
}

export function mensagemConvite(lead: Pick<Lead, "nome" | "nota" | "avaliacoes">, cfg: ConfigConvite): string {
  const elogio =
    lead.nota && lead.avaliacoes && lead.nota >= 4.5 && lead.avaliacoes >= 20
      ? ` Vi que vocês têm nota ${lead.nota.toFixed(1).replace(".", ",")} no Google, parabéns pelo trabalho!`
      : "";
  return [
    `Olá, pessoal da ${primeiroNome(lead.nome)}! Aqui é ${cfg.remetente}.${elogio}`,
    `Estou montando uma comunidade gratuita no WhatsApp só para ${cfg.nichoPlural}: dicas para lotar a agenda, cursos gratuitos e novidades do setor. Achei que poderia interessar a vocês.`,
    `Se quiserem participar, o link é este: ${cfg.linkComunidade}`,
    `Se não tiver interesse, é só responder SAIR que não envio mais nada. Obrigado e bom trabalho! ✂️`,
  ].join("\n\n");
}
