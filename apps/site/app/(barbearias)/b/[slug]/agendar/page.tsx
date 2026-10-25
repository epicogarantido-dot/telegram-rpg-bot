import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { ChevronRight } from "lucide-react";
import { agoraNoFuso, dataValida, diaDaSemana, formatarData, nomeDia, somarDias, type BancoAgenda, type Data } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { avisarNovoAgendamento } from "@/lib/avisos";

export const dynamic = "force-dynamic";
const DIAS_A_FRENTE = 14;

/**
 * Agendar em 3 passos: serviço → dia e horário → nome e WhatsApp.
 * - `profissional` é só o filtro ("qualquer um" quando vazio);
 * - `com` é quem vai atender no horário escolhido (resolvido ao tocar no horário).
 * Tudo por link (funciona sem JavaScript) e cada passo é uma tela.
 */
type Busca = { servico?: string; profissional?: string; data?: string; hora?: string; com?: string; erro?: string };

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
    servico: String(form.get("servico")), profissional: String(form.get("profissional") ?? ""),
    data: String(form.get("data")), hora: String(form.get("hora")), com: String(form.get("com")),
  };
  const voltar = new URLSearchParams(campos);
  try {
    if (!dataValida(campos.data)) throw new Error("data");
    const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
    const id = obterAgenda().agendar({
      barbeariaId: b.id, profissionalId: Number(campos.com), servicoId: Number(campos.servico),
      data: campos.data, hora: campos.hora, clienteNome: String(form.get("nome") ?? ""), clienteTelefone: telefone ?? "",
    });
    // Aviso no celular do barbeiro depois da resposta: o cliente não espera por ele.
    after(() => avisarNovoAgendamento(b.id, id).catch((e) => console.error("Aviso não enviado:", e)));
  } catch (e) {
    voltar.set("erro", mensagemDeErro(e));
    redirect(`/b/${slug}/agendar?${voltar}`);
  }
  const ok = new URLSearchParams({ servico: campos.servico, profissional: campos.com, data: campos.data, hora: campos.hora });
  redirect(`/b/${slug}/confirmado?${ok}`);
}

/** Horários livres do dia somando os profissionais escolhidos; cada horário leva o primeiro livre. */
function vagasDoDia(banco: BancoAgenda, barbeariaId: number, servicoId: number, profissionais: number[], data: Data) {
  const livres = new Map<string, number>();
  for (const p of profissionais) {
    for (const h of banco.horariosLivres(barbeariaId, p, servicoId, data)) if (!livres.has(h)) livres.set(h, p);
  }
  return [...livres].sort(([a], [b]) => a.localeCompare(b));
}

export default async function Agendar({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Busca> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug(slug);
  if (!b) notFound();
  if (!banco.acessoAtivo(b)) {
    return (
      <section className="b-secao b-indisponivel">
        <h1>{b.nome}</h1>
        <p>A agenda online está temporariamente indisponível. Fale direto com a barbearia:</p>
        <a className="b-botao" href={`https://wa.me/${b.telefone}`} target="_blank" rel="noopener noreferrer">WhatsApp da barbearia</a>
      </section>
    );
  }

  const servicos = banco.servicos(b.id, true);
  const profissionais = banco.profissionais(b.id, true);
  const servico = servicos.length === 1 ? servicos[0] : servicos.find((s) => String(s.id) === sp.servico);
  const filtro = profissionais.find((p) => String(p.id) === sp.profissional);
  const hoje = agoraNoFuso(b.fuso).slice(0, 10);
  const base = `/b/${slug}/agendar`;

  const link = (extra: Busca) => {
    const tudo: Busca = { servico: servico && String(servico.id), profissional: filtro && String(filtro.id), data: sp.data, ...extra };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(tudo)) if (v) q.set(k, v);
    return `${base}?${q}`;
  };

  // ---------- Passo 1: serviço ----------
  if (!servico) {
    return (
      <div className="b-secao b-agendar">
        <Cabeca nome={b.nome} passo={1} titulo="O que vai ser?" />
        <ul className="b-lista-servicos">
          {servicos.map((s) => (
            <li key={s.id}>
              <Link href={link({ servico: String(s.id), data: undefined })}>
                <span className="b-lista-nome">{s.nome}</span>
                <span className="b-lista-info">{s.duracaoMin} min</span>
                <span className="b-lista-preco">{reais(s.precoCentavos)}</span>
                <ChevronRight size={18} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const ids = filtro ? [filtro.id] : profissionais.map((p) => p.id);
  const com = profissionais.find((p) => String(p.id) === sp.com);
  const data = sp.data && dataValida(sp.data) && sp.data >= hoje ? sp.data : undefined;
  const horaValida = !!(data && sp.hora && com && banco.horariosLivres(b.id, com.id, servico.id, data).includes(sp.hora));

  // ---------- Passo 3: nome e WhatsApp ----------
  if (horaValida && data && com && sp.hora) {
    return (
      <div className="b-secao b-agendar">
        <Cabeca nome={b.nome} passo={3} titulo="Confirme seu horário" />
        {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
        <div className="b-resumo">
          <p className="b-resumo-quando">{formatarData(data)} às {sp.hora}</p>
          <p>{servico.nome} com {com.nome} · {reais(servico.precoCentavos)}</p>
          <Link href={link({ hora: undefined, com: undefined, data })}>Trocar horário</Link>
        </div>
        <form action={confirmar} className="formulario b-form-agendar">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="servico" value={servico.id} />
          <input type="hidden" name="profissional" value={filtro?.id ?? ""} />
          <input type="hidden" name="com" value={com.id} />
          <input type="hidden" name="data" value={data} />
          <input type="hidden" name="hora" value={sp.hora} />
          <label htmlFor="nome">Seu nome</label>
          <input id="nome" name="nome" required maxLength={80} autoComplete="name" />
          <label htmlFor="telefone">Seu WhatsApp com DDD</label>
          <input id="telefone" name="telefone" required inputMode="tel" autoComplete="tel-national" placeholder="(19) 99999-0000" aria-describedby="telefone-dica" />
          <small id="telefone-dica" className="b-dica">A barbearia usa esse número pra confirmar ou avisar sobre o seu horário.</small>
          <BotaoEnviar className="b-botao" carregando="Confirmando…">Confirmar horário</BotaoEnviar>
        </form>
      </div>
    );
  }

  // ---------- Passo 2: dia e horário ----------
  const dias = Array.from({ length: DIAS_A_FRENTE }, (_, i) => somarDias(hoje, i))
    .map((d) => ({ d, vagas: vagasDoDia(banco, b.id, servico.id, ids, d), aberto: banco.expedientes(b.id).has(diaDaSemana(d)) }))
    .filter((x) => x.aberto);
  const escolhido = dias.find((x) => x.d === data) ?? dias.find((x) => x.vagas.length > 0);
  const rotuloDia = (d: Data) => (d === hoje ? "Hoje" : d === somarDias(hoje, 1) ? "Amanhã" : nomeDia(diaDaSemana(d)).slice(0, 3));

  return (
    <div className="b-secao b-agendar">
      <Cabeca nome={b.nome} passo={2} titulo="Escolha o horário" />
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
      <p className="b-escolhido">
        {servico.nome} · {servico.duracaoMin} min · {reais(servico.precoCentavos)}
        {servicos.length > 1 && <> · <Link href={`${base}${filtro ? `?profissional=${filtro.id}` : ""}`}>Trocar</Link></>}
      </p>

      {profissionais.length > 1 && (
        <nav className="b-chips" aria-label="Profissional">
          <Link href={link({ profissional: undefined })} className={`opcao ${!filtro ? "escolhida" : ""}`} aria-current={!filtro ? "true" : undefined}>Qualquer um</Link>
          {profissionais.map((p) => (
            <Link key={p.id} href={link({ profissional: String(p.id) })} className={`opcao ${filtro?.id === p.id ? "escolhida" : ""}`} aria-current={filtro?.id === p.id ? "true" : undefined}>
              {p.nome.split(" ")[0]}
            </Link>
          ))}
        </nav>
      )}

      <nav className="b-dias" aria-label="Dia">
        {dias.map(({ d, vagas }) => {
          const atual = escolhido?.d === d;
          const conteudo = <><span>{rotuloDia(d)}</span><strong>{d.slice(8)}/{d.slice(5, 7)}</strong></>;
          return vagas.length === 0
            ? <span key={d} className="b-dia lotado" title="Sem horários">{conteudo}<small>lotado</small></span>
            : <Link key={d} href={link({ data: d })} className={`b-dia ${atual ? "escolhido" : ""}`} aria-current={atual ? "date" : undefined}>{conteudo}</Link>;
        })}
      </nav>

      {escolhido ? (
        <>
          <h2 className="b-dia-titulo">{formatarData(escolhido.d)}</h2>
          <ul className="b-horas">
            {escolhido.vagas.map(([h, p]) => (
              <li key={h}><Link href={link({ data: escolhido.d, hora: h, com: String(p) })}>{h}</Link></li>
            ))}
          </ul>
        </>
      ) : (
        <p>Sem horários livres nos próximos {DIAS_A_FRENTE} dias. <a href={`https://wa.me/${b.telefone}`} target="_blank" rel="noopener noreferrer">Fale com a barbearia no WhatsApp</a>.</p>
      )}
    </div>
  );
}

function Cabeca({ nome, passo, titulo }: { nome: string; passo: number; titulo: string }) {
  return (
    <header className="b-cabeca-pagina">
      <p className="b-passo">Passo {passo} de 3 · {nome}</p>
      <h1>{titulo}</h1>
    </header>
  );
}
