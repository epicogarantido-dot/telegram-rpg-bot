import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, Languages, Search, ShieldCheck } from "lucide-react";
import { carregarArtigos, carregarCursos } from "@aprenda/catalogo";
import { TEMAS } from "@aprenda/agenda";
import { CartaoCurso } from "@/componentes/cursos";
import { Carrossel } from "@/componentes/Carrossel";
import { MAX_ITENS_CARROSSEL } from "@/lib/carrossel";
import { CartaoMateria } from "@/componentes/revista";

/**
 * Página gerada no build, refeita no servidor a cada 10 min: depois de um deploy, uma versão
 * velha que tenha ficado no disco é trocada sozinha, e preços do .env (propaganda) valem logo.
 */
export const revalidate = 600;

export default async function Inicio() {
  const cursos = await carregarCursos();
  const artigos = (await carregarArtigos()).slice(0, MAX_ITENS_CARROSSEL);
  const areas = [...new Set(cursos.map((c) => c.area))].sort();
  return (
    <>
      <section className="heroi">
        <span className="selo"><Globe2 className="icone" aria-hidden /> Cursos abertos do mundo todo</span>
        <h1>O conhecimento do mundo, <em>em português.</em></h1>
        <p>
          Reunimos cursos gratuitos de universidades e comunidades do mundo inteiro e traduzimos para você,
          sempre com crédito aos autores originais.
        </p>
        <form action="/cursos" className="busca" role="search">
          <input name="q" placeholder="O que você quer aprender?" aria-label="Buscar cursos" />
          <button type="submit"><Search size={18} aria-hidden /> Buscar</button>
        </form>
        {areas.length > 0 && (
          <div className="etiquetas">
            {areas.map((a) => (
              <Link key={a} href={`/cursos?q=${encodeURIComponent(a)}`} className="etiqueta">{a}</Link>
            ))}
          </div>
        )}
      </section>

      <section className="vantagens" aria-label="Por que Aprenda Livre">
        <div className="vantagem">
          <span className="chip-icone"><Languages size={20} aria-hidden /></span>
          <div><strong>Em português</strong><span>Material de fora traduzido com cuidado, sem perder o original.</span></div>
        </div>
        <div className="vantagem">
          <span className="chip-icone acento"><HeartHandshake size={20} aria-hidden /></span>
          <div><strong>Grátis de verdade</strong><span>Sem pegadinha e sem senha. <Link href="/entrar">Entre pelo WhatsApp</Link> e salve seu progresso.</span></div>
        </div>
        <div className="vantagem">
          <span className="chip-icone"><ShieldCheck size={20} aria-hidden /></span>
          <div><strong>Licença aberta</strong><span>Só publicamos o que o autor permite traduzir e compartilhar.</span></div>
        </div>
      </section>

      <Carrossel titulo="Cursos" verTodos={{ href: "/cursos", texto: "Ver todos" }}>
        {cursos.slice(0, MAX_ITENS_CARROSSEL).map((c) => <CartaoCurso key={c.slug} curso={c} />)}
      </Carrossel>

      {artigos.length > 0 && (
        <Carrossel titulo="Da revista" verTodos={{ href: "/revista", texto: "Ver todas" }}>
          {artigos.map((a) => <CartaoMateria key={a.slug} artigo={a} />)}
        </Carrossel>
      )}

      {/* Os estilos de verdade que o barbeiro escolhe, com os prints dos sites de demonstração. */}
      <Carrossel
        titulo="Site e agenda pra barbearia"
        descricao={<>Escolha a cara da sua barbearia: {TEMAS.length} estilos prontos, com suas fotos e seus serviços. O cliente marca horário sozinho, a qualquer hora.</>}
      >
        {TEMAS.map((t) => (
          <Link key={t.id} href="/barbeiros#estilos" className="estilo-slide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/barbeiros/${t.id}.webp`} alt={`Site no estilo ${t.nome}, visto no celular`} width={390} height={780} loading="lazy" />
            <span className="estilo-slide-legenda"><strong>{t.nome}</strong><span>{t.resumo}</span></span>
          </Link>
        ))}
      </Carrossel>
      <p className="vitrine-acao">
        <Link href="/barbeiros" className="botao">Conhecer <ArrowRight size={18} aria-hidden /></Link>
      </p>
    </>
  );
}
