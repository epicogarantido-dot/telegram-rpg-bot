import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, AtSign, CalendarCheck, Clock, MapPin, MessageCircle, Navigation, Phone, Scissors, Users } from "lucide-react";
import { agoraNoFuso, CATEGORIAS_FOTO, diaDaSemana, nomeDia, somarDias, type BancoAgenda, type Data } from "@aprenda/agenda";
import { AntesDepois } from "@/componentes/barbearia/AntesDepois";
import { CapaSlides } from "@/componentes/barbearia/CapaSlides";
import { CarrosselB } from "@/componentes/barbearia/CarrosselB";
import { Frase } from "@/componentes/barbearia/Frase";
import { frasesDoTema } from "@/lib/frases";
import { arquivosDoAcervo } from "@/lib/exemplos";
import { obterAgenda, reais } from "@/lib/agenda";
import { dadosEstruturados, ehCorte, fotosDosServicos, linkMapa, mapaEmbutido, nivelEfeitos, situacaoAgora, urlAbsoluta, urlFoto } from "@/lib/barbearias";

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
  const trabalhos = fotos.filter((f) => f.categoria !== "equipe" && !f.antesDe && f.arquivo !== capa?.arquivo);
  // Abertura: a capa e mais algumas do ambiente e dos trabalhos, pra passar como vitrine.
  const slides = [
    ...(capa ? [capa] : []),
    ...trabalhos.filter((f) => f.categoria === "ambiente"),
    ...trabalhos.filter((f) => f.categoria !== "ambiente" && f.categoria !== "produtos"),
  ].slice(0, 5);
  const pares = banco.paresAntesDepois(b.id);
  const tema = b.tema;
  const efeitos = nivelEfeitos(tema);
  const hoje = agoraNoFuso(b.fuso);
  // Neve só no inverno do Brasil (junho a agosto), e só no Luxo Técnico.
  const inverno = ["06", "07", "08"].includes(hoje.slice(5, 7));
  const servicos = banco.servicos(b.id, true);
  const equipe = banco.profissionais(b.id, true);
  const numeros = [
    ...(b.desde ? [{ valor: Number(hoje.slice(0, 4)) - b.desde, rotulo: "anos de casa" }] : []),
    { valor: equipe.length, rotulo: equipe.length === 1 ? "profissional" : "profissionais" },
    ...((() => { const n = banco.totalAtendimentos(b.id); return n >= 20 ? [{ valor: n, rotulo: "horários marcados pelo site" }] : []; })()),
  ].filter((n) => n.valor > 0);
  const expedientes = banco.expedientes(b.id);
  const agora = situacaoAgora(b, expedientes);
  const mapa = linkMapa(b);
  const mapaNaPagina = mapaEmbutido(b);
  const agenda = b.atendimento !== "chegada";
  // Fila só faz sentido com a barbearia aberta e informada há pouco.
  const fila = agora.aberto ? banco.filaAgora(b) : undefined;
  const whats = `https://wa.me/${b.telefone}?text=${encodeURIComponent(`Olá, ${b.nome}! Vim pelo site.`)}`;
  const telefoneBonito = b.telefone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
  const vagas = agenda && servicos[0] ? proximasVagas(banco, b.id, servicos[0].id, equipe.map((p) => p.id), hoje.slice(0, 10)) : null;
  const categoriasUsadas = CATEGORIAS_FOTO.filter((c) => c.id !== "equipe" && fotos.some((f) => f.categoria === c.id));
  const fotosLista = fotosDosServicos(servicos.map((s) => s.nome), trabalhos);
  const fotoServico = new Map(servicos.map((s, i) => [s.id, fotosLista[i]]));
  const gruposServicos = [
    { id: "servicos", titulo: "Cortes", itens: servicos.filter((s) => ehCorte(s.nome)) },
    { id: "barba", titulo: "Barba e cuidados", itens: servicos.filter((s) => !ehCorte(s.nome)) },
  ].filter((g) => g.itens.length > 0);
  // Sem nenhum corte no cardápio, o primeiro grupo vira "Serviços" (e mantém a âncora #servicos).
  if (gruposServicos[0] && gruposServicos[0].id !== "servicos") gruposServicos[0] = { ...gruposServicos[0], id: "servicos", titulo: "Serviços" };
  // Mosaico: a capa de novo (é a foto mais bonita do site) e dois cortes.
  const mosaico = [
    ...(capa ? [capa] : []),
    ...trabalhos.filter((f) => ["degrade", "corte", "navalhado", "barba"].includes(f.categoria)).slice(-2),
  ];
  // Fotos do ambiente pra "Conheça a casa" e pro fundo da chamada final, sem repetir quando dá.
  const ambientes = trabalhos.filter((f) => f.categoria === "ambiente");
  const fotoCasa = ambientes.at(-1) ?? capa;
  const fotoChamada = ambientes.length > 1 ? ambientes[0] : capa;
  const agendarHref = `${base}/agendar`;
  // Site de cliente ainda com fotos do banco de exemplos: não chama de "Trabalhos" o que não é dele.
  const acervo = b.demoAte ? new Set<string>() : arquivosDoAcervo();
  const tituloTrabalhos = trabalhos.filter((f) => acervo.has(f.arquivo)).length > trabalhos.length / 2 ? "Inspiração" : "Trabalhos";
  const frases = frasesDoTema(tema);
  // Fundo das frases: fotos que lembram barbearia (ambiente, depois ferramentas, depois a capa).
  // Começa pelas que ainda não apareceram grandes; com poucas, repete.
  const fundosFrase = [
    ...ambientes.filter((f) => f !== fotoCasa && f !== fotoChamada),
    ...trabalhos.filter((f) => f.categoria === "produtos"),
    ...ambientes,
    ...(capa ? [capa] : []),
  ];
  const fotoFrase = (i: number) => fundosFrase.length ? fundosFrase[i % fundosFrase.length] : undefined;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: dadosEstruturados(b, { expedientes, servicos, capa: capa?.arquivo }),
      }} />

      <section className="b-heroi">
        <CapaSlides
          slides={slides.map((f) => ({ src: urlFoto(f.arquivo), alt: f.legenda ?? `Foto da ${b.nome}`, largura: f.largura, altura: f.altura }))}
          passar={efeitos >= 2 ? 6000 : undefined}
        />
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
              ? <Link href={agendarHref} className="b-botao b-botao-grande"><CalendarCheck size={20} aria-hidden /> Agendar horário</Link>
              : mapa && <a href={mapa} className="b-botao b-botao-grande" target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden /> Como chegar</a>}
            {b.telefone && <a href={whats} className="b-botao-sec" target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden /> WhatsApp</a>}
          </div>
          {vagas && servicos[0] && (
            <div className="b-vagas" aria-labelledby="vagas-titulo">
              <h2 id="vagas-titulo">{vagas.itens.length <= 3 ? "Últimos horários" : "Horários livres"} {vagas.quando} pra {servicos[0].nome.toLowerCase()}</h2>
              <ul>
                {vagas.itens.map((v) => (
                  <li key={v.hora}>
                    <Link href={`${agendarHref}?servico=${servicos[0]!.id}&com=${v.profissionalId}&data=${vagas.data}&hora=${v.hora}`} aria-label={`Marcar ${vagas.quando} às ${v.hora}`}>{v.hora}</Link>
                  </li>
                ))}
              </ul>
              <Link href={agendarHref} className="b-vagas-mais">Outros dias e serviços</Link>
            </div>
          )}
          <ul className="b-info-rapida">
            <li className={`b-estado ${agora.aberto ? "aberto" : ""}`}><Clock size={16} aria-hidden /> {agora.texto}</li>
            {b.endereco && <li><MapPin size={16} aria-hidden /> {mapa ? <a href={mapa} target="_blank" rel="noopener noreferrer">{b.endereco}</a> : b.endereco}</li>}
          </ul>
        </div>
      </section>

      {categoriasUsadas.length > 0 && (
        <div className="b-faixa" aria-hidden="true">
          <div>{[...categoriasUsadas, ...categoriasUsadas, ...categoriasUsadas].map((c, i) => <span key={i}>{c.nome}</span>)}</div>
        </div>
      )}

      {b.oferta && <p className="b-oferta">{b.oferta}</p>}

      <Frase texto={frases[0]} foto={fotoFrase(0)} />

      {gruposServicos.map((g, gi) => (
        <CarrosselB
          key={g.id}
          id={g.id}
          titulo={g.titulo}
          className="b-carrossel-servicos"
          apoio={gi === 0 && agenda ? "Escolha o seu. O resto é com a gente." : undefined}
        >
          {g.itens.map((s) => {
            const f = fotoServico.get(s.id);
            return (
              <article key={s.id} className="b-cartao-servico">
                <div className="b-cartao-foto">
                  {f
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={urlFoto(f.arquivo, "p")} alt="" loading="lazy" width={f.largura} height={f.altura} />
                    : <Scissors size={40} aria-hidden />}
                </div>
                <div className="b-cartao-corpo">
                  <h3>{s.nome}</h3>
                  {s.descricao && <p className="b-cartao-desc">{s.descricao}</p>}
                  <p className="b-cartao-info">
                    <span>{s.duracaoMin} min</span>
                    {s.emDomicilio && <span>Vou até você</span>}
                    {b.mostrarPrecos && <strong className="b-servico-preco">{reais(s.precoCentavos)}</strong>}
                  </p>
                  {agenda && <Link href={`${agendarHref}?servico=${s.id}`} className="b-botao b-botao-pequeno" aria-label={`Agendar ${s.nome}`}>{ehCorte(s.nome) ? "Quero esse" : "Agendar"}</Link>}
                </div>
              </article>
            );
          })}
        </CarrosselB>
      ))}

      {mosaico.length >= 3 && (
        <section className="b-mosaico" aria-labelledby="mosaico-titulo" data-revelar>
          <div className="b-mosaico-principal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlFoto(mosaico[0]!.arquivo)} alt={mosaico[0]!.legenda ?? ""} loading="lazy" width={mosaico[0]!.largura} height={mosaico[0]!.altura} />
            <div className="b-mosaico-texto">
              <h2 id="mosaico-titulo">Você sai daqui outro.</h2>
              {agenda && <Link href={agendarHref} className="b-botao b-botao-grande">Escolher meu corte</Link>}
            </div>
          </div>
          {mosaico.slice(1).map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.id} src={urlFoto(f.arquivo, "p")} alt={f.legenda ?? ""} loading="lazy" width={f.largura} height={f.altura} />
          ))}
        </section>
      )}

      <Frase texto={frases[1]} foto={fotoFrase(1)} />

      {trabalhos.length > 0 && (
        <CarrosselB
          id="trabalhos"
          titulo={tituloTrabalhos}
          className="b-carrossel-trabalhos"
          rodape={
            <nav className="b-filtros" aria-label="Trabalhos por tipo">
              {categoriasUsadas.filter((c) => c.id !== "ambiente" && c.id !== "produtos").map((c) => (
                <Link key={c.id} href={`${base}/trabalhos?categoria=${c.id}`}>{c.nome}</Link>
              ))}
              <Link href={`${base}/trabalhos`}>Ver todos <ArrowRight size={14} aria-hidden /></Link>
            </nav>
          }
        >
          {trabalhos.slice(0, 12).map((f) => (
            <figure key={f.id} className="b-foto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlFoto(f.arquivo, "p")} alt={f.legenda ?? CATEGORIAS_FOTO.find((c) => c.id === f.categoria)?.nome ?? "Trabalho"} loading="lazy" width={f.largura} height={f.altura} />
              {f.legenda && <figcaption>{f.legenda}</figcaption>}
            </figure>
          ))}
        </CarrosselB>
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

      {equipe.length > 0 && (
        <CarrosselB id="equipe" titulo="Equipe" className="b-carrossel-equipe">
          {equipe.map((p) => (
            <article key={p.id} className="b-pessoa">
              {p.fotoArquivo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={urlFoto(p.fotoArquivo, "p")} alt={p.nome} loading="lazy" />
                : <div className="b-pessoa-inicial" aria-hidden="true">{p.nome[0]}</div>}
              <h3>{p.nome}</h3>
              {p.especialidade && <p>{p.especialidade}</p>}
              {agenda && <Link href={`${agendarHref}?profissional=${p.id}`} className="b-botao-sec">Agendar com {primeiroNome(p.nome)}</Link>}
            </article>
          ))}
        </CarrosselB>
      )}

      <Frase texto={frases[2]} foto={fotoFrase(2)} />

      <section className="b-secao b-casa" aria-labelledby="casa-titulo">
        {fotoCasa && (
          <div className="b-casa-foto" data-revelar>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlFoto(fotoCasa.arquivo)} alt={fotoCasa.legenda ?? `Ambiente da ${b.nome}`} loading="lazy" width={fotoCasa.largura} height={fotoCasa.altura} />
          </div>
        )}
        <div className="b-casa-texto" data-revelar>
          <h2 id="casa-titulo">Conheça a casa</h2>
          {b.bio && <p className="b-casa-bio">{b.bio}</p>}
          {numeros.length > 0 && (
            <dl className="b-numeros">
              {numeros.map((n) => (
                <div key={n.rotulo}><dt>{n.rotulo}</dt><dd data-contar={tema === "tecnico" ? n.valor : undefined}>{n.valor}</dd></div>
              ))}
            </dl>
          )}
          {b.instagram && (
            <a className="b-casa-insta" href={`https://instagram.com/${b.instagram}`} target="_blank" rel="noopener noreferrer"><AtSign size={18} aria-hidden /> Veja mais no Instagram @{b.instagram}</a>
          )}
        </div>
      </section>

      {agenda && (
        <section className="b-chamada" aria-labelledby="chamada-titulo">
          {fotoChamada && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlFoto(fotoChamada.arquivo)} alt="" loading="lazy" width={fotoChamada.largura} height={fotoChamada.altura} />
          )}
          <div className="b-chamada-texto" data-revelar>
            <h2 id="chamada-titulo">Seu próximo corte já tem horário.</h2>
            <p>Garanta o seu em menos de um minuto, sem criar conta.</p>
            <Link href={agendarHref} className="b-botao b-botao-grande"><CalendarCheck size={20} aria-hidden /> Agendar horário</Link>
          </div>
        </section>
      )}

      <section className="b-secao" id="contato">
        <h2>Horários e onde estamos</h2>
        <div className="b-contato">
          <table className="b-horarios">
            <tbody>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const e = expedientes.get(d);
                return (
                  <tr key={d} className={d === diaDaSemana(hoje.slice(0, 10)) ? "hoje" : undefined}>
                    <th scope="row">{nomeDia(d)}</th>
                    <td>{e ? `${e.abre}–${e.fecha}` : "Fechado"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="b-contato-lado">
            <ul className="b-contatos">
              {b.endereco && <li><MapPin size={18} aria-hidden /> {mapa ? <a href={mapa} target="_blank" rel="noopener noreferrer">{b.endereco}{b.cidade ? `, ${b.cidade}` : ""}</a> : b.endereco}</li>}
              {b.telefone && <li><Phone size={18} aria-hidden /> <a href={`tel:+${b.telefone}`}>{telefoneBonito}</a></li>}
              {b.telefone && <li><MessageCircle size={18} aria-hidden /> <a href={whats} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a></li>}
              {b.instagram && <li><AtSign size={18} aria-hidden /> <a href={`https://instagram.com/${b.instagram}`} target="_blank" rel="noopener noreferrer">@{b.instagram}</a></li>}
            </ul>
            <div className="b-acoes">
              {agenda && <Link href={agendarHref} className="b-botao">Agendar horário</Link>}
              {mapa && !mapaNaPagina && <a href={mapa} className="b-botao-sec" target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden /> Como chegar</a>}
            </div>
            {mapaNaPagina && (
              <div className="b-mapa" data-revelar>
                <iframe
                  src={mapaNaPagina}
                  title={`Mapa: onde fica a ${b.nome}`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
                {mapa && (
                  <a href={mapa} className="b-botao b-mapa-botao" target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden /> Como chegar</a>
                )}
              </div>
            )}
          </div>
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
