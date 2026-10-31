import Link from "next/link";
import { agoraNoFuso } from "@aprenda/agenda";
import { exigirDono, obterAgenda, reais } from "@/lib/agenda";
import { soEntrega } from "@/lib/modo";

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
  const { barbearia } = await exigirDono();
  const { mes: pedido } = await searchParams;
  const atual = agoraNoFuso(barbearia.fuso).slice(0, 7);
  const mes = pedido && /^\d{4}-\d{2}$/.test(pedido) && pedido <= atual ? pedido : atual;
  const n = obterAgenda().numerosDoMes(barbearia.id, mes);
  const divisao = obterAgenda().divisaoDoMes(barbearia.id, mes);
  const divide = divisao.some((d) => d.partePct !== undefined);
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

      {divisao.length > 1 || divide ? (
        <>
          <h2>Por profissional</h2>
          <div className="tabela-rolavel">
            <table className="tabela-divisao">
              <thead>
                <tr><th>Profissional</th><th>Atendimentos</th><th>Total</th>{divide && <><th>Parte dele</th><th>Parte da casa</th></>}</tr>
              </thead>
              <tbody>
                {divisao.map((d) => (
                  <tr key={d.profissionalId}>
                    <td>{d.nome}{d.partePct !== undefined && <small className="suave"> ({d.partePct}%)</small>}</td>
                    <td>{d.atendidos}</td>
                    <td>{reais(d.totalCentavos)}</td>
                    {divide && <><td>{d.parteProfissionalCentavos !== undefined ? reais(d.parteProfissionalCentavos) : "—"}</td><td>{d.parteBarbeariaCentavos !== undefined ? reais(d.parteBarbeariaCentavos) : "—"}</td></>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="suave pequeno">
            Pelo preço atual de cada serviço, só o que foi atendido (faltas não entram). A porcentagem de cada um você define em <Link href="/app/config">Configurações</Link>.
            Barbeiro parceiro precisa de contrato escrito e homologado: {soEntrega() ? "combine" : <>veja o guia <a href="/revista/barbeiro-parceiro-lei-do-salao-parceiro">Barbeiro parceiro</a> e combine</>} com seu contador.
          </p>
        </>
      ) : null}

      <h2>O que fazer com isso</h2>
      <ul>
        <li><strong>Poucos saem com o próximo marcado?</strong> Use &quot;Marcar o próximo&quot; no fim de cada atendimento, com o cliente ainda na cadeira.</li>
        <li><strong>Muitas faltas?</strong> Mande os lembretes de amanhã, que aparecem na agenda de hoje.</li>
        <li><strong>Ocupação baixa?</strong> Falta cliente: peça avaliação no Google pra todo cliente e capriche nas fotos do site.</li>
      </ul>
      <p className="suave pequeno">
        Conta só o que passou pela agenda do sistema (inclusive o que você marca pelo painel). Faltas entram quando você toca em &quot;Faltou&quot;.
        {!soEntrega() && <> Quer se aprofundar? Veja o curso grátis <a href="/cursos/agenda-cheia">Agenda cheia</a>.</>}
      </p>
    </>
  );
}
