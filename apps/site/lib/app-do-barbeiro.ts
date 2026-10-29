import { createHmac } from "node:crypto";
import { planoDoAmbiente, type Barbearia } from "@aprenda/agenda";
import { obterAgenda } from "./agenda";

/**
 * Site de leads: depois que o Pix da assinatura é confirmado, o admin sobe um app SaaS só pra esse
 * barbeiro na Square. Aqui sai o bloco de variáveis desse app, pronto pra colar em Configurações →
 * Variáveis de ambiente (com o subdomínio sugerido, a senha do admin dele e até quando está pago),
 * e a mensagem com o link e a senha pro barbeiro. Os dois apps não conversam: é só texto pra copiar.
 */

/** Segredo estável por barbeiro, tirado da senha do admin do leads: rever o bloco dá sempre o mesmo. */
function derivado(b: Pick<Barbearia, "id">, para: string, tamanho: number): string {
  return createHmac("sha256", `${process.env.PAINEL_SENHA ?? ""}:app-do-barbeiro`).update(`${para}:${b.id}`).digest("base64url").slice(0, tamanho);
}

export function enderecoDoApp(b: Pick<Barbearia, "slug">): string {
  return `https://${b.slug.slice(0, 32).replace(/-+$/, "")}.squareweb.app`;
}

export function senhaDoApp(b: Pick<Barbearia, "id">): string {
  return derivado(b, "senha", 14);
}

export function variaveisDoApp(b: Barbearia): string {
  const plano = planoDoAmbiente();
  const dono = obterAgenda().usuariosDaBarbearia(b.id)[0];
  // Valor de variável numa linha só e sem "#" (que viraria comentário).
  const valor = (v: string | undefined) => (v ?? "").replace(/[\r\n#]/g, " ").trim();
  const linhas = [
    `# App de ${valor(b.nome)}: cole em Configurações → Variáveis de ambiente do app na Square e reinicie.`,
    `# Subdomínio do app: ${enderecoDoApp(b).replace("https://", "").replace(".squareweb.app", "")}`,
    `SITE_URL=${enderecoDoApp(b)}`,
    `PAINEL_SENHA=${senhaDoApp(b)}`,
    `ADMIN_WHATSAPP=${process.env.ADMIN_WHATSAPP ?? ""}`,
    `PLANO_DIAS=${plano.dias}`,
    `PLANO_ADESAO=${(plano.adesaoCentavos ?? 0) / 100}`,
    `PLANO_VALOR=${plano.valorCentavos / 100}`,
    `# Até quando está pago. Renovou aqui? Copie a data nova pro app e reinicie.`,
    `PAGO_ATE=${b.acessoAte}`,
    `# Dados iniciais do site (só na 1ª vez que o app sobe; depois ele muda no painel)`,
    `BARBEARIA_NOME=${valor(b.nome)}`,
    `BARBEARIA_WHATSAPP=${b.telefone}`,
    `BARBEIRO_NOME=${valor(dono?.nome)}`,
    `BARBEARIA_CIDADE=${valor(b.cidade)}`,
    `# Estilo: silencioso, atemporal, cerimonia, tecnico, potencia ou extravagancia`,
    `BARBEARIA_ESTILO=cerimonia`,
    `BOT_SEGREDO=${derivado(b, "bot", 32)}`,
  ];
  return linhas.join("\n");
}

/** Mensagem pro barbeiro quando o app dele estiver no ar. */
export function mensagemDeAcesso(b: Barbearia): string {
  const dono = obterAgenda().usuariosDaBarbearia(b.id)[0];
  const site = enderecoDoApp(b);
  return `Oi${dono ? `, ${dono.nome.split(" ")[0]}` : ""}! O site da ${b.nome} está no ar:\n${site}\n\n` +
    `Pra mexer no site e ver a agenda, entre aqui:\n${site}/admin\nSenha: ${senhaDoApp(b)}\n\n` +
    `Lá você troca as fotos, os preços, os horários e o que mais quiser.`;
}
