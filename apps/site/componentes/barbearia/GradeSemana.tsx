import Link from "next/link";
import { agoraNoFuso, diaDaSemana, nomeDia, paraMinutos, deMinutos, somarDias, type Barbearia, type Data } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";

const DIAS = 7;
/** Altura de cada linha da grade, em px (o CSS usa a mesma variável). */
const LINHA = 30;

/**
 * Agenda em tabela: horários na primeira coluna, dias na primeira linha e cada horário marcado
 * no lugar e no tamanho certos (início ao fim). Com mais de um profissional, cada dia ganha uma
 * coluna por profissional. A linha de agora fica marcada; o que já passou fica apagado.
 */
export function GradeSemana({ barbearia, inicio }: { barbearia: Barbearia; inicio: Data }) {
  const banco = obterAgenda();
  const agora = agoraNoFuso(barbearia.fuso);
  const hoje = agora.slice(0, 10) as Data;
  const minutoAgora = paraMinutos(agora.slice(11, 16));
  const expedientes = banco.expedientes(barbearia.id);
  const profissionais = banco.profissionais(barbearia.id, true);
  const varios = profissionais.length > 1;
  const colunasPorDia = varios ? profissionais.length : 1;

  const dias = Array.from({ length: DIAS }, (_, i) => somarDias(inicio, i)).map((d) => {
    const e = expedientes.get(diaDaSemana(d));
    return { d, e, fechado: !e || barbearia.fechadoEm === d };
  });
  const abertos = dias.filter((x) => !x.fechado && x.e);
  if (abertos.length === 0) return <p className="suave">Nenhum dia aberto nesta semana.</p>;

  // Passo da grade: o intervalo da agenda, sem passar de ~40 linhas (fica legível no celular).
  const de = Math.min(...abertos.map((x) => paraMinutos(x.e!.abre)));
  const ate = Math.max(...abertos.map((x) => paraMinutos(x.e!.fecha)));
  let passo = Math.max(15, barbearia.intervaloMin);
  while ((ate - de) / passo > 40) passo *= 2;
  const linhas = Array.from({ length: Math.ceil((ate - de) / passo) }, (_, i) => de + i * passo);
  // A grade anda de 5 em 5 minutos por baixo: horário quebrado (09:40) fica no lugar exato, sem encavalar.
  const sub = passo / 5;
  const linhaDe = (min: number) => Math.max(0, Math.round((min - de) / 5));

  const marcados = banco.agendamentosEntre(barbearia.id, inicio, somarDias(inicio, DIAS - 1));
  const bloqueios = banco.bloqueiosEntre(barbearia.id, inicio, somarDias(inicio, DIAS - 1));
  const colunaDo = (diaIdx: number, profissionalId?: number) =>
    2 + diaIdx * colunasPorDia + (varios && profissionalId ? Math.max(0, profissionais.findIndex((p) => p.id === profissionalId)) : 0);
  const cabecalho = varios ? 2 : 1;

  return (
    <div className="grade-semana" style={{ "--colunas": DIAS * colunasPorDia, "--linha": `${LINHA}px`, "--sub": sub } as React.CSSProperties}>
      {/* As linhas do cabeçalho têm altura própria; as de horário são as fatias de 5 minutos. */}
      <div className="grade" role="table" aria-label="Agenda da semana" style={{ gridTemplateRows: `repeat(${cabecalho}, auto)` }}>
        <div className="grade-canto" style={{ gridRow: `1 / span ${cabecalho}` }} />
        {dias.map((x, i) => (
          <div key={x.d} role="columnheader" className={`grade-dia ${x.d === hoje ? "hoje" : ""} ${x.fechado ? "fechado" : ""}`}
            style={{ gridColumn: `${2 + i * colunasPorDia} / span ${colunasPorDia}`, gridRow: 1 }}>
            <Link href={`/app?data=${x.d}#dia`}>
              <strong>{x.d === hoje ? "Hoje" : nomeDia(diaDaSemana(x.d)).slice(0, 3)}</strong>
              <span>{x.d.slice(8)}/{x.d.slice(5, 7)}</span>
            </Link>
          </div>
        ))}
        {varios && dias.flatMap((x, i) => profissionais.map((p, j) => (
          <div key={`${x.d}-${p.id}`} className="grade-prof" style={{ gridColumn: 2 + i * colunasPorDia + j, gridRow: 2 }}>{p.nome.split(" ")[0]}</div>
        )))}

        {linhas.map((m, r) => (
          <div key={m} role="rowheader" className={`grade-hora ${hoje >= inicio && minutoAgora >= m && minutoAgora < m + passo ? "agora" : ""}`}
            style={{ gridRow: `${cabecalho + 1 + r * sub} / span ${sub}` }}>{deMinutos(m)}</div>
        ))}

        {/* Fundo de cada célula: fora do expediente, já passou ou linha de agora. */}
        {dias.flatMap((x, i) => linhas.map((m, r) => {
          // Fora do expediente ou no intervalo (almoço): hachurado.
          const pausa = !!x.e?.pausaInicio && !!x.e.pausaFim && m >= paraMinutos(x.e.pausaInicio) && m < paraMinutos(x.e.pausaFim);
          const fora = x.fechado || !x.e || m < paraMinutos(x.e.abre) || m >= paraMinutos(x.e.fecha) || pausa;
          const passou = x.d < hoje || (x.d === hoje && m + passo <= minutoAgora);
          const agoraAqui = x.d === hoje && minutoAgora >= m && minutoAgora < m + passo;
          return (
            <div key={`${x.d}-${m}`} className={`grade-celula ${fora ? "fora" : ""} ${passou ? "passou" : ""} ${agoraAqui ? "agora" : ""}`}
              style={{ gridColumn: `${2 + i * colunasPorDia} / span ${colunasPorDia}`, gridRow: `${cabecalho + 1 + r * sub} / span ${sub}` }} />
          );
        }))}

        {bloqueios.flatMap((f) => {
          const i = dias.findIndex((x) => x.d === f.inicio.slice(0, 10));
          if (i < 0) return [];
          const ini = Math.max(de, paraMinutos(f.inicio.slice(11, 16)));
          const fim = Math.min(ate, f.fim.slice(0, 10) > f.inicio.slice(0, 10) ? ate : paraMinutos(f.fim.slice(11, 16)));
          if (fim <= ini) return [];
          const coluna = f.profissionalId ? `${colunaDo(i, f.profissionalId)}` : `${colunaDo(i)} / span ${colunasPorDia}`;
          return [(
            <div key={`b${f.id}-${i}`} className="grade-bloqueio" style={{ gridColumn: coluna, gridRow: `${cabecalho + 1 + linhaDe(ini)} / span ${Math.max(1, Math.round((fim - ini) / 5))}` }}>
              {f.motivo ?? "Bloqueado"}
            </div>
          )];
        })}

        {marcados.map((a) => {
          const i = dias.findIndex((x) => x.d === a.inicio.slice(0, 10));
          if (i < 0) return null;
          const ini = paraMinutos(a.inicio.slice(11, 16));
          const fim = paraMinutos(a.fim.slice(11, 16));
          const passou = a.fim.slice(0, 10) < hoje || (a.inicio.slice(0, 10) === hoje && fim <= minutoAgora);
          return (
            <Link key={a.id} href={`/app?data=${a.inicio.slice(0, 10)}#ag-${a.id}`} className={`grade-horario ${passou ? "passou" : ""}`}
              title={`${a.inicio.slice(11, 16)}–${a.fim.slice(11, 16)} · ${a.clienteNome} · ${a.servico}`}
              style={{ gridColumn: colunaDo(i, a.profissionalId), gridRow: `${cabecalho + 1 + linhaDe(ini)} / span ${Math.max(2, Math.round((Math.min(fim, ate) - Math.max(ini, de)) / 5))}` }}>
              <strong>{a.inicio.slice(11, 16)} {a.clienteNome.split(" ")[0]}</strong>
              <span>{a.servico}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
