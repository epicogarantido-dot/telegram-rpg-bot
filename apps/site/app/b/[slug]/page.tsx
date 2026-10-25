import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { agoraNoFuso, dataValida, diaDaSemana, formatarData, nomeDia, somarDias } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { mensagemDeErro, obterAgenda, reais } from "../../../lib/agenda";

export const dynamic = "force-dynamic";
const DIAS_A_FRENTE = 14;

type Busca = { servico?: string; profissional?: string; data?: string; hora?: string; erro?: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  return { title: b ? `Agendar na ${b.nome}` : "Barbearia não encontrada" };
}

async function confirmar(form: FormData) {
  "use server";
  const slug = String(form.get("slug"));
  const b = obterAgenda().barbeariaPorSlug(slug);
  if (!b) notFound();
  const campos = {
    servico: String(form.get("servico")), profissional: String(form.get("profissional")),
    data: String(form.get("data")), hora: String(form.get("hora")),
  };
  const voltar = new URLSearchParams(campos);
  try {
    if (!dataValida(campos.data)) throw new Error("data");
    const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
    obterAgenda().agendar({
      barbeariaId: b.id, profissionalId: Number(campos.profissional), servicoId: Number(campos.servico),
      data: campos.data, hora: campos.hora, clienteNome: String(form.get("nome") ?? ""), clienteTelefone: telefone ?? "",
    });
  } catch (e) {
    voltar.set("erro", mensagemDeErro(e));
    redirect(`/b/${slug}?${voltar}`);
  }
  redirect(`/b/${slug}/confirmado?${voltar}`);
}

export default async function Agendar({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Busca> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug(slug);
  if (!b) notFound();

  const servicos = banco.servicos(b.id, true);
  const profissionais = banco.profissionais(b.id, true);
  const servico = servicos.find((s) => String(s.id) === sp.servico);
  const prof = profissionais.length === 1 ? profissionais[0] : profissionais.find((p) => String(p.id) === sp.profissional);
  const hoje = agoraNoFuso(b.fuso).slice(0, 10);
  const data = sp.data && dataValida(sp.data) && sp.data >= hoje ? sp.data : undefined;
  const expedientes = banco.expedientes(b.id);

  const link = (extra: Busca) => {
    const q = new URLSearchParams();
    const tudo = { servico: servico && String(servico.id), profissional: prof && String(prof.id), data, ...extra };
    for (const [k, v] of Object.entries(tudo)) if (v) q.set(k, v);
    return `/b/${slug}?${q}`;
  };

  const horarios = servico && prof && data ? banco.horariosLivres(b.id, prof.id, servico.id, data) : [];

  return (
    <>
      <section className="heroi" style={{ paddingBottom: 8 }}>
        <h1>{b.nome}</h1>
        {b.endereco && <p>📍 {b.endereco}</p>}
      </section>
      {sp.erro && <p className="erro">{sp.erro}</p>}

      <h2>1. Serviço</h2>
      <div className="opcoes">
        {servicos.map((s) => (
          <Link key={s.id} href={link({ servico: String(s.id), hora: undefined })} className={`opcao ${servico?.id === s.id ? "escolhida" : ""}`}>
            <strong>{s.nome}</strong><br /><small>{s.duracaoMin} min · {reais(s.precoCentavos)}</small>
          </Link>
        ))}
      </div>

      {servico && profissionais.length > 1 && (
        <>
          <h2>2. Profissional</h2>
          <div className="opcoes">
            {profissionais.map((p) => (
              <Link key={p.id} href={link({ profissional: String(p.id) })} className={`opcao ${prof?.id === p.id ? "escolhida" : ""}`}>
                {p.nome}
              </Link>
            ))}
          </div>
        </>
      )}

      {servico && prof && (
        <>
          <h2>{profissionais.length > 1 ? "3" : "2"}. Dia</h2>
          <div className="opcoes">
            {Array.from({ length: DIAS_A_FRENTE }, (_, i) => somarDias(hoje, i))
              .filter((d) => expedientes.has(diaDaSemana(d)))
              .map((d) => (
                <Link key={d} href={link({ data: d })} className={`opcao ${data === d ? "escolhida" : ""}`}>
                  {d === hoje ? "Hoje" : nomeDia(diaDaSemana(d))}<br /><small>{d.slice(8)}/{d.slice(5, 7)}</small>
                </Link>
              ))}
          </div>
        </>
      )}

      {servico && prof && data && (
        <>
          <h2>Horário — {formatarData(data)}</h2>
          {horarios.length === 0 ? <p>Sem horários livres neste dia. Tente outro.</p> : (
            <div className="opcoes">
              {horarios.map((h) => (
                <Link key={h} href={link({ hora: h })} className={`opcao ${sp.hora === h ? "escolhida" : ""}`}>{h}</Link>
              ))}
            </div>
          )}
        </>
      )}

      {servico && prof && data && sp.hora && horarios.includes(sp.hora) && (
        <>
          <h2>Seus dados</h2>
          <p>{servico.nome} com {prof.nome} · {formatarData(data)} às {sp.hora}</p>
          <form action={confirmar} className="formulario">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="servico" value={servico.id} />
            <input type="hidden" name="profissional" value={prof.id} />
            <input type="hidden" name="data" value={data} />
            <input type="hidden" name="hora" value={sp.hora} />
            <input name="nome" placeholder="Seu nome" required maxLength={80} autoComplete="name" />
            <input name="telefone" placeholder="Seu WhatsApp com DDD" required inputMode="tel" autoComplete="tel" />
            <button>Confirmar agendamento</button>
          </form>
        </>
      )}
    </>
  );
}
