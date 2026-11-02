"use server";

import { exigirAcessoAtivo, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { avisoDeTeste } from "@/lib/avisos";

/**
 * Avisos no celular (Web Push) de quem está usando o painel: o dono recebe todos os horários;
 * um barbeiro da equipe, só os dele. Usado no início do painel e na página "Avisos".
 */
export async function salvarAviso(inscricao: { endpoint: string; p256dh: string; auth: string }): Promise<string | null> {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  try {
    obterAgenda().salvarInscricaoAviso(barbearia.id, {
      endpoint: String(inscricao.endpoint), p256dh: String(inscricao.p256dh), auth: String(inscricao.auth),
    }, usuario.profissionalId);
    return null;
  } catch (e) {
    return mensagemDeErro(e);
  }
}

export async function removerAviso(endpoint: string): Promise<void> {
  const { barbearia } = await exigirAcessoAtivo();
  obterAgenda().removerInscricaoAviso(String(endpoint), barbearia.id);
}

export async function testarAviso(): Promise<number> {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  return avisoDeTeste(barbearia.id, usuario.profissionalId);
}
