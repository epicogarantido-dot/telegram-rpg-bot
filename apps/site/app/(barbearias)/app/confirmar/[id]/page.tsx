import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MessageCircle } from "lucide-react";
import { formatarData } from "@aprenda/agenda";
import { exigirAcessoAtivo, obterAgenda, podeMexer } from "@/lib/agenda";
import { urlFoto } from "@/lib/barbearias";
import { linkDeConfirmacao } from "../../acoes-whatsapp";
import { FormWhats } from "@/componentes/painel/FormWhats";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { SinalDoHorario } from "@/componentes/barbearia/SinalDoHorario";

export const metadata = { title: "Horário novo", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Abre quando o barbeiro toca no aviso de horário novo: quem marcou, o quê e quando, e o botão
 * que abre o WhatsApp DELE na conversa do cliente com a confirmação pronta (quem envia é ele).
 */
export default async function ConfirmarHorario({ params }: { params: Promise<{ id: string }> }) {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  const a = obterAgenda().agendamento(barbearia.id, Number((await params).id));
  if (!a || !podeMexer(usuario, a)) notFound();
  const data = a.inicio.slice(0, 10);
  const cancelado = a.status === "cancelado";

  return (
    <section className="confirmar-horario">
      <p><Link href={`/app?data=${data}#ag-${a.id}`}>← Ver na agenda</Link></p>
      <h1>{cancelado ? "Horário cancelado" : "Horário marcado"}</h1>
      <div className="cartao confirmar-cartao">
        <p className="confirmar-quando">{formatarData(data)} às {a.inicio.slice(11, 16)}</p>
        <p><strong>{a.clienteNome}</strong></p>
        <p className="suave">{a.servico} com {a.profissional}</p>
        {a.referenciaFoto && (
          <p className="confirmar-foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlFoto(a.referenciaFoto, "p")} alt="Corte que o cliente escolheu" width={96} height={96} />
            <span className="suave pequeno">Corte que ele escolheu</span>
          </p>
        )}
        <SinalDoHorario a={a} voltar={`/app/confirmar/${a.id}`} />
      </div>
      {!cancelado && (
        <>
          <p>Mande a confirmação pro cliente pelo seu WhatsApp. A mensagem já vai pronta: é só tocar em enviar.</p>
          <FormWhats acao={linkDeConfirmacao}>
            <input type="hidden" name="id" value={a.id} />
            <BotaoEnviar className="botao botao-grande" carregando="Abrindo o WhatsApp…">
              {a.confirmacaoEm ? <><Check size={18} aria-hidden /> Mandar a confirmação de novo</> : <><MessageCircle size={18} aria-hidden /> Confirmar no WhatsApp</>}
            </BotaoEnviar>
          </FormWhats>
          {a.confirmacaoEm && <p className="suave pequeno">Confirmação já aberta no WhatsApp.</p>}
        </>
      )}
    </section>
  );
}
