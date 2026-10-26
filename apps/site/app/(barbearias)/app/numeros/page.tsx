import Link from "next/link";
import { agoraNoFuso } from "@aprenda/agenda";
import { exigirAcessoAtivo, obterAgenda, reais } from "@/lib/agenda";

export const metadata = { title: "Números do mês", robots: { index: false } };
export const dynamic = "force-dynamic";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function mudarMes(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a!, m! - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function pct(x: number): string {
  return x > 0 && x < 0.01 ? "menos de 1%" : `${Math.round(x * 100)}%`;
}

/** Três números que dizem se falta cliente novo, retorno ou organização (curso "Agenda cheia"). */
export default async function Numeros({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { barbearia } = await exigirAcessoAtivo();
  const { mes: pedido } = await searchParams;
  const atual = agoraNoFuso(barbearia.fuso).slice(0, 7);
  const mes = pedido && /^\d{4}-\d{2}$/.test(pedido) && pedido <= atual ? pedido : atual;
  const n = obterAgenda().numerosDoMes(barbearia.id, mes);
  const [a, m] = mes.split("-");
  const nomeMes = `${MESES[Number(m) - 1]} de ${a}`;
  const retorno = n.atendidos ? n.saiuComRetorno / n.atendidos : 0;

  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Números de {nomeMes}</h1>
      <nav className="navegacao">
        <Link href={`/app/numeros?mes=${mudarMes(mes, -1)}`}>← mês anterior</Link>
        <strong>{mes === atual ? "Este mês, até agora" : nomeMes}</strong>
        {mes < atual ? <Link href={`/app/numeros?mes=${mudarMes(mes, 1)}`}>próximo mês →</Link> : <span />}
      </nav>

      <div className="numeros">
        <div className="numero">
          <strong>{n.atendidos}</strong>
          <p>atendimentos{n.clientes ? ` de ${n.clientes} clientes` : ""}</p>
        </div>
        <div className="numero">
          <strong>{reais(n.faturamentoCentavos)}</strong>
          <p>em serviços atendidos (pelo preço atual de cada serviço)</p>
        </div>
        <div className="numero">
          <strong>{pct(retorno)}</strong>
          <p>saíram com o próximo horário marcado ({n.saiuComRetorno} de {n.atendidos})</p>
        </div>
        <div className="numero">
          <strong>{n.clientesQueVoltaram}</strong>
          <p>clientes que já tinham vindo antes e voltaram este mês</p>
        </div>
        <div className="numero">
          <strong>{n.faltas}</strong>
          <p>faltas{n.faltas ? `, ${reais(n.perdidoEmFaltasCentavos)} que não entraram` : ""}</p>
        </div>
        <div className="numero">
          <strong>{pct(n.ocupacao)}</strong>
          <p>da agenda ocupada (aproximado: tempo atendido ÷ expediente de quem atende)</p>
        </div>
      </div>

      <h2>O que fazer com isso</h2>
      <ul>
        <li><strong>Poucos saem com o próximo marcado?</strong> Use &quot;Marcar o próximo&quot; no fim de cada atendimento, com o cliente ainda na cadeira.</li>
        <li><strong>Muitas faltas?</strong> Mande os lembretes de amanhã, que aparecem na agenda de hoje.</li>
        <li><strong>Ocupação baixa?</strong> Falta cliente: peça avaliação no Google pra todo cliente e capriche nas fotos do site.</li>
      </ul>
      <p className="suave pequeno">
        Conta só o que passou pela agenda do sistema (inclusive o que você marca pelo painel). Faltas entram quando você toca em &quot;Faltou&quot;.
        Quer se aprofundar? Veja o curso grátis <a href="/cursos/agenda-cheia">Agenda cheia</a>.
      </p>
    </>
  );
}
