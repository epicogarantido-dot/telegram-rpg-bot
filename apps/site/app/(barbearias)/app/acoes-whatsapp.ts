"use server";

import { redirect } from "next/navigation";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { revalidatePath } from "next/cache";
import { pixDoSinal } from "@aprenda/agenda";
import { exigirAcessoAtivo, obterAgenda, podeMexer, reais } from "@/lib/agenda";
import { mensagemConfirmacao } from "@/lib/avisos";

/**
 * "Confirmar no WhatsApp" (lista de agendados e cartão do dia): anota que a confirmação foi
 * aberta e abre o WhatsApp DO BARBEIRO na conversa do cliente, com a mensagem pronta. Quem
 * envia é ele; o sistema não manda nada sozinho.
 */
export async function confirmarNoWhatsapp(form: FormData) {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const a = banco.agendamento(barbearia.id, Number(form.get("id")));
  if (!a || a.status !== "confirmado" || !podeMexer(usuario, a)) redirect("/app/agendados");
  banco.registrarContato(barbearia.id, a.id, "confirmacao");
  // Sinal ainda não pago: a confirmação já leva o Pix copia e cola pro cliente.
  const pix = !a.sinalPagoEm ? pixDoSinal(barbearia, a) : undefined;
  redirect(linkWhatsapp(a.clienteTelefone, mensagemConfirmacao({
    barbearia: barbearia.nome, cliente: a.clienteNome, servico: a.servico, profissional: a.profissional, inicio: a.inicio,
    sinal: pix ? { valor: reais(a.sinalCentavos!), pix } : undefined,
  })));
}

/** "Recebi o sinal" (o barbeiro conferiu no banco) ou desfaz. Volta pra página de onde veio. */
export async function marcarSinalRecebido(form: FormData) {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  const id = Number(form.get("id"));
  if (!podeMexer(usuario, obterAgenda().agendamento(barbearia.id, id))) redirect("/app");
  obterAgenda().marcarSinal(barbearia.id, id, form.get("pago") === "1");
  revalidatePath("/app");
  revalidatePath("/app/agendados");
  const voltar = String(form.get("voltar") ?? "");
  redirect(voltar.startsWith("/app") ? voltar : "/app");
}
