import { createHmac, timingSafeEqual } from "node:crypto";
import { agoraNoFuso } from "@aprenda/agenda";
import { emailComunidade } from "@aprenda/prospeccao";
import { obterAgenda } from "@/lib/agenda";
import { config, obterBanco } from "@/lib/painel";

/**
 * Convite da comunidade por e-mail, automático e devagar: poucos por vez, só em horário comercial,
 * até `EMAILS_POR_DIA` por dia, cada barbearia uma vez só, com "Não quero mais receber" em todos.
 * Envio pelo Brevo (plano grátis, sem cartão): BREVO_API_KEY + EMAIL_REMETENTE (remetente verificado lá).
 */
export const configEmail = {
  chave: process.env.BREVO_API_KEY?.trim() ?? "",
  remetente: process.env.EMAIL_REMETENTE?.trim() ?? "",
  nome: process.env.EMAIL_NOME?.trim() || "Site da Barbearia777",
  porDia: Math.max(1, Math.min(300, Number(process.env.EMAILS_POR_DIA ?? 50) || 50)),
};
/** O que falta no .env pra mandar (vazio = pronto). O link de sair precisa do endereço público do site. */
export function faltaParaEmail(): string[] {
  return [
    !configEmail.chave && "BREVO_API_KEY",
    !configEmail.remetente && "EMAIL_REMETENTE",
    !/^https?:\/\/[^/]+/.test(process.env.SITE_URL ?? "") && "SITE_URL",
  ].filter(Boolean) as string[];
}
export const emailConfigurado = () => faltaParaEmail().length === 0;

const LIGADO = "emails_ligados";
export const emailsLigados = () => obterAgenda().configuracao(LIGADO) === "1";
export const ligarEmails = (sim: boolean) => obterAgenda().definirConfiguracao(LIGADO, sim ? "1" : "0");

function segredo(): string {
  return process.env.BOT_SEGREDO || process.env.PAINEL_SENHA || "aprenda";
}
/** Assinatura do link de sair: ninguém tira o e-mail de outra pessoa da lista. */
export function assinaturaSair(email: string): string {
  return createHmac("sha256", segredo()).update(`sair:${email.trim().toLowerCase()}`).digest("base64url").slice(0, 22);
}
export function assinaturaConfere(email: string, t: string): boolean {
  const a = Buffer.from(assinaturaSair(email)), b = Buffer.from(String(t));
  return a.length === b.length && timingSafeEqual(a, b);
}
function linkSair(email: string, api = false): string {
  const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  return `${site}${api ? "/api" : ""}/descadastrar?${new URLSearchParams({ e: email.trim().toLowerCase(), t: assinaturaSair(email) })}`;
}

/** Manda um e-mail pelo Brevo. */
async function enviar(para: { email: string; nome: string }, m: { assunto: string; texto: string; html: string }, sair?: string): Promise<void> {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": configEmail.chave, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: configEmail.nome, email: configEmail.remetente },
      to: [{ email: para.email, name: para.nome.slice(0, 70) }],
      subject: m.assunto, htmlContent: m.html, textContent: m.texto,
      ...(sair && { headers: { "List-Unsubscribe": `<${sair}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

/** Início do dia (São Paulo) em ISO, pra contar os enviados hoje. */
function inicioDoDia(): string {
  const hoje = agoraNoFuso("America/Sao_Paulo").slice(0, 10);
  return new Date(`${hoje}T00:00:00-03:00`).toISOString();
}
export const emailsHoje = () => obterBanco().emailsEnviadosDesde(inicioDoDia());

/** Seg a sáb, das 9h às 18h (horário de quem trabalha, não de madrugada). */
export function horarioComercial(): boolean {
  const agora = agoraNoFuso("America/Sao_Paulo");
  const dia = new Date(`${agora.slice(0, 10)}T12:00:00Z`).getUTCDay();
  const hora = Number(agora.slice(11, 13));
  return dia !== 0 && hora >= 9 && hora < 18;
}

/** Uma rodada (instrumentation.ts chama a cada 10 min): até 5 convites, respeitando o limite do dia. */
export async function rodadaDeEmails(): Promise<number> {
  if (!emailConfigurado() || !emailsLigados() || !horarioComercial()) return 0;
  const banco = obterBanco();
  const vagas = Math.min(5, configEmail.porDia - emailsHoje());
  if (vagas <= 0) return 0;
  let enviados = 0;
  for (const lead of banco.proximosEmails(vagas)) {
    const email = lead.email!.trim();
    const m = emailComunidade(lead, config, linkSair(email));
    if (!m) return enviados;
    try {
      await enviar({ email, nome: lead.nome }, m, linkSair(email, true));
      banco.marcarEmailEnviado(lead.placeId);
      enviados++;
    } catch (e) {
      console.error("Convite por e-mail não saiu:", String(e));
      return enviados; // erro do Brevo (chave, limite): para a rodada e tenta na próxima.
    }
  }
  return enviados;
}

/** Botão "Mandar um de teste pra mim": o mesmo e-mail, pro remetente. */
export async function emailDeTeste(): Promise<void> {
  const m = emailComunidade({ nome: "Barbearia de Teste" }, config, linkSair(configEmail.remetente));
  if (!m) throw new Error("Sem link da comunidade.");
  await enviar({ email: configEmail.remetente, nome: "Teste" }, { ...m, assunto: `[Teste] ${m.assunto}` });
}
