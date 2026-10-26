import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { ChevronRight } from "lucide-react";
import { agoraNoFuso, dataValida, diaDaSemana, formatarData, nomeDia, somarDias, type BancoAgenda, type Data } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { avisarMudancaDoCliente, avisarNovoAgendamento, avisarRajada } from "@/lib/avisos";
import { CAMPO_ISCA, ehOBarbeiro, ErroRajada, primeiraRajadaDaHora, protegerAgendamento, protegerMudanca } from "@/lib/protecao";

export const dynamic = "force-dynamic";
const DIAS_A_FRENTE = 14;

/**
 * Agendar em 3 passos: serviço → dia e horário → nome e WhatsApp.
 * - `profissional` é só o filtro ("qualquer um" quando vazio);
 * - `com` é quem vai atender no horário escolhido (resolvido ao tocar no horário).
 * - `remarcar` é o token do link do cliente: mesmo fluxo, mas no fim troca o horário.
 * Tudo por link (funciona sem JavaScript) e cada passo é uma tela.
 */
type Busca = { servico?: string; profissional?: string; data?: string; hora?: string; com?: string; remarcar?: string; erro?: string };

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
  let token = "";
  // O barbeiro logado marcando pra um cliente não passa pelas travas do site.
  const peloBarbeiro = await ehOBarbeiro(b.id);
  try {
    if (!dataValida(campos.data)) throw new Error("data");
    const protecao = peloBarbeiro ? undefined : await protegerAgendamento(b.id, form);
    const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
    const id = obterAgenda().agendar({
      barbeariaId: b.id, profissionalId: Number(campos.com), servicoId: Number(campos.servico),
      data: campos.data, hora: campos.hora, clienteNome: String(form.get("nome") ?? ""), clienteTelefone: telefone ?? "",
      peloBarbeiro,
    });
    protecao?.registrar();
    // Link secreto do cliente (ver, cancelar, remarcar). Só o hash fica no banco.
    token = obterAgenda().criarLinkCliente(b.id, id);
    // Aviso no celular do barbeiro depois da resposta: o cliente não espera por ele.
    after(() => avisarNovoAgendamento(b.id, id).catch((e) => console.error("Aviso não enviado:", e)));
  } catch (e) {
    if (e instanceof ErroRajada && primeiraRajadaDaHora(b.id)) after(() => avisarRajada(b.id).catch(() => {}));
    voltar.set("erro", mensagemDeErro(e));
    redirect(`/b/${slug}/agendar?${voltar}`);
  }
  redirect(`/b/${slug}/h/${token}?novo=1`);
}

async function trocar(form: FormData) {
  "use server";
  const slug = String(form.get("slug"));
  const token = String(form.get("remarcar"));
  const b = obterAgenda().barbeariaPorSlug(slug);
  if (!b) notFound();
  const campos = { servico: String(form.get("servico")), data: String(form.get("data")), hora: String(form.get("hora")), com: String(form.get("com")), remarcar: token };
  try {
    if (!dataValida(campos.data)) throw new Error("data");
    await protegerMudanca();
    const r = obterAgenda().remarcarPeloCliente(b.id, token, { profissionalId: Number(campos.com), data: campos.data, hora: campos.hora });
    const prof = obterAgenda().profissionais(b.id).find((p) => p.id === Number(campos.com))?.nome ?? r.antes.profissional;
    after(() => avisarMudancaDoCliente(b.id, { tipo: "remarcou", id: r.antes.id, cliente: r.antes.clienteNome, servico: r.antes.servico, inicio: r.antes.inicio, novoInicio: r.depois, profissional: prof })
      .catch((e) => console.error("Aviso não enviado:", e)));
  } catch (e) {
    redirect(`/b/${slug}/agendar?${new URLSearchParams({ ...campos, erro: mensagemDeErro(e) })}`);
  }
  redirect(`/b/${slug}/h/${token}?remarcado=1`);
}

/** Horários livres do dia somando os profissionais escolhidos; cada horário leva o primeiro livre. */
function vagasDoDia(banco: BancoAgenda, barbeariaId: number, servicoId: number, profissionais: number[], data: Data, ignorarId?: number) {
  const livres = new Map<string, number>();
  for (const p of profissionais) {
    for (const h of banco.horariosLivres(barbeariaId, p, servicoId, data, undefined, ignorarId)) if (!livres.has(h)) livres.set(h, p);
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

  if (b.atendimento === "chegada") {
    return (
      <section className="b-secao b-indisponivel b-agendar">
        <h1>Atendimento por ordem de chegada</h1>
        <p>A {b.nome} não marca horário: é só chegar. Veja se está aberto e o tamanho da fila na página inicial.</p>
        <Link className="b-botao" href={`/b/${slug}`}>Ver se está aberto</Link>
      </section>
    );
  }

  const servicos = banco.servicos(b.id, true);
  const profissionais = banco.profissionais(b.id, true);
  // Remarcando: o serviço é o do horário (mesmo se saiu do cardápio depois).
  const remarcando = sp.remarcar ? banco.horarioDoCliente(b.id, sp.remarcar) : undefined;
  if (sp.remarcar && (!remarcando || remarcando.status !== "confirmado" || remarcando.passou)) {
    redirect(remarcando ? `/b/${slug}/h/${sp.remarcar}` : `/b/${slug}/agendar`);
  }
  const servico = remarcando
    ? banco.servicos(b.id).find((s) => s.id === remarcando.servicoId)
    : servicos.length === 1 ? servicos[0] : servicos.find((s) => String(s.id) === sp.servico);
  const filtro = profissionais.find((p) => String(p.id) === sp.profissional);
  const hoje = agoraNoFuso(b.fuso).slice(0, 10);
  const base = `/b/${slug}/agendar`;

  const link = (extra: Busca) => {
    const tudo: Busca = { servico: servico && String(servico.id), profissional: filtro && String(filtro.id), data: sp.data, remarcar: remarcando && sp.remarcar, ...extra };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(tudo)) if (v) q.set(k, v);
    return `${base}?${q}`;
  };

  // ---------- Passo 1: serviço ----------
  if (!servico) {
    return (
      <div className="b-secao b-agendar">
        <Cabeca rotulo={`Passo 1 de 3 · ${b.nome}`} titulo="O que vai ser?" />
        <ul className="b-lista-servicos">
          {servicos.map((s) => (
            <li key={s.id}>
              <Link href={link({ servico: String(s.id), data: undefined })}>
                <span className="b-lista-nome">{s.nome}</span>
                <span className="b-lista-info">{s.duracaoMin} min</span>
                {b.mostrarPrecos && <span className="b-lista-preco">{reais(s.precoCentavos)}</span>}
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
  const horaValida = !!(data && sp.hora && com && banco.horariosLivres(b.id, com.id, servico.id, data, undefined, remarcando?.id).includes(sp.hora));
  const quandoAtual = remarcando && `${formatarData(remarcando.inicio.slice(0, 10))} às ${remarcando.inicio.slice(11, 16)}`;

  // ---------- Remarcar, passo final: confirmar a troca ----------
  if (remarcando && horaValida && data && com && sp.hora) {
    return (
      <div className="b-secao b-agendar">
        <Cabeca rotulo={`Remarcar · ${b.nome}`} titulo="Confirme a troca" />
        {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
        <div className="b-resumo">
          <p className="b-resumo-antes">De: {quandoAtual}</p>
          <p className="b-resumo-quando">Para: {formatarData(data)} às {sp.hora}</p>
          <p>{servico.nome} com {com.nome}</p>
          <Link href={link({ hora: undefined, com: undefined, data })}>Escolher outro</Link>
        </div>
        <form action={trocar} className="formulario b-form-agendar">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="remarcar" value={sp.remarcar} />
          <input type="hidden" name="servico" value={servico.id} />
          <input type="hidden" name="com" value={com.id} />
          <input type="hidden" name="data" value={data} />
          <input type="hidden" name="hora" value={sp.hora} />
          <BotaoEnviar className="b-botao" carregando="Trocando…">Trocar para este horário</BotaoEnviar>
        </form>
      </div>
    );
  }

  // ---------- Passo 3: nome e WhatsApp ----------
  if (horaValida && data && com && sp.hora) {
    return (
      <div className="b-secao b-agendar">
        <Cabeca rotulo={`Passo 3 de 3 · ${b.nome}`} titulo="Confirme seu horário" />
        {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
        <div className="b-resumo">
          <p className="b-resumo-quando">{formatarData(data)} às {sp.hora}</p>
          <p>{servico.nome} com {com.nome}{b.mostrarPrecos && ` · ${reais(servico.precoCentavos)}`}</p>
          <Link href={link({ hora: undefined, com: undefined, data })}>Trocar horário</Link>
        </div>
        <form action={confirmar} className="formulario b-form-agendar">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="servico" value={servico.id} />
          <input type="hidden" name="profissional" value={filtro?.id ?? ""} />
          <input type="hidden" name="com" value={com.id} />
          <input type="hidden" name="data" value={data} />
          <input type="hidden" name="hora" value={sp.hora} />
          {/* Isca pra robô: ninguém vê nem alcança pelo teclado. */}
          <div className="b-isca" aria-hidden="true">
            <label>Empresa <input name={CAMPO_ISCA} tabIndex={-1} autoComplete="off" /></label>
          </div>
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
    .map((d) => ({ d, vagas: vagasDoDia(banco, b.id, servico.id, ids, d, remarcando?.id), aberto: banco.expedientes(b.id).has(diaDaSemana(d)) }))
    .filter((x) => x.aberto);
  const escolhido = dias.find((x) => x.d === data) ?? dias.find((x) => x.vagas.length > 0);
  const rotuloDia = (d: Data) => (d === hoje ? "Hoje" : d === somarDias(hoje, 1) ? "Amanhã" : nomeDia(diaDaSemana(d)).slice(0, 3));

  return (
    <div className="b-secao b-agendar">
      {remarcando
        ? <Cabeca rotulo={`Remarcar · ${b.nome}`} titulo="Escolha o novo horário" />
        : <Cabeca rotulo={`Passo 2 de 3 · ${b.nome}`} titulo="Escolha o horário" />}
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
      {remarcando ? (
        <p className="b-escolhido">
          {servico.nome} · horário atual: {quandoAtual} · <Link href={`/b/${slug}/h/${sp.remarcar}`}>Manter esse</Link>
        </p>
      ) : (
        <p className="b-escolhido">
          {servico.nome} · {servico.duracaoMin} min{b.mostrarPrecos && ` · ${reais(servico.precoCentavos)}`}
          {servicos.length > 1 && <> · <Link href={`${base}${filtro ? `?profissional=${filtro.id}` : ""}`}>Trocar</Link></>}
        </p>
      )}

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
        <p>Sem horários livres nos próximos {DIAS_A_FRENTE} dias.{b.telefone && <> <a href={`https://wa.me/${b.telefone}`} target="_blank" rel="noopener noreferrer">Fale com a barbearia no WhatsApp</a>.</>}</p>
      )}
    </div>
  );
}

function Cabeca({ rotulo, titulo }: { rotulo: string; titulo: string }) {
  return (
    <header className="b-cabeca-pagina">
      <p className="b-passo">{rotulo}</p>
      <h1>{titulo}</h1>
    </header>
  );
}
