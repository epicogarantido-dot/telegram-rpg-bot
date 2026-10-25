import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, AtSign, Clock, MapPin, MessageCircle, Navigation, Phone, Users } from "lucide-react";
import { agoraNoFuso, CATEGORIAS_FOTO, diaDaSemana, nomeDia, somarDias, type BancoAgenda, type Data } from "@aprenda/agenda";
import { AntesDepois } from "@/componentes/barbearia/AntesDepois";
import { obterAgenda, reais } from "@/lib/agenda";
import { dadosEstruturados, linkMapa, situacaoAgora, urlAbsoluta, urlFoto } from "@/lib/barbearias";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug((await params).slug);
  if (!b) return { title: "Barbearia não encontrada" };
  const capa = banco.fotos(b.id).find((f) => f.capa) ?? banco.fotos(b.id)[0];
  const descricao = b.bio ?? `Agende seu horário na ${b.nome}${b.cidade ? `, em ${b.cidade}` : ""}.`;
  return {
    title: `${b.nome}${b.cidade ? ` · ${b.cidade}` : ""}`,
    description: descricao,
    // Imagem que aparece quando o link é mandado no WhatsApp.
    openGraph: { title: b.nome, description: descricao, type: "website", ...(capa && { images: [urlAbsoluta(urlFoto(capa.arquivo))] }) },
  };
}

function primeiroNome(nome: string) {
  return nome.split(" ")[0];
}

export default async function SiteBarbearia({ params }: { params: Promise<{ slug: string }> }) {
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug((await params).slug);
  if (!b) notFound();
  const base = `/b/${b.slug}`;
  const fotos = banco.fotos(b.id);
  const capa = fotos.find((f) => f.capa) ?? fotos.find((f) => f.categoria === "ambiente") ?? fotos[0];
  // Foto de "antes" só aparece no comparador, nunca sozinha na galeria.
  const trabalhos = fotos.filter((f) => f.categoria !== "equipe" && !f.antesDe && f.arquivo !== capa?.arquivo).slice(0, 6);
  const pares = banco.paresAntesDepois(b.id);
  const tema = b.tema;
  const hoje = agoraNoFuso(b.fuso);
  // Neve só no inverno do Brasil (junho a agosto), e só no Luxo Técnico.
  const inverno = ["06", "07", "08"].includes(hoje.slice(5, 7));
  const numeros = tema === "tecnico" ? [
    ...(b.desde ? [{ valor: Number(hoje.slice(0, 4)) - b.desde, rotulo: "anos de casa" }] : []),
    { valor: banco.profissionais(b.id, true).length, rotulo: "profissionais" },
    ...((() => { const n = banco.totalAtendimentos(b.id); return n >= 20 ? [{ valor: n, rotulo: "horários marcados pelo site" }] : []; })()),
  ].filter((n) => n.valor > 0) : [];
  const servicos = banco.servicos(b.id, true);
  const equipe = banco.profissionais(b.id, true);
  const expedientes = banco.expedientes(b.id);
  const agora = situacaoAgora(b, expedientes);
  const mapa = linkMapa(b);
  const agenda = b.atendimento !== "chegada";
  // Fila só faz sentido com a barbearia aberta e informada há pouco.
  const fila = agora.aberto ? banco.filaAgora(b) : undefined;
  const whats = `https://wa.me/${b.telefone}?text=${encodeURIComponent(`Olá, ${b.nome}! Vim pelo site.`)}`;
  const telefoneBonito = b.telefone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
  const vagas = servicos[0] ? proximasVagas(banco, b.id, servicos[0].id, equipe.map((p) => p.id), hoje.slice(0, 10)) : null;
  const categoriasUsadas = CATEGORIAS_FOTO.filter((c) => c.id !== "equipe" && fotos.some((f) => f.categoria === c.id));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: dadosEstruturados(b, { expedientes, servicos, capa: capa?.arquivo }),
      }} />

      <section className="b-heroi">
        {capa && (
          <div className="b-heroi-midia">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem já otimizada no envio */}
            <img src={urlFoto(capa.arquivo)} alt={capa.legenda ?? `Ambiente da ${b.nome}`} width={capa.largura} height={capa.altura} fetchPriority="high" />
          </div>
        )}
        {tema === "extravagancia" && (
          // Tamanho e posição dos retângulos vêm do CSS (em px), pra linha não esticar.
          <svg className="b-moldura" aria-hidden="true">
            <rect pathLength="1" />
            <rect pathLength="1" className="interna" />
          </svg>
        )}
        {tema === "tecnico" && inverno && <div className="b-neve" aria-hidden="true" />}
        <div className="b-heroi-texto">
          {b.cidade && <p className="b-sobretitulo">{b.cidade}</p>}
          {tema === "potencia" ? (
            // Letra por letra pra entrar "rasgando"; leitor de tela lê o nome inteiro.
            <h1 className="b-dividido">
              <span className="b-so-leitor">{b.nome}</span>
              {palavrasComLetras(b.nome).map((palavra, p) => (
                <span key={p} className="b-palavra" aria-hidden="true">
                  {palavra.map(({ c, i }) => (
                    <span key={i} className="b-letra" style={{ "--i": i } as React.CSSProperties}>{c}</span>
                  ))}
                </span>
              ))}
            </h1>
          ) : <h1>{b.nome}</h1>}
          {b.bio && <p className="b-bio">{b.bio}</p>}
          {fila && (
            <p className="b-fila">
              <Users size={18} aria-hidden />
              <span>
                <strong>{fila.pessoas === 0 ? "Sem fila agora" : `${fila.pessoas} ${fila.pessoas === 1 ? "pessoa" : "pessoas"} na fila · espera de ~${fila.esperaMin} min`}</strong>
                <small>atualizado {fila.haMin < 1 ? "agora" : `há ${fila.haMin} min`}</small>
              </span>
            </p>
          )}
          {!agenda && <p className="b-chegada">Atendimento por ordem de chegada.</p>}
          <div className="b-acoes">
            {agenda
              ? <Link href={`${base}/agendar`} className="b-botao">Agendar horário</Link>
              : mapa && <a href={mapa} className="b-botao" target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden /> Como chegar</a>}
            <a href={whats} className="b-botao-sec" target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden /> WhatsApp</a>
          </div>
          <ul className="b-info-rapida">
            <li className={`b-estado ${agora.aberto ? "aberto" : ""}`}><Clock size={16} aria-hidden /> {agora.texto}</li>
            {b.endereco && <li><MapPin size={16} aria-hidden /> {mapa ? <a href={mapa} target="_blank" rel="noopener noreferrer">{b.endereco}</a> : b.endereco}</li>}
            <li><Phone size={16} aria-hidden /> <a href={`tel:+${b.telefone}`}>{telefoneBonito}</a></li>
          </ul>
        </div>
      </section>

      {categoriasUsadas.length > 0 && (
        <div className="b-faixa" aria-hidden="true">
          <div>{[...categoriasUsadas, ...categoriasUsadas, ...categoriasUsadas].map((c, i) => <span key={i}>{c.nome}</span>)}</div>
        </div>
      )}

      {b.oferta && <p className="b-oferta">{b.oferta}</p>}

      {vagas && servicos[0] && (
        <section className="b-vagas" aria-labelledby="vagas-titulo">
          <h2 id="vagas-titulo">Vagas {vagas.quando} pra {servicos[0].nome.toLowerCase()}</h2>
          <ul>
            {vagas.itens.map((v) => (
              <li key={v.hora}>
                <Link href={`${base}/agendar?servico=${servicos[0]!.id}&com=${v.profissionalId}&data=${vagas.data}&hora=${v.hora}`}>{v.hora}</Link>
              </li>
            ))}
          </ul>
          <Link href={`${base}/agendar`} className="b-vagas-mais">Outros dias e serviços</Link>
        </section>
      )}

      {numeros.length > 0 && (
        <section className="b-numeros" aria-label="A barbearia em números">
          {numeros.map((n) => (
            <p key={n.rotulo}><strong data-contar={n.valor}>{n.valor}</strong> <span>{n.rotulo}</span></p>
          ))}
        </section>
      )}

      {trabalhos.length > 0 && (
        <section className="b-secao" id="trabalhos">
          <div className="b-secao-cabeca">
            <h2>Trabalhos</h2>
            {tema === "cerimonia" ? (
              <div className="b-galeria-setas">
                <button type="button" data-galeria="anterior" aria-label="Foto anterior"><ArrowLeft size={18} aria-hidden /></button>
                <button type="button" data-galeria="proxima" aria-label="Próxima foto"><ArrowRight size={18} aria-hidden /></button>
              </div>
            ) : <Link href={`${base}/trabalhos`}>Ver todos <ArrowRight size={16} aria-hidden /></Link>}
          </div>
          <div className="b-galeria">
            {trabalhos.map((f) => (
              <figure key={f.id} className="b-foto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlFoto(f.arquivo, "p")} alt={f.legenda ?? CATEGORIAS_FOTO.find((c) => c.id === f.categoria)?.nome ?? "Trabalho"} loading="lazy" width={f.largura} height={f.altura} />
                {f.legenda && <figcaption>{f.legenda}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {tema === "potencia" && pares.length > 0 && (
        <section className="b-secao" id="antes-depois">
          <h2>Antes e depois</h2>
          <div className="b-comparadores">
            {pares.slice(0, 2).map((p) => (
              <AntesDepois key={p.antes.id} antes={urlFoto(p.antes.arquivo)} depois={urlFoto(p.depois.arquivo)} legenda={p.depois.legenda} />
            ))}
          </div>
        </section>
      )}

      <section className="b-secao" id="servicos">
        <h2>Serviços</h2>
        <ul className="b-servicos">
          {servicos.map((s) => (
            <li key={s.id}>
              <span className="b-servico-nome">{s.nome}</span>
              <span className="b-servico-tempo">{s.duracaoMin} min</span>
              {b.mostrarPrecos && <span className="b-servico-preco">{reais(s.precoCentavos)}</span>}
              {agenda && <Link href={`${base}/agendar?servico=${s.id}`} className="b-servico-acao" aria-label={`Agendar ${s.nome}`}>Agendar</Link>}
            </li>
          ))}
        </ul>
      </section>

      {equipe.length > 0 && (
        <section className="b-secao" id="equipe">
          <h2>Equipe</h2>
          <div className="b-equipe">
            {equipe.map((p) => (
              <article key={p.id} className="b-pessoa">
                {p.fotoArquivo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={urlFoto(p.fotoArquivo, "p")} alt={p.nome} loading="lazy" />
                  : <div className="b-pessoa-inicial" aria-hidden="true">{p.nome[0]}</div>}
                <h3>{p.nome}</h3>
                {p.especialidade && <p>{p.especialidade}</p>}
                {agenda && <Link href={`${base}/agendar?profissional=${p.id}`} className="b-botao-sec">Agendar com {primeiroNome(p.nome)}</Link>}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="b-secao" id="contato">
        <h2>Horários e contato</h2>
        <div className="b-contato">
          <table className="b-horarios">
            <tbody>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const e = expedientes.get(d);
                return (
                  <tr key={d}>
                    <th scope="row">{nomeDia(d)}</th>
                    <td>{e ? `${e.abre}–${e.fecha}` : "Fechado"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ul className="b-contatos">
            {b.endereco && <li><MapPin size={18} aria-hidden /> {mapa ? <a href={mapa} target="_blank" rel="noopener noreferrer">{b.endereco}{b.cidade ? `, ${b.cidade}` : ""}</a> : b.endereco}</li>}
            <li><MessageCircle size={18} aria-hidden /> <a href={whats} target="_blank" rel="noopener noreferrer">{telefoneBonito}</a></li>
            {b.instagram && <li><AtSign size={18} aria-hidden /> <a href={`https://instagram.com/${b.instagram}`} target="_blank" rel="noopener noreferrer">@{b.instagram}</a></li>}
          </ul>
        </div>
      </section>
    </>
  );
}

/** Separa o nome em palavras (pra quebrar linha só entre elas) com o índice global de cada letra. */
function palavrasComLetras(nome: string): { c: string; i: number }[][] {
  let i = 0;
  return nome.split(/\s+/).filter(Boolean).map((p) => [...p].map((c) => ({ c, i: i++ })));
}

/**
 * Primeiros horários livres a partir de hoje (o primeiro dia com vaga, até 7 dias) somando
 * todos os profissionais. Cada horário já leva quem está livre nele.
 */
function proximasVagas(banco: BancoAgenda, barbeariaId: number, servicoId: number, profissionais: number[], hoje: Data) {
  for (let i = 0; i < 7; i++) {
    const data = somarDias(hoje, i);
    const dia = diaDaSemana(data);
    const quando = i === 0 ? "hoje" : i === 1 ? "amanhã" : `${dia === 0 || dia === 6 ? "no" : "na"} ${nomeDia(dia).toLowerCase()}`;
    const livres = new Map<string, number>();
    for (const p of profissionais) {
      for (const h of banco.horariosLivres(barbeariaId, p, servicoId, data)) if (!livres.has(h)) livres.set(h, p);
    }
    if (livres.size > 0) {
      const itens = [...livres].sort(([a], [b]) => a.localeCompare(b)).slice(0, 6).map(([hora, profissionalId]) => ({ hora, profissionalId }));
      return { quando, data, itens };
    }
  }
  return null;
}
