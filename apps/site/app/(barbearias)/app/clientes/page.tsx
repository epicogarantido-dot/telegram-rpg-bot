import Link from "next/link";
import { redirect } from "next/navigation";
import { formatarData } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { MessageCircle } from "lucide-react";
import { exigirDono, obterAgenda } from "@/lib/agenda";
import { linkPublico } from "@/lib/barbearias";
import { mensagemVolta } from "@/lib/pos-atendimento";

export const metadata = { title: "Clientes que sumiram", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Anota a chamada (some da lista por 14 dias) e abre o WhatsApp do barbeiro com a mensagem pronta. */
async function chamar(form: FormData) {
  "use server";
  const { barbearia } = await exigirDono();
  const banco = obterAgenda();
  const c = banco.clientesSumidos(barbearia.id).find((x) => x.telefone === String(form.get("telefone")));
  if (!c) redirect("/app/clientes");
  banco.registrarChamada(barbearia.id, c.telefone);
  redirect(linkWhatsapp(c.telefone, mensagemVolta({
    barbearia: barbearia.nome, cliente: c.nome, diasSemVir: c.diasSemVir, servico: c.ultimoServico,
    linkAgendar: linkPublico(barbearia, "/agendar"),
  })));
}

export default async function Clientes() {
  const { barbearia } = await exigirDono();
  const sumidos = obterAgenda().clientesSumidos(barbearia.id);
  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Clientes que sumiram</h1>
      <p>
        Quem já passou do próprio tempo de voltar e não tem nada marcado. Uma mensagem pessoal, um por um, traz muita gente de volta.
        Quem você chamar sai da lista por 14 dias.
      </p>
      {sumidos.length === 0
        ? <p className="atribuicao">Ninguém atrasado agora. Continue marcando o próximo horário no fim de cada atendimento.</p>
        : (
          <ul className="lista-sumidos">
            {sumidos.map((c) => (
              <li key={c.telefone} className="cartao hoje-linha">
                <div>
                  <strong>{c.nome}</strong>
                  <p className="suave pequeno">
                    Último: {c.ultimoServico}, {formatarData(c.ultimaVisita)} · {c.diasSemVir} dias sem vir (costuma voltar em {c.ritmoDias})
                  </p>
                </div>
                <form action={chamar}>
                  <input type="hidden" name="telefone" value={c.telefone} />
                  <button className="botao-sec"><MessageCircle size={16} aria-hidden /> Chamar de volta</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      <p className="suave pequeno">Mande só pra quem é seu cliente e respeite quem pedir pra não receber. Nada de lista de transmissão.</p>
    </>
  );
}
