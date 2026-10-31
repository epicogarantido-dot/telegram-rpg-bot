import Link from "next/link";
import { agoraNoFuso, deMinutos, paraMinutos, type Barbearia, type Data } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";

/** Altura de cada linha (um intervalo da agenda), em px. */
const LINHA = 34;

/**
 * Agenda do dia em tabela: os profissionais nas colunas e as horas nas linhas, cada um com o
 * próprio horário (fora dele fica hachurado). Cada horário marcado ocupa do início ao fim; tocar
 * leva ao cartão dele. Horário livre tem "+": já abre o agendar com o profissional, o dia e a hora.
 * `so` mostra só um profissional (quem entrou com a senha dele).
 */
export function GradeDia({ barbearia, data, so }: { barbearia: Barbearia; data: Data; so?: number }) {
  const banco = obterAgenda();
  const agora = agoraNoFuso(barbearia.fuso);
  const hoje = agora.slice(0, 10) as Data;
  const minutoAgora = paraMinutos(agora.slice(11, 16));
  const profissionais = banco.profissionais(barbearia.id, true).filter((p) => !so || p.id === so);
  const colunas = profissionais.map((p) => ({ p, e: barbearia.fechadoEm === data ? undefined : banco.expedienteDoProfissional(barbearia.id, p.id, data) }));
  const abertos = colunas.filter((c) => c.e);
  if (abertos.length === 0) return <p className="suave grade-vazia">Ninguém atende neste dia.</p>;

  const de = Math.min(...abertos.map((c) => paraMinutos(c.e!.abre)));
  const ate = Math.max(...abertos.map((c) => paraMinutos(c.e!.fecha)));
  let passo = Math.max(15, barbearia.intervaloMin);
  while ((ate - de) / passo > 48) passo *= 2;
  const linhas = Array.from({ length: Math.ceil((ate - de) / passo) }, (_, i) => de + i * passo);
  // Por baixo a grade anda de 5 em 5 minutos: horário quebrado (09:40) fica no lugar exato.
  const sub = passo / 5;
  const linhaDe = (min: number) => Math.max(0, Math.round((min - de) / 5));
  const coluna = (profissionalId: number) => 2 + Math.max(0, profissionais.findIndex((p) => p.id === profissionalId));

  const marcados = banco.agendamentosDoDia(barbearia.id, data, so).filter((a) => a.status !== "cancelado");
  const bloqueios = banco.bloqueiosDoDia(barbearia.id, data).filter((f) => !so || f.profissionalId === undefined || f.profissionalId === so);
  const ocupado = (pid: number, m: number) => marcados.some((a) => a.profissionalId === pid && paraMinutos(a.inicio.slice(11, 16)) < m + passo && paraMinutos(a.fim.slice(11, 16)) > m)
    || bloqueios.some((f) => (f.profissionalId === undefined || f.profissionalId === pid) && paraMinutos(f.inicio.slice(11, 16)) < m + passo && paraMinutos(f.fim.slice(11, 16)) > m);
  const agendar = (pid: number, m: number) => `/b/${barbearia.slug}/agendar?${new URLSearchParams({ profissional: String(pid), data, hora: deMinutos(m), com: String(pid) })}`;

  return (
    <div className="grade-semana grade-dia-tabela" style={{ "--colunas": profissionais.length, "--linha": `${LINHA}px`, "--sub": sub } as React.CSSProperties}>
      <div className="grade" role="table" aria-label={`Agenda do dia ${data.slice(8)}/${data.slice(5, 7)}`} style={{ gridTemplateRows: "auto" }}>
        <div className="grade-canto" style={{ gridRow: 1 }} />
        {profissionais.map((p, i) => (
          <div key={p.id} role="columnheader" className="grade-dia" style={{ gridColumn: 2 + i, gridRow: 1 }}>
            <span className="grade-dia-nome">{p.nome.split(" ")[0]}</span>
          </div>
        ))}

        {linhas.map((m, r) => (
          <div key={m} role="rowheader" className={`grade-hora ${data === hoje && minutoAgora >= m && minutoAgora < m + passo ? "agora" : ""}`}
            style={{ gridRow: `${2 + r * sub} / span ${sub}` }}>{deMinutos(m)}</div>
        ))}

        {colunas.flatMap(({ p, e }, i) => linhas.map((m, r) => {
          const pausa = !!e?.pausaInicio && !!e.pausaFim && m >= paraMinutos(e.pausaInicio) && m < paraMinutos(e.pausaFim);
          const fora = !e || m < paraMinutos(e.abre) || m >= paraMinutos(e.fecha) || pausa;
          const passou = data < hoje || (data === hoje && m + passo <= minutoAgora);
          const agoraAqui = data === hoje && minutoAgora >= m && minutoAgora < m + passo;
          const estilo = { gridColumn: 2 + i, gridRow: `${2 + r * sub} / span ${sub}` };
          const classe = `grade-celula ${fora ? "fora" : ""} ${passou ? "passou" : ""} ${agoraAqui ? "agora" : ""}`;
          // Livre, dentro do horário dele e ainda por vir: um toque começa a marcar ali.
          return !fora && !passou && !ocupado(p.id, m)
            ? <Link key={`${p.id}-${m}`} href={agendar(p.id, m)} className={`${classe} grade-livre`} style={estilo} aria-label={`Marcar com ${p.nome} às ${deMinutos(m)}`}><span aria-hidden>+</span></Link>
            : <div key={`${p.id}-${m}`} className={classe} style={estilo} />;
        }))}

        {bloqueios.flatMap((f) => {
          const ini = Math.max(de, paraMinutos(f.inicio.slice(11, 16)));
          const fim = Math.min(ate, paraMinutos(f.fim.slice(11, 16)));
          if (fim <= ini) return [];
          const alvo = f.profissionalId ? [f.profissionalId] : profissionais.map((p) => p.id);
          return alvo.filter((pid) => profissionais.some((p) => p.id === pid)).map((pid) => (
            <div key={`b${f.id}-${pid}`} className="grade-bloqueio" style={{ gridColumn: coluna(pid), gridRow: `${2 + linhaDe(ini)} / span ${Math.max(1, Math.round((fim - ini) / 5))}` }}>
              {f.motivo ?? "Bloqueado"}
            </div>
          ));
        })}

        {marcados.map((a) => {
          const ini = paraMinutos(a.inicio.slice(11, 16));
          const fim = paraMinutos(a.fim.slice(11, 16));
          const passou = data < hoje || (data === hoje && fim <= minutoAgora);
          return (
            <Link key={a.id} href={`/app?data=${data}#ag-${a.id}`} className={`grade-horario ${passou ? "passou" : ""} ${a.status === "faltou" ? "faltou" : ""}`}
              title={`${a.inicio.slice(11, 16)}–${a.fim.slice(11, 16)} · ${a.clienteNome} · ${a.servico}`}
              style={{ gridColumn: coluna(a.profissionalId), gridRow: `${2 + linhaDe(ini)} / span ${Math.max(2, Math.round((Math.min(fim, ate) - Math.max(ini, de)) / 5))}` }}>
              <strong>{a.inicio.slice(11, 16)} {a.clienteNome.split(" ")[0]}</strong>
              <span>{a.servico}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
