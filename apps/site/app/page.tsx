import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, Languages, Scissors, Search, ShieldCheck } from "lucide-react";
import { carregarCursos } from "@aprenda/catalogo";
import { Cena3D } from "../componentes/Cena3D";
import { DemoBarbearia } from "../componentes/DemoBarbearia";
import { Inclinavel } from "../componentes/Inclinavel";
import { CartaoCurso } from "./componentes";

export default async function Inicio() {
  const cursos = await carregarCursos();
  const areas = [...new Set(cursos.map((c) => c.area))].sort();
  return (
    <>
      <section className="heroi heroi-3d">
        <div className="heroi-texto">
          <span className="selo"><Globe2 className="icone" aria-hidden /> Cursos abertos do mundo todo</span>
          <h1>O conhecimento do mundo, <em>em português.</em></h1>
          <p>
            Cursos gratuitos de universidades e comunidades do mundo inteiro, traduzidos pra você,
            sempre com crédito aos autores originais.
          </p>
          <div className="acoes-heroi">
            <Link href="/cadastro" className="botao botao-grande">Criar conta grátis <ArrowRight size={18} aria-hidden /></Link>
            <Link href="/cursos" className="botao-sec botao-grande">Ver cursos</Link>
          </div>
        </div>
        <Cena3D />
      </section>

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

      <section className="vantagens" aria-label="Por que Aprenda Livre">
        <div className="vantagem">
          <span className="chip-icone"><Languages size={20} aria-hidden /></span>
          <div><strong>Em português</strong><span>Material de fora traduzido com cuidado, sem perder o original.</span></div>
        </div>
        <div className="vantagem">
          <span className="chip-icone acento"><HeartHandshake size={20} aria-hidden /></span>
          <div><strong>Grátis de verdade</strong><span>Entre com seu WhatsApp e salve seu progresso.</span></div>
        </div>
        <div className="vantagem">
          <span className="chip-icone"><ShieldCheck size={20} aria-hidden /></span>
          <div><strong>Licença aberta</strong><span>Só publicamos o que o autor permite traduzir e compartilhar.</span></div>
        </div>
      </section>

      <h2>Cursos</h2>
      <div className="grade">
        {cursos.map((c) => <Inclinavel key={c.slug} intensidade={6}><CartaoCurso curso={c} /></Inclinavel>)}
      </div>

      <section className="vitrine">
        <div>
          <span className="selo"><Scissors className="icone" aria-hidden /> Para barbearias</span>
          <h2>Seu trabalho num site bonito, com agenda online.</h2>
          <p className="suave">
            Mostre seus cortes como num book, e deixe o cliente marcar horário sozinho, a qualquer hora.
            Passe o dedo no celular ao lado. 👉
          </p>
          <Link href="/barbeiros" className="botao">Conhecer <ArrowRight size={18} aria-hidden /></Link>
        </div>
        <DemoBarbearia />
      </section>
    </>
  );
}
