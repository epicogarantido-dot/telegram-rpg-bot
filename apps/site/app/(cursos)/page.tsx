import Link from "next/link";
import { ArrowRight, HeartHandshake, Languages, Scissors, ShieldCheck } from "lucide-react";
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

/**
 * Funil de venda: quem chega (do grupo, de uma matéria, do cartão) acha conteúdo grátis pra
 * barbearia e, logo em seguida, o site com agenda. Sem cadastro em lugar nenhum: tudo aberto.
 */
export default async function Inicio() {
  // Os cursos de barbearia na frente: é pra quem esse site fala.
  const cursos = (await carregarCursos()).sort((a, b) => Number(b.tags.includes("barbearia")) - Number(a.tags.includes("barbearia")));
  const artigos = (await carregarArtigos()).slice(0, MAX_ITENS_CARROSSEL);
  return (
    <>
      <section className="heroi">
        <span className="selo"><Scissors className="icone" aria-hidden /> Pra quem vive de barbearia</span>
        <h1>Agenda cheia se aprende.</h1>
        <p>
          Cursos e matérias grátis sobre preço, cliente que volta, divulgação e dinheiro em ordem.
          Tudo aberto: sem cadastro, sem senha. E, quando quiser, um site com agenda pra sua barbearia.
        </p>
        <div className="acoes-heroi">
          <Link href="/cursos" className="botao">Ver os cursos grátis</Link>
          <a href="/app/cadastro" className="botao-sec" data-evento="quero">Quero meu site <ArrowRight size={18} aria-hidden /></a>
        </div>
      </section>

      <Carrossel titulo="Cursos grátis" verTodos={{ href: "/cursos", texto: "Ver todos" }}>
        {cursos.slice(0, MAX_ITENS_CARROSSEL).map((c) => <CartaoCurso key={c.slug} curso={c} />)}
      </Carrossel>

      {/* Os estilos de verdade que o barbeiro escolhe, com os prints dos sites de demonstração. */}
      <Carrossel
        titulo="Um site com a cara da sua barbearia"
        descricao={<>Não é site padrão: é a sua marca. As suas fotos, o seu nome, a sua equipe e os seus preços, num dos {TEMAS.length} estilos. O cliente vê o seu trabalho e marca horário sozinho.</>}
      >
        {TEMAS.map((t) => (
          <a key={t.id} href={`/exemplo/${t.id}`} className="estilo-slide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/barbeiros/${t.id}.webp`} alt={`Site no estilo ${t.nome}, visto no celular`} width={390} height={780} loading="lazy" />
            <span className="estilo-slide-legenda">
              <strong>{t.nome}</strong><span>{t.resumo}</span>
              <span className="estilo-slide-vivo">Abrir o exemplo no ar</span>
            </span>
          </a>
        ))}
      </Carrossel>
      <p className="vitrine-acao">
        <Link href="/barbeiros" className="botao" data-evento="estilos">Conhecer o site <ArrowRight size={18} aria-hidden /></Link>
      </p>

      {artigos.length > 0 && (
        <Carrossel titulo="Da revista" verTodos={{ href: "/revista", texto: "Ver todas" }}>
          {artigos.map((a) => <CartaoMateria key={a.slug} artigo={a} />)}
        </Carrossel>
      )}

      <section className="vantagens" aria-label="Como funciona o Aprenda Livre">
        <div className="vantagem">
          <span className="chip-icone acento"><HeartHandshake size={20} aria-hidden /></span>
          <div><strong>Grátis de verdade</strong><span>Sem cadastro e sem senha: é só abrir e ler, no celular.</span></div>
        </div>
        <div className="vantagem">
          <span className="chip-icone"><Languages size={20} aria-hidden /></span>
          <div><strong>Em português</strong><span>Material de fora traduzido com cuidado, e cursos escritos pra barbearia brasileira.</span></div>
        </div>
        <div className="vantagem">
          <span className="chip-icone"><ShieldCheck size={20} aria-hidden /></span>
          <div><strong>Com fonte</strong><span>Preço, lei e número só entram conferidos, com a fonte no fim.</span></div>
        </div>
      </section>
    </>
  );
}
