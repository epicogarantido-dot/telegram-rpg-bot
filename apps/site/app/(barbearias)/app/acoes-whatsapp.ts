"use server";

import { redirect } from "next/navigation";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { exigirAcessoAtivo, obterAgenda } from "@/lib/agenda";
import { mensagemConfirmacao } from "@/lib/avisos";

/**
 * "Confirmar no WhatsApp" (lista de agendados e cartão do dia): anota que a confirmação foi
 * aberta e abre o WhatsApp DO BARBEIRO na conversa do cliente, com a mensagem pronta. Quem
 * envia é ele; o sistema não manda nada sozinho.
 */
export async function confirmarNoWhatsapp(form: FormData) {
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const a = banco.agendamento(barbearia.id, Number(form.get("id")));
  if (!a || a.status !== "confirmado") redirect("/app/agendados");
  banco.registrarContato(barbearia.id, a.id, "confirmacao");
  redirect(linkWhatsapp(a.clienteTelefone, mensagemConfirmacao({
    barbearia: barbearia.nome, cliente: a.clienteNome, servico: a.servico, profissional: a.profissional, inicio: a.inicio,
  })));
}
