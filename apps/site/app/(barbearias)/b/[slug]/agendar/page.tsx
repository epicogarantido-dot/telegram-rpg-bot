import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { Check, Scissors, Sparkles } from "lucide-react";
import { agoraNoFuso, CATEGORIAS_REFERENCIA, MAX_ADICIONAIS, dataValida, diaDaSemana, formatarData, nomeDia, somarDias, type BancoAgenda, type Data } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { CarrosselB } from "@/componentes/barbearia/CarrosselB";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { ehCorte, fotosDosServicos, urlFoto } from "@/lib/barbearias";
import { avisarMudancaDoCliente, avisarNovoAgendamento, avisarRajada } from "@/lib/avisos";
import { CAMPO_ISCA, ehOBarbeiro, ErroRajada, primeiraRajadaDaHora, protegerAgendamento, protegerMudanca } from "@/lib/protecao";

export const dynamic = "force-dynamic";
const DIAS_A_FRENTE = 14;

/**
 * Agendar em 3 passos: serviço → dia e horário → nome e WhatsApp.
 * - `profissional` é só o filtro ("qualquer um" quando vazio);
 * - `com` é quem vai atender no horário escolhido (resolvido ao tocar no horário).
 * - `remarcar` é o token do link do cliente: mesmo fluxo, mas no fim troca o horário.
 * - `extra` são os adicionais (barba, sobrancelha), repetido na URL; `ad=1` diz que o cliente já respondeu.
 * - Passo 1 é um carrossel só: "Não vou cortar" (`servico=sem`, pra quem quer só barba e cuidados)
 *   e os cortes. Escolher um corte leva a foto dele (`foto`), que vira a referência do horário.
 * Tudo por link (funciona sem JavaScript) e cada passo é uma tela.
 */
type Busca = {
  servico?: string; profissional?: string; data?: string; hora?: string; com?: string; remarcar?: string; erro?: string; ad?: string;
  extra?: string | string[];
  /** Foto do corte escolhido na vitrine: vira a referência do horário sem o cliente escolher de novo. */
  foto?: string;
  /** "Não vou cortar": o que a pessoa marcou (barba, sobrancelha...). */
  escolha?: string | string[];
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
  const cortes = servicos.filter((s) => ehCorte(s.nome));
  const naoCortes = servicos.filter((s) => !ehCorte(s.nome));

  // ---------- "Não vou cortar": barba e cuidados, marca um ou mais ----------
  if (!remarcando && (sp.servico === "sem" || (!servico && cortes.length === 0 && naoCortes.length > 1))) {
    const escolhas = lerExtras(sp.escolha);
    if (sp.ad === "1") {
      // Enviou: o primeiro vira o serviço do horário e o resto, adicionais dele.
      const marcados = naoCortes.filter((s) => escolhas.includes(s.id));
      const principais = marcados.filter((s) => !s.adicional);
      const erro = marcados.length === 0 ? "Escolha pelo menos um serviço."
        : principais.length > 1 ? `Escolha só um entre ${principais.map((s) => s.nome).join(" e ")}. O outro dá pra marcar em outro horário.` : "";
      const principal = principais[0] ?? marcados[0];
      if (!erro && principal) {
        const validos = new Set(banco.adicionaisPara(b.id, principal.id).map((a) => a.id));
        const q = new URLSearchParams({ servico: String(principal.id), ad: "1" });
        if (filtro) q.set("profissional", String(filtro.id));
        for (const x of marcados) if (x !== principal && validos.has(x.id)) q.append("extra", String(x.id));
        redirect(`${base}?${q}`);
      }
      sp.erro = erro;
    }
    return (
      <div className="b-secao b-agendar b-vitrine">
        <Cabeca rotulo={`Passo 2 de 4 · ${b.nome}`} titulo="O que vai ser?" />
        {cortes.length > 0 && <p className="b-escolhido">Sem corte de cabelo · <Link href={`${base}${filtro ? `?profissional=${filtro.id}` : ""}`}>Quero cortar também</Link></p>}
        {erroVisivel && <p className="erro" role="alert">{erroVisivel}</p>}
        <form method="get" action={base} className="b-adicionais">
          <input type="hidden" name="servico" value="sem" />
          <input type="hidden" name="ad" value="1" />
          {filtro && <input type="hidden" name="profissional" value={filtro.id} />}
          <fieldset className="b-vitrine-grade b-vitrine-extras">
            <legend className="b-so-leitor">Serviços</legend>
            {naoCortes.map((a) => (
              <CartaoMarcar key={a.id} nome="escolha" servico={a} foto={fotoDe.get(a.id)} marcado={escolhas.includes(a.id)} precos={b.mostrarPrecos} mais={false} />
            ))}
          </fieldset>
          <div className="b-extras-acoes">
            <button className="b-botao">Ver horários</button>
          </div>
        </form>
      </div>
    );
  }

  // ---------- Passo 1: um carrossel só, "Não vou cortar" primeiro e depois os cortes ----------
  if (!servico) {
    const semCorte = naoCortes[0] && fotoDe.get(naoCortes[0].id);
    return (
      <div className="b-secao b-agendar b-vitrine">
        <Cabeca rotulo={`Passo 1 de 4 · ${b.nome}`} titulo="Qual corte vai ser?" />
        <CarrosselB id="cortes" rotulo="Cortes" className="b-escolha-corte" apoio="Deslize e toque no seu. Depois vêm barba, sobrancelha e o horário.">
          {naoCortes.length > 0 && (
            <Link href={link({ servico: "sem", data: undefined, ad: undefined, extra: [], foto: undefined })} className="b-vitrine-item b-nao-cortar">
              <span className="b-vitrine-foto">
                {semCorte
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={urlFoto(semCorte.arquivo, "p")} alt="" loading="lazy" width={semCorte.largura} height={semCorte.altura} />
                  : <Sparkles size={36} aria-hidden />}
              </span>
              <span className="b-vitrine-texto">
                <strong>Não vou cortar</strong>
                <small>Só {naoCortes.slice(0, 3).map((s) => s.nome.toLowerCase()).join(", ")}{naoCortes.length > 3 ? "…" : ""}</small>
              </span>
            </Link>
          )}
          {cortes.map((s) => {
            const f = fotoDe.get(s.id);
            const referencia = f && CATEGORIAS_REFERENCIA.includes(f.categoria) ? f.arquivo : undefined;
            return (
              <Link key={s.id} href={link({ servico: String(s.id), data: undefined, ad: undefined, extra: [], foto: referencia })} className="b-vitrine-item">
                <span className="b-vitrine-foto">
                  {f
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={urlFoto(f.arquivo, "p")} alt="" loading="lazy" width={f.largura} height={f.altura} />
                    : <Scissors size={36} aria-hidden />}
                </span>
                <span className="b-vitrine-texto">
                  <strong>{s.nome}</strong>
                  {s.descricao && <small>{s.descricao}</small>}
                  <span className="b-vitrine-info">
                    <span>{s.duracaoMin} min{s.emDomicilio ? " · vou até você" : ""}</span>
                    {b.mostrarPrecos && <b>{reais(s.precoCentavos)}</b>}
                  </span>
                </span>
              </Link>
            );
          })}
        </CarrosselB>
      </div>
    );
  }

  // ---------- Passo 2: adicionais (com foto) ----------
  if (!respondeu) {
    const fotoServico = fotoEscolhida ?? fotoDe.get(servico.id);
    return (
      <div className="b-secao b-agendar b-vitrine">
        <Cabeca rotulo={`Passo 2 de 4 · ${b.nome}`} titulo="Completa o visual?" />
        <div className="b-escolhido b-escolhido-foto">
          {fotoServico && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlFoto(fotoServico.arquivo, "p")} alt="" width={64} height={64} />
          )}
          <p>
            <strong>{servico.nome}</strong> · {servico.duracaoMin} min{b.mostrarPrecos && ` · ${reais(servico.precoCentavos)}`}
            {servicos.length > 1 && <> · <Link href={`${base}${filtro ? `?profissional=${filtro.id}` : ""}`}>Trocar</Link></>}
          </p>
        </div>
        <p className="b-dica">Já que você vem, sai daqui com tudo alinhado. Toque no que quiser junto.</p>
        <form method="get" action={base} className="b-adicionais">
          <input type="hidden" name="servico" value={servico.id} />
          {filtro && <input type="hidden" name="profissional" value={filtro.id} />}
          {fotoEscolhida && <input type="hidden" name="foto" value={fotoEscolhida.arquivo} />}
          <input type="hidden" name="ad" value="1" />
          <fieldset className="b-vitrine-grade b-vitrine-extras">
            <legend className="b-so-leitor">Adicionais</legend>
            {possiveis.map((a) => (
              <CartaoMarcar key={a.id} nome="extra" servico={a} foto={fotoDe.get(a.id)} marcado={pedidos.includes(a.id)} precos={b.mostrarPrecos} mais />
            ))}
          </fieldset>
          <div className="b-extras-acoes">
            <button className="b-botao">Continuar</button>
            <Link href={link({ ad: "1", extra: [] })} className="b-extras-pular">Só {servico.nome.toLowerCase()}, ver horários</Link>
          </div>
        </form>
      </div>
    );
  }

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
    return (
      <div className="b-secao b-agendar">
        <Cabeca rotulo={`Passo 4 de 4 · ${b.nome}`} titulo="Confirme seu horário" />
        {erroVisivel && <p className="erro" role="alert">{erroVisivel}</p>}
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
          <input id="nome" name="nome" required maxLength={80} autoComplete={marcandoPeloBarbeiro ? "off" : "name"} />
          <label htmlFor="telefone">{marcandoPeloBarbeiro ? "WhatsApp do cliente com DDD" : "Seu WhatsApp com DDD"}</label>
          {/* O padrão segura o número incompleto ainda no celular: o erro do servidor volta com o formulário vazio. */}
          <input id="telefone" name="telefone" required inputMode="tel" autoComplete={marcandoPeloBarbeiro ? "off" : "tel-national"} placeholder="(19) 99999-0000" aria-describedby="telefone-dica"
            pattern="^\D*(\d\D*){10,13}$" title="DDD e número, ex.: (19) 98765-4321" />
          <small id="telefone-dica" className="b-dica">
            {marcandoPeloBarbeiro
              ? "Depois de marcar, você manda o link do horário pra esse número."
              : <>A barbearia usa esse número pra confirmar ou avisar sobre o seu horário. <a href={`/b/${slug}/privacidade`} target="_blank">Privacidade</a>.</>}
          </small>
          {servico.emDomicilio && (
            <>
              <label htmlFor="endereco">Endereço do atendimento</label>
              <input id="endereco" name="endereco" required minLength={8} maxLength={200} autoComplete="street-address" placeholder="Rua, número, bairro e complemento" aria-describedby="endereco-dica" />
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
          ) : ehCorte(servico.nome) && referencias.length > 0 && (
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
        : <Cabeca rotulo={`Passo 3 de 4 · ${b.nome}`} titulo="Escolha o horário" />}
      {erroVisivel && <p className="erro" role="alert">{erroVisivel}</p>}
      {remarcando ? (
        <p className="b-escolhido">
          {remarcando.servico} · horário atual: {quandoAtual} · <Link href={`/b/${slug}/h/${sp.remarcar}`}>Manter esse</Link>
        </p>
      ) : (
        <p className="b-escolhido">
          {nomeTotal} · {tempoTotal} min{b.mostrarPrecos && ` · ${reais(precoTotal)}`}
          {possiveis.length > 0 && <> · <Link href={link({ ad: undefined, data: undefined })}>{adicionais.length ? "Mudar adicionais" : "Adicionar mais um serviço"}</Link></>}
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
            ? <span key={d} className="b-dia lotado" title="Sem horários">{conteudo}<small>{d === hoje ? (b.fechadoEm === hoje ? "fechado" : "encerrado") : "sem vaga"}</small></span>
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

/** Cartão com foto que marca com um toque (adicionais e "Não vou cortar"). */
function CartaoMarcar({ nome, servico, foto, marcado, precos, mais }: {
  nome: string;
  servico: { id: number; nome: string; descricao?: string; duracaoMin: number; precoCentavos: number };
  foto?: { arquivo: string; largura?: number; altura?: number };
  marcado: boolean;
  precos: boolean;
  /** Adicional: tempo e preço com "+" (somam no serviço escolhido). */
  mais: boolean;
}) {
  return (
    <label className="b-vitrine-item b-extra">
      <input type="checkbox" name={nome} value={servico.id} defaultChecked={marcado} />
      <span className="b-vitrine-foto">
        {foto
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={urlFoto(foto.arquivo, "p")} alt="" loading="lazy" width={foto.largura} height={foto.altura} />
          : <Sparkles size={32} aria-hidden />}
        <span className="b-extra-marca" aria-hidden><Check size={18} /></span>
      </span>
      <span className="b-vitrine-texto">
        <strong>{servico.nome}</strong>
        {servico.descricao && <small>{servico.descricao}</small>}
        <span className="b-vitrine-info">
          <span>{mais ? "+" : ""}{servico.duracaoMin} min</span>
          {precos && <b>{mais ? "+" : ""}{reais(servico.precoCentavos)}</b>}
        </span>
      </span>
    </label>
  );
}
