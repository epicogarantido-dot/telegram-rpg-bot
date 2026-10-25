import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, Languages, Scissors, Search, ShieldCheck } from "lucide-react";
import { carregarCursos } from "@aprenda/catalogo";
import { DemoBarbearia } from "../componentes/DemoBarbearia";
import { CartaoCurso } from "./componentes";

export default async function Inicio() {
  const cursos = await carregarCursos();
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
          <div><strong>Grátis de verdade</strong><span>Sem pegadinha. <Link href="/cadastro">Crie sua conta</Link> com o WhatsApp e salve seu progresso.</span></div>
        </div>
        <div className="vantagem">
          <span className="chip-icone"><ShieldCheck size={20} aria-hidden /></span>
          <div><strong>Licença aberta</strong><span>Só publicamos o que o autor permite traduzir e compartilhar.</span></div>
        </div>
      </section>

      <h2>Cursos</h2>
      <div className="grade">
        {cursos.map((c) => <CartaoCurso key={c.slug} curso={c} />)}
      </div>

      <section className="vitrine">
        <div>
          <span className="selo"><Scissors className="icone" aria-hidden /> Para barbearias</span>
          <h2>Seu trabalho num site bonito, com agenda online.</h2>
          <p className="suave">
            Mostre seus cortes como num book, e deixe o cliente marcar horário sozinho, a qualquer hora.
          </p>
          <Link href="/barbeiros" className="botao">Conhecer <ArrowRight size={18} aria-hidden /></Link>
        </div>
        <DemoBarbearia />
      </section>
    </>
  );
}
