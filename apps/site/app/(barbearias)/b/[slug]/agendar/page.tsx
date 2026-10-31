import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { Check, Scissors, Sparkles } from "lucide-react";
import { agoraNoFuso, CATEGORIAS_REFERENCIA, ErroAgenda, MAX_ADICIONAIS, dataValida, diaDaSemana, formatarData, nomeDia, somarDias, type BancoAgenda, type Data } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { ehCorte, fotosDosServicos, GRUPOS_SERVICO, grupoDoServico, urlFoto } from "@/lib/barbearias";
import { avisarMudancaDoCliente, avisarNovoAgendamento, avisarRajada } from "@/lib/avisos";
import { CAMPO_ISCA, ehOBarbeiro, profissionalLogado, ErroRajada, primeiraRajadaDaHora, protegerAgendamento, protegerMudanca } from "@/lib/protecao";

export const dynamic = "force-dynamic";
const DIAS_A_FRENTE = 14;
/** Nome e WhatsApp digitados voltam no formulário se marcar der erro (10 min, só neste aparelho). */
const RASCUNHO = "agendar_rascunho";

/**
 * Agendar em 3 passos: serviço → dia e horário → nome e WhatsApp.
 * - `profissional` é só o filtro ("qualquer um" quando vazio);
 * - `com` é quem vai atender no horário escolhido (resolvido ao tocar no horário).
 * - `remarcar` é o token do link do cliente: mesmo fluxo, mas no fim troca o horário.
 * - `extra` são os adicionais (barba, sobrancelha), repetido na URL; `ad=1` diz que o cliente já respondeu.
 * - Passo 1 são os grupos (Barba, Cabelo, Sobrancelha, Pigmentação, Platinado, Acabamento): tocar abre
 *   os serviços do grupo (`grupo`), escolher volta pros grupos com a frase do que vai ser feito e o valor.
 *   A escolha anda em `sel`; "Escolher o horário" vira `servico` (o corte, se tiver) + `extra`.
 * Tudo por link (funciona sem JavaScript) e cada passo é uma tela.
 */
type Busca = {
  servico?: string; profissional?: string; data?: string; hora?: string; com?: string; remarcar?: string; erro?: string; ad?: string;
  extra?: string | string[];
  /** Foto do corte escolhido na vitrine: vira a referência do horário sem o cliente escolher de novo. */
  foto?: string;
  /** "Não vou cortar" antigo: o que a pessoa marcou (links velhos). */
  escolha?: string | string[];
  /** Passo 1: serviços escolhidos até agora (um por serviço) e o grupo aberto. */
  sel?: string | string[];
  grupo?: string;
};

/** `extra` vem uma vez por adicional; vira lista de ids. */
function lerExtras(extra: string | string[] | undefined): number[] {
  return (Array.isArray(extra) ? extra : extra ? [extra] : []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
}

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
  const extras = form.getAll("extra").map(String);
  const voltar = new URLSearchParams(campos);
  voltar.set("ad", "1");
  const referencia = String(form.get("referencia") ?? "");
  if (referencia) voltar.set("foto", referencia);
  for (const x of extras) voltar.append("extra", x);
  let token = "";
  // O barbeiro logado marcando pra um cliente não passa pelas travas do site.
  const peloBarbeiro = await ehOBarbeiro(b.id);
  try {
    if (!dataValida(campos.data)) throw new Error("data");
    // Barbeiro da equipe só marca na agenda dele (a tela já esconde os outros; aqui é a trava).
    const so = await profissionalLogado(b.id);
    if (so && Number(campos.com) !== so) throw new ErroAgenda("Você só marca horários na sua agenda.");
    const protecao = peloBarbeiro ? undefined : await protegerAgendamento(b.id, form);
    const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
    const id = obterAgenda().agendar({
      barbeariaId: b.id, profissionalId: Number(campos.com), servicoId: Number(campos.servico),
      data: campos.data, hora: campos.hora, clienteNome: String(form.get("nome") ?? ""), clienteTelefone: telefone ?? "",
      peloBarbeiro, referenciaFoto: String(form.get("referencia") ?? "") || undefined,
      enderecoCliente: String(form.get("endereco") ?? "") || undefined,
      adicionais: lerExtras(extras),
    });
    protecao?.registrar();
    // Link secreto do cliente (ver, cancelar, remarcar). Só o hash fica no banco.
    token = obterAgenda().criarLinkCliente(b.id, id);
    // Aviso no celular do barbeiro depois da resposta: o cliente não espera por ele.
    after(() => avisarNovoAgendamento(b.id, id).catch((e) => console.error("Aviso não enviado:", e)));
  } catch (e) {
    if (e instanceof ErroRajada && primeiraRajadaDaHora(b.id)) after(() => avisarRajada(b.id).catch(() => {}));
    const rascunho = { nome: String(form.get("nome") ?? "").slice(0, 80), telefone: String(form.get("telefone") ?? "").slice(0, 20), endereco: String(form.get("endereco") ?? "").slice(0, 200) };
    (await cookies()).set(RASCUNHO, JSON.stringify(rascunho), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    voltar.set("erro", mensagemDeErro(e));
    redirect(`/b/${slug}/agendar?${voltar}`);
  }
  (await cookies()).delete(RASCUNHO);
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
function vagasDoDia(banco: BancoAgenda, barbeariaId: number, servicoId: number, profissionais: number[], data: Data, ignorarId: number | undefined,
  extra: { adicionais?: number[]; duracaoMin?: number }) {
  const livres = new Map<string, number>();
  for (const p of profissionais) {
    for (const h of banco.horariosLivres(barbeariaId, p, servicoId, data, undefined, ignorarId, extra)) if (!livres.has(h)) livres.set(h, p);
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
  // Barbeiro da equipe logado: o agendar só oferece a agenda dele.
  const so = await profissionalLogado(b.id);
  const profissionais = banco.profissionais(b.id, true).filter((p) => !so || p.id === so);
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

  // Adicionais: só os que valem pra esse serviço (ids estranhos na URL são ignorados).
  const possiveis = servico && !remarcando ? banco.adicionaisPara(b.id, servico.id) : [];
  const pedidos = lerExtras(sp.extra);
  // Até MAX_ADICIONAIS: o que passar disso (cliente marcou demais ou URL mexida) fica de fora em vez de quebrar a página.
  const adicionais = possiveis.filter((a) => pedidos.includes(a.id)).slice(0, MAX_ADICIONAIS);
  const cortouAdicionais = possiveis.filter((a) => pedidos.includes(a.id)).length > MAX_ADICIONAIS;
  // A faixa de erro mostra o que o servidor mandou; texto com link (de alguém mexendo na URL) não aparece.
  const erroVisivel = (sp.erro && !/https?:|www\.|<|>/i.test(sp.erro) ? sp.erro.slice(0, 160) : undefined)
    ?? (cortouAdicionais ? `Dá pra escolher até ${MAX_ADICIONAIS} adicionais: ficaram os ${MAX_ADICIONAIS} primeiros.` : undefined);
  const respondeu = sp.ad === "1" || possiveis.length === 0;
  // Foto do corte que a pessoa tocou na vitrine (só foto de trabalho desta barbearia).
  const fotoEscolhida = sp.foto && !remarcando ? banco.fotos(b.id).find((f) => f.arquivo === sp.foto && CATEGORIAS_REFERENCIA.includes(f.categoria)) : undefined;

  const link = (extra: Busca) => {
    const tudo: Busca = {
      servico: servico && String(servico.id), profissional: filtro && String(filtro.id), data: sp.data, remarcar: remarcando && sp.remarcar,
      ad: possiveis.length && respondeu ? "1" : undefined, extra: adicionais.map((a) => String(a.id)), foto: fotoEscolhida?.arquivo, ...extra,
    };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(tudo)) {
      if (Array.isArray(v)) for (const x of v) q.append(k, x);
      else if (v) q.set(k, v);
    }
    return `${base}?${q}`;
  };

  // Foto de cada serviço (pelo nome).
  const fotosSite = banco.fotos(b.id).filter((f) => f.categoria !== "equipe" && !f.antesDe);
  const todosServicos = banco.servicos(b.id, true);
  const fotosLista = fotosDosServicos(todosServicos.map((s) => s.nome), fotosSite);
  const fotoDe = new Map(todosServicos.map((s, i) => [s.id, fotosLista[i]]));

  // ---------- Passo 1: grupos (Barba, Cabelo, Sobrancelha...) → serviços do grupo → volta pros grupos ----------
  // A escolha anda na URL (`sel`, um por serviço). Cabelo é um só (escolher outro corte troca); o resto liga e desliga.
  // Links antigos com `servico` sem `ad=1` (ou "Não vou cortar") caem aqui com o serviço já escolhido.
  if (!remarcando && (!servico || sp.servico === "sem" || !respondeu || sp.sel !== undefined || sp.grupo !== undefined)) {
    const porId = new Map(servicos.map((s) => [s.id, s]));
    const pedidosSel = [...lerExtras(sp.sel), ...(servico && sp.servico !== "sem" ? [servico.id, ...adicionais.map((a) => a.id)] : [])];
    const selecionados = [...new Set(pedidosSel)].map((id) => porId.get(id)).filter((s): s is NonNullable<typeof s> => !!s);
    // Com um corte escolhido, os outros grupos só mostram o que vai junto com ele (corte infantil: só acabamento).
    const corte = selecionados.find((s) => grupoDoServico(s.nome) === "cabelo");
    const vaiComCorte = corte ? new Set(banco.adicionaisPara(b.id, corte.id).map((a) => a.id)) : undefined;
    const grupos = GRUPOS_SERVICO.map((g) => ({
      ...g,
      lista: servicos.filter((s) => grupoDoServico(s.nome) === g.id && (g.id === "cabelo" || !vaiComCorte || vaiComCorte.has(s.id) || selecionados.includes(s))),
    })).filter((g) => g.lista.length > 0);
    const grupoAberto = grupos.find((g) => g.id === sp.grupo);
    const urlGrupos = (sel: number[], extra: Record<string, string | undefined> = {}) => {
      const q = new URLSearchParams();
      for (const id of sel) q.append("sel", String(id));
      if (filtro) q.set("profissional", String(filtro.id));
      // Veio de um horário livre da agenda do painel: dia, hora e quem atende seguem até o fim.
      for (const k of ["data", "hora", "com"] as const) if (sp[k]) q.set(k, sp[k]!);
      const foto = extra.foto ?? fotoEscolhida?.arquivo;
      if (foto && sel.some((id) => grupoDoServico(porId.get(id)?.nome ?? "") === "cabelo")) q.set("foto", foto);
      for (const [k, v] of Object.entries(extra)) if (v && k !== "foto") q.set(k, v);
      return `${base}?${q}`;
    };
    const ids = selecionados.map((s) => s.id);

    // Serviços de um grupo: tocar escolhe (ou tira) e volta pros grupos.
    if (grupoAberto) {
      return (
        <div className="b-secao b-agendar b-vitrine">
          <Cabeca rotulo={`Passo 1 de 3 · ${b.nome}`} titulo={grupoAberto.nome} />
          <p className="b-escolhido"><Link href={urlGrupos(ids)}>← Voltar pros grupos</Link></p>
          <ul className="b-vitrine-grade b-grupo-lista">
            {grupoAberto.lista.map((s) => {
              const f = fotoDe.get(s.id);
              const marcado = ids.includes(s.id);
              // Cabelo é um corte só; os outros grupos ligam e desligam.
              const novo = marcado ? ids.filter((x) => x !== s.id)
                : grupoAberto.id === "cabelo" ? [...ids.filter((x) => grupoDoServico(porId.get(x)!.nome) !== "cabelo"), s.id] : [...ids, s.id];
              const referencia = grupoAberto.id === "cabelo" && f && CATEGORIAS_REFERENCIA.includes(f.categoria) ? f.arquivo : undefined;
              return (
                <li key={s.id}>
                  <Link href={urlGrupos(novo, { foto: marcado ? undefined : referencia })} className={`b-vitrine-item ${marcado ? "marcado" : ""}`} aria-current={marcado ? "true" : undefined}>
                    <span className="b-vitrine-foto">
                      {f
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={urlFoto(f.arquivo, "p")} alt="" loading="lazy" width={f.largura} height={f.altura} />
                        : <Scissors size={36} aria-hidden />}
                      {marcado && <span className="b-grupo-check" aria-hidden><Check size={18} /></span>}
                    </span>
                    <span className="b-vitrine-texto">
                      <strong>{s.nome}</strong>
                      {s.descricao && <small>{s.descricao}</small>}
                      <span className="b-vitrine-info">
                        <span>{s.duracaoMin} min{s.emDomicilio ? " · vou até você" : ""}</span>
                        {b.mostrarPrecos && <b>{reais(s.precoCentavos)}</b>}
                      </span>
                      {marcado && <small className="b-grupo-tirar">Escolhido · toque pra tirar</small>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    // O horário leva um serviço principal (o corte, se tiver) e o resto como adicionais dele.
    const principal = selecionados.find((s) => grupoDoServico(s.nome) === "cabelo") ?? selecionados.find((s) => !s.adicional) ?? selecionados[0];
    const validos = new Set(principal ? banco.adicionaisPara(b.id, principal.id).map((a) => a.id) : []);
    const juntos = selecionados.filter((s) => s !== principal && validos.has(s.id)).slice(0, MAX_ADICIONAIS);
    const deFora = selecionados.filter((s) => s !== principal && !juntos.includes(s));
    const noHorario = principal ? [principal, ...juntos] : [];
    const minutos = noHorario.reduce((t, s) => t + s.duracaoMin, 0);
    const centavos = noHorario.reduce((t, s) => t + s.precoCentavos, 0);
    const proximo = principal && (() => {
      const q = new URLSearchParams({ servico: String(principal.id), ad: "1" });
      if (filtro) q.set("profissional", String(filtro.id));
      for (const k of ["data", "hora", "com"] as const) if (sp[k]) q.set(k, sp[k]!);
      if (fotoEscolhida && grupoDoServico(principal.nome) === "cabelo") q.set("foto", fotoEscolhida.arquivo);
      for (const x of juntos) q.append("extra", String(x.id));
      return `${base}?${q}`;
    })();

    return (
      <div className="b-secao b-agendar b-vitrine">
        <Cabeca rotulo={`Passo 1 de 3 · ${b.nome}`} titulo={noHorario.length ? "O que mais vamos fazer?" : "O que vamos fazer hoje?"} />
        {sp.data && sp.hora && dataValida(sp.data) && (
          <p className="b-escolhido">Horário: <strong>{formatarData(sp.data)} às {sp.hora}</strong>{profissionais.find((p) => String(p.id) === sp.com) ? ` com ${profissionais.find((p) => String(p.id) === sp.com)!.nome}` : ""}</p>
        )}
        {noHorario.length > 0 ? (
          <div className="b-pedido">
            <p className="b-pedido-frase">Vamos fazer: <strong>{noHorario.map((s) => s.nome).join(" + ")}</strong></p>
            <ul className="b-pedido-lista">
              {noHorario.map((s) => (
                <li key={s.id}>
                  <span>{s.nome}</span>
                  <span className="b-pedido-valor">{s.duracaoMin} min{b.mostrarPrecos && ` · ${reais(s.precoCentavos)}`}</span>
                  <Link href={urlGrupos(ids.filter((x) => x !== s.id))} aria-label={`Tirar ${s.nome}`}>tirar</Link>
                </li>
              ))}
            </ul>
            <p className="b-pedido-total">Total: <strong>{minutos} min{b.mostrarPrecos && ` · ${reais(centavos)}`}</strong></p>
            {deFora.length > 0 && <p className="b-dica">{deFora.map((s) => s.nome).join(" e ")} não {deFora.length > 1 ? "vão" : "vai"} junto nesse horário: dá pra marcar em outro.</p>}
          </div>
        ) : (
          <p className="b-dica">Toque num grupo, escolha o serviço e volte aqui pra somar o que quiser.</p>
        )}
        {erroVisivel && <p className="erro" role="alert">{erroVisivel}</p>}
        <ul className="b-vitrine-grade b-grupos">
          {grupos.map((g) => {
            const f = fotoDe.get(g.lista[0]!.id);
            const escolhidos = selecionados.filter((s) => grupoDoServico(s.nome) === g.id);
            const menor = Math.min(...g.lista.map((s) => s.precoCentavos));
            return (
              <li key={g.id}>
                <Link href={urlGrupos(ids, { grupo: g.id })} className={`b-vitrine-item ${escolhidos.length ? "marcado" : ""}`}>
                  <span className="b-vitrine-foto">
                    {f
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={urlFoto(f.arquivo, "p")} alt="" loading="lazy" width={f.largura} height={f.altura} />
                      : <Sparkles size={36} aria-hidden />}
                    {escolhidos.length > 0 && <span className="b-grupo-check" aria-hidden><Check size={18} /></span>}
                  </span>
                  <span className="b-vitrine-texto">
                    <strong>{g.nome}</strong>
                    <small>{escolhidos.length ? escolhidos.map((s) => s.nome).join(", ") : `${g.lista.length} ${g.lista.length === 1 ? "opção" : "opções"}`}</small>
                    {b.mostrarPrecos && !escolhidos.length && <span className="b-vitrine-info"><span>a partir de</span><b>{reais(menor)}</b></span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {proximo && (
          <div className="b-extras-acoes">
            <Link href={proximo} className="b-botao">Escolher o horário</Link>
          </div>
        )}
      </div>
    );
  }

  // Daqui pra frente já tem serviço (o passo 1 acima cobre o resto).
  if (!servico) redirect(base);

  const tempoTotal = servico.duracaoMin + adicionais.reduce((t, a) => t + a.duracaoMin, 0);
  const precoTotal = servico.precoCentavos + adicionais.reduce((t, a) => t + a.precoCentavos, 0);
  const nomeTotal = [servico.nome, ...adicionais.map((a) => a.nome)].join(" + ");
  // Remarcando: o tempo é o do horário já marcado (com os adicionais dele).
  const duracao = remarcando ? { duracaoMin: remarcando.duracaoMin } : { adicionais: adicionais.map((a) => a.id) };
  const ids = filtro ? [filtro.id] : profissionais.map((p) => p.id);
  const com = profissionais.find((p) => String(p.id) === sp.com);
  const data = sp.data && dataValida(sp.data) && sp.data >= hoje ? sp.data : undefined;
  const horaValida = !!(data && sp.hora && com && banco.horariosLivres(b.id, com.id, servico.id, data, undefined, remarcando?.id, duracao).includes(sp.hora));
  const quandoAtual = remarcando && `${formatarData(remarcando.inicio.slice(0, 10))} às ${remarcando.inicio.slice(11, 16)}`;

  // ---------- Remarcar, passo final: confirmar a troca ----------
  if (remarcando && horaValida && data && com && sp.hora) {
    return (
      <div className="b-secao b-agendar">
        <Cabeca rotulo={`Remarcar · ${b.nome}`} titulo="Confirme a troca" />
        {erroVisivel && <p className="erro" role="alert">{erroVisivel}</p>}
        <div className="b-resumo">
          <p className="b-resumo-antes">De: {quandoAtual}</p>
          <p className="b-resumo-quando">Para: {formatarData(data)} às {sp.hora}</p>
          <p>{remarcando.servico} com {com.nome}</p>
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

  // ---------- Passo 4: nome e WhatsApp ----------
  if (horaValida && data && com && sp.hora) {
    // Cardápio de cortes: até 12 fotos de trabalho, as mais recentes.
    // Corte infantil: só fotos de criança (corte de adulto não serve de referência); sem elas, nada de grade.
    const infantil = /infantil|crian/i.test(servico.nome);
    const referencias = banco.fotos(b.id).filter((f) => infantil ? f.categoria === "infantil" : CATEGORIAS_REFERENCIA.includes(f.categoria)).slice(0, 12);
    const marcandoPeloBarbeiro = await ehOBarbeiro(b.id);
    const salvo = (await cookies()).get(RASCUNHO)?.value;
    const rascunho = (() => {
      try {
        const r = JSON.parse(salvo ?? "{}") as Record<string, unknown>;
        const texto = (v: unknown) => (typeof v === "string" ? v : undefined);
        return { nome: texto(r.nome), telefone: texto(r.telefone), endereco: texto(r.endereco) };
      } catch { return {} as { nome?: string; telefone?: string; endereco?: string }; }
    })();
    return (
      <div className="b-secao b-agendar">
        <Cabeca rotulo={`Passo 3 de 3 · ${b.nome}`} titulo="Confirme seu horário" />
        {erroVisivel && (
          <p className="erro" role="alert">
            {erroVisivel}
            {b.telefone && !marcandoPeloBarbeiro && <> <a href={`https://wa.me/${b.telefone}?text=${encodeURIComponent(`Oi! Quero marcar ${nomeTotal} ${formatarData(data)} às ${sp.hora} com ${com.nome}.`)}`} target="_blank" rel="noopener noreferrer">Marcar pelo WhatsApp da barbearia</a></>}
          </p>
        )}
        <div className="b-resumo">
          <p className="b-resumo-quando">{formatarData(data)} às {sp.hora}</p>
          <p>{nomeTotal} com {com.nome} · {tempoTotal} min{b.mostrarPrecos && ` · ${reais(precoTotal)}`}</p>
          <Link href={link({ hora: undefined, com: undefined, data })}>Trocar horário</Link>
        </div>
        <form action={confirmar} className="formulario b-form-agendar">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="servico" value={servico.id} />
          <input type="hidden" name="profissional" value={filtro?.id ?? ""} />
          <input type="hidden" name="com" value={com.id} />
          <input type="hidden" name="data" value={data} />
          <input type="hidden" name="hora" value={sp.hora} />
          {adicionais.map((a) => <input key={a.id} type="hidden" name="extra" value={a.id} />)}
          {/* Isca pra robô: ninguém vê nem alcança pelo teclado. */}
          <div className="b-isca" aria-hidden="true">
            <label>Empresa <input name={CAMPO_ISCA} tabIndex={-1} autoComplete="off" /></label>
          </div>
          <label htmlFor="nome">{marcandoPeloBarbeiro ? "Nome do cliente" : "Seu nome"}</label>
          <input id="nome" name="nome" required maxLength={80} defaultValue={rascunho.nome} autoComplete={marcandoPeloBarbeiro ? "off" : "name"} />
          <label htmlFor="telefone">{marcandoPeloBarbeiro ? "WhatsApp do cliente com DDD" : "Seu WhatsApp com DDD"}</label>
          {/* O padrão segura o número incompleto ainda no celular: o erro do servidor volta com o formulário vazio. */}
          <input id="telefone" name="telefone" required inputMode="tel" defaultValue={rascunho.telefone} autoComplete={marcandoPeloBarbeiro ? "off" : "tel-national"} placeholder="(19) 99999-0000" aria-describedby="telefone-dica"
            pattern="^\D*(\d\D*){10,13}$" title="DDD e número, ex.: (19) 98765-4321" />
          <small id="telefone-dica" className="b-dica">
            {marcandoPeloBarbeiro
              ? "Depois de marcar, você manda o link do horário pra esse número."
              : <>A barbearia usa esse número pra confirmar ou avisar sobre o seu horário. <a href={`/b/${slug}/privacidade`} target="_blank">Privacidade</a>.</>}
          </small>
          {servico.emDomicilio && (
            <>
              <label htmlFor="endereco">Endereço do atendimento</label>
              <input id="endereco" name="endereco" required minLength={8} defaultValue={rascunho.endereco} maxLength={200} autoComplete="street-address" placeholder="Rua, número, bairro e complemento" aria-describedby="endereco-dica" />
              <small id="endereco-dica" className="b-dica">O barbeiro vai até você. Só ele vê o endereço.</small>
            </>
          )}
          {fotoEscolhida ? (
            // O corte que a pessoa tocou na vitrine já vai como referência: não pergunta de novo.
            <div className="b-referencia-escolhida">
              <input type="hidden" name="referencia" value={fotoEscolhida.arquivo} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlFoto(fotoEscolhida.arquivo, "p")} alt={fotoEscolhida.legenda ?? "Corte escolhido"} width={72} height={72} />
              <p><strong>Seu corte</strong><br /><span className="b-dica">O barbeiro recebe essa foto junto com o horário.</span></p>
            </div>
          ) : !marcandoPeloBarbeiro && ehCorte(servico.nome) && referencias.length > 0 && (
            <fieldset className="b-referencias">
              <legend>Quer mostrar o corte? <small>(opcional)</small></legend>
              <p className="b-dica">Toque na foto do trabalho que você quer. O barbeiro recebe junto com o horário.</p>
              <div className="b-referencias-grade">
                <label className="b-referencia b-referencia-nenhuma">
                  <input type="radio" name="referencia" value="" defaultChecked />
                  <span>Explico na hora</span>
                </label>
                {referencias.map((f) => (
                  <label key={f.arquivo} className="b-referencia">
                    <input type="radio" name="referencia" value={f.arquivo} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlFoto(f.arquivo, "p")} alt={f.legenda ?? "Foto de um trabalho da barbearia"} width={120} height={120} loading="lazy" />
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {/* Fixo embaixo no celular: o botão de terminar não fica escondido atrás da rolagem. */}
          <div className="b-confirmar-fixo">
            <BotaoEnviar className="b-botao" carregando="Confirmando…">{marcandoPeloBarbeiro ? "Marcar pro cliente" : "Confirmar horário"}</BotaoEnviar>
            {!marcandoPeloBarbeiro && <small className="b-dica">
              {b.sinalCentavos > 0 && b.pixChave
                ? `O horário fica marcado na hora. Pra garantir, a barbearia pede um sinal de ${reais(b.sinalCentavos)} pelo Pix: o código aparece na próxima tela.`
                : "O horário fica marcado na hora e a barbearia recebe o aviso."}
            </small>}
          </div>
        </form>
      </div>
    );
  }

  // ---------- Passo 3: dia e horário ----------
  const dias = Array.from({ length: DIAS_A_FRENTE }, (_, i) => somarDias(hoje, i))
    .map((d) => ({ d, vagas: vagasDoDia(banco, b.id, servico.id, ids, d, remarcando?.id, duracao), aberto: banco.expedientes(b.id).has(diaDaSemana(d)) }))
    .filter((x) => x.aberto);
  const escolhido = dias.find((x) => x.d === data) ?? dias.find((x) => x.vagas.length > 0);
  const rotuloDia = (d: Data) => (d === hoje ? "Hoje" : d === somarDias(hoje, 1) ? "Amanhã" : nomeDia(diaDaSemana(d)).slice(0, 3));

  return (
    <div className="b-secao b-agendar">
      {remarcando
        ? <Cabeca rotulo={`Remarcar · ${b.nome}`} titulo="Escolha o novo horário" />
        : <Cabeca rotulo={`Passo 2 de 3 · ${b.nome}`} titulo="Escolha o horário" />}
      {erroVisivel && <p className="erro" role="alert">{erroVisivel}</p>}
      {!erroVisivel && data && sp.hora && /^\d{2}:\d{2}$/.test(sp.hora) && (
        <p className="erro" role="status">O horário das {sp.hora} não está mais livre pra esse serviço (já foi ocupado ou passa do horário). Escolha outro abaixo.</p>
      )}
      {remarcando ? (
        <p className="b-escolhido">
          {remarcando.servico} · horário atual: {quandoAtual} · <Link href={`/b/${slug}/h/${sp.remarcar}`}>Manter esse</Link>
        </p>
      ) : (
        <p className="b-escolhido">
          {nomeTotal} · {tempoTotal} min{b.mostrarPrecos && ` · ${reais(precoTotal)}`}
          {servicos.length > 1 && <> · <Link href={(() => {
            // Volta pros grupos com o que já foi escolhido, pra somar ou trocar.
            const q = new URLSearchParams();
            for (const id of [servico.id, ...adicionais.map((x) => x.id)]) q.append("sel", String(id));
            if (filtro) q.set("profissional", String(filtro.id));
            if (fotoEscolhida) q.set("foto", fotoEscolhida.arquivo);
            return `${base}?${q}`;
          })()}>Mudar serviços</Link></>}
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
            ? <span key={d} className="b-dia lotado" title="Sem horários">{conteudo}<small>{d === hoje ? (b.fechadoEm === hoje ? "fechado" : "encerrado") : "sem vaga"}</small></span>
            : <Link key={d} href={link({ data: d })} className={`b-dia ${atual ? "escolhido" : ""}`} aria-current={atual ? "date" : undefined}>{conteudo}</Link>;
        })}
      </nav>
      {(() => {
        // Dias em que a barbearia não abre não aparecem na lista: diz quais são, pra ninguém procurar.
        const abertos = banco.expedientes(b.id);
        const fechados = [0, 1, 2, 3, 4, 5, 6].filter((d) => !abertos.has(d)).map((d) => nomeDia(d).toLowerCase());
        return fechados.length > 0 && fechados.length < 7 && <p className="b-dica">Não abre {fechados.join(" e ")}.</p>;
      })()}

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

