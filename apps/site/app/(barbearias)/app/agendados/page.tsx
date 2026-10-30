import Link from "next/link";
import { agoraNoFuso, formatarData, nomeDia, diaDaSemana, somarDias, type Data } from "@aprenda/agenda";
import { CalendarPlus, Check, MessageCircle } from "lucide-react";
import { exigirAcessoAtivo, obterAgenda } from "@/lib/agenda";
import { confirmarNoWhatsapp } from "../acoes-whatsapp";
import { SinalDoHorario } from "@/componentes/barbearia/SinalDoHorario";

export const metadata = { title: "Agendados", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Todos os próximos horários, dia por dia, cada um com "Confirmar no WhatsApp": abre o WhatsApp
 * do barbeiro na conversa do cliente com a mensagem pronta e fica anotado (✓) pra não repetir.
 */
export default async function Agendados({ searchParams }: { searchParams: Promise<{ faltam?: string }> }) {
  const { barbearia } = await exigirAcessoAtivo();
  const { faltam } = await searchParams;
  const agora = agoraNoFuso(barbearia.fuso);
  const hoje = agora.slice(0, 10) as Data;
  const todos = obterAgenda().proximosAgendados(barbearia.id, agora, 30);
  const semConfirmar = todos.filter((a) => !a.confirmacaoEm).length;
  const lista = faltam ? todos.filter((a) => !a.confirmacaoEm) : todos;
  const dias = [...new Set(lista.map((a) => a.inicio.slice(0, 10) as Data))];
  const rotulo = (d: Data) => (d === hoje ? "Hoje" : d === somarDias(hoje, 1) ? "Amanhã" : nomeDia(diaDaSemana(d)));
  const variosProfissionais = new Set(todos.map((a) => a.profissionalId)).size > 1;

  return (
    <>
      <h1>Agendados</h1>
      <p className="suave">
        Os próximos 30 dias. Toque em <strong>Confirmar</strong> pra abrir o seu WhatsApp na conversa do cliente com a mensagem pronta:
        é só enviar.
      </p>
      <nav className="agendados-filtro" aria-label="Filtro">
        <Link href="/app/agendados" aria-current={!faltam ? "page" : undefined}>Todos ({todos.length})</Link>
        <Link href="/app/agendados?faltam=1" aria-current={faltam ? "page" : undefined}>Falta confirmar ({semConfirmar})</Link>
      </nav>

      {lista.length === 0 && (
        <div className="cartao vazio">
          <p>{faltam ? "Todos os próximos horários já foram confirmados." : "Nenhum horário marcado nos próximos 30 dias."}</p>
          <Link className="botao-sec" href={`/b/${barbearia.slug}/agendar`}><CalendarPlus size={16} aria-hidden /> Marcar horário</Link>
        </div>
      )}

      {dias.map((d) => (
        <section key={d} className="agendados-dia" aria-label={`${rotulo(d)}, ${formatarData(d)}`}>
          {/* Hoje e Amanhã ganham a data do lado; os outros já trazem o dia da semana na data. */}
          <h2>{d === hoje || d === somarDias(hoje, 1) ? <>{rotulo(d)} <small className="suave">{formatarData(d)}</small></> : formatarData(d)}</h2>
          <ul>
            {lista.filter((a) => a.inicio.startsWith(d)).map((a) => (
              <li key={a.id} className="agendado">
                <div>
                  <strong className="agendado-hora">{a.inicio.slice(11, 16)}</strong>
                  <span><strong>{a.clienteNome}</strong><br /><small className="suave">{a.servico}{variosProfissionais ? ` · ${a.profissional}` : ""}</small></span>
                </div>
                <form action={confirmarNoWhatsapp}>
                  <input type="hidden" name="id" value={a.id} />
                  {a.confirmacaoEm
                    ? <button className="agendado-feito" title="Mandar de novo"><Check size={16} aria-hidden /> Confirmação enviada</button>
                    : <button className="botao-whats-p"><MessageCircle size={16} aria-hidden /> Confirmar</button>}
                </form>
                <SinalDoHorario a={a} voltar={`/app/agendados${faltam ? "?faltam=1" : ""}`} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
