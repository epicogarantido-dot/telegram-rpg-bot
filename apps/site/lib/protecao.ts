import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ErroAgenda } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";
import { ipDaRequisicao } from "@/lib/membros";

/**
 * Travas contra quem quer atrapalhar (marcar todos os horários, chutar senha).
 * IP e e-mail nunca vão puros pro banco: só um hash curto (LGPD).
 */
function resumo(texto: string): string {
  return createHash("sha256").update(`${process.env.BOT_SEGREDO ?? "aprenda"}:${texto}`).digest("base64url").slice(0, 22);
}

export async function chaveDoAparelho(): Promise<string> {
  return resumo(await ipDaRequisicao());
}

export function chaveDoEmail(email: string): string {
  return resumo(email.trim().toLowerCase());
}

/** O barbeiro dessa barbearia está logado (marcando pra um cliente)? Então não tem limite. */
export async function ehOBarbeiro(barbeariaId: number): Promise<boolean> {
  const u = obterAgenda().usuarioDaSessao((await cookies()).get("sessao_agenda")?.value);
  return !!u && u.barbeariaId === barbeariaId;
}

/** Campo isca: invisível pra gente, robô preenche. */
export const CAMPO_ISCA = "empresa";

/** A barbearia recebeu agendamentos demais em pouco tempo (provável ataque). */
export class ErroRajada extends ErroAgenda {
  constructor() { super("Muitos agendamentos agora. Tente de novo em alguns minutos ou fale com a barbearia."); }
}

/**
 * Antes de marcar pelo site (só olha; quem conta é o `registrar` devolvido, chamado
 * depois que deu certo — erro de digitação não gasta o limite de ninguém):
 * - campo isca preenchido = robô;
 * - até 4 por hora por aparelho na mesma barbearia, e 12 por dia no site todo;
 * - 20 na mesma barbearia em meia hora (fora do normal) segura tudo por um tempo (ErroRajada).
 */
export async function protegerAgendamento(barbeariaId: number, form: FormData): Promise<{ registrar: () => void }> {
  if (String(form.get(CAMPO_ISCA) ?? "")) throw new ErroAgenda("Não foi possível agendar. Fale com a barbearia.");
  const banco = obterAgenda();
  const aparelho = await chaveDoAparelho();
  const chaves = { rajada: `agendar:barbearia:${barbeariaId}`, hora: `agendar:ip:${aparelho}:${barbeariaId}`, dia: `agendar:ip:${aparelho}` };
  if (banco.contarTentativas(chaves.rajada, 30) >= 20) throw new ErroRajada();
  if (banco.contarTentativas(chaves.hora, 60) >= 4) throw new ErroAgenda("Muitos agendamentos seguidos deste aparelho. Tente mais tarde ou fale com a barbearia.");
  if (banco.contarTentativas(chaves.dia, 24 * 60) >= 12) throw new ErroAgenda("Muitos agendamentos hoje deste aparelho. Fale com a barbearia pelo WhatsApp.");
  return { registrar: () => { for (const c of Object.values(chaves)) banco.consumirLimite(c, Number.MAX_SAFE_INTEGER, 1, ""); } };
}

/** Avisa o barbeiro da rajada no máximo uma vez por hora. */
export function primeiraRajadaDaHora(barbeariaId: number): boolean {
  try {
    obterAgenda().consumirLimite(`alerta-rajada:${barbeariaId}`, 1, 60, "");
    return true;
  } catch {
    return false;
  }
}

/** Remarcar e cancelar pelo link: 10 por hora por aparelho (cada um avisa o barbeiro). */
export async function protegerMudanca(): Promise<void> {
  obterAgenda().consumirLimite(`mudar:ip:${await chaveDoAparelho()}`, 10, 60, "Muitas mudanças seguidas. Tente mais tarde ou fale com a barbearia.");
}
