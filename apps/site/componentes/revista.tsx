import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Artigo } from "@aprenda/catalogo";
import { planoDoAmbiente } from "@aprenda/agenda";
import { reais } from "@/lib/agenda";
import { dataPorExtenso } from "@/lib/datas";

export const TIPO_ARTIGO: Record<Artigo["tipo"], string> = { noticia: "Mercado", serie: "Série", guia: "Guia", curiosidade: "Curiosidade" };

export function rotuloArtigo(a: Artigo): string {
  return a.serie ? `${a.serie.nome} · Ep. ${a.serie.episodio}` : TIPO_ARTIGO[a.tipo];
}

export function CartaoMateria({ artigo }: { artigo: Artigo }) {
  return (
    <Link href={`/revista/${artigo.slug}`} className="cartao cartao-materia">
      {artigo.imagem && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artigo.imagem.arquivo} alt="" width={600} height={400} loading="lazy" decoding="async" className="cartao-materia-foto" />
      )}
      <span className="revista-tipo">{rotuloArtigo(artigo)}</span>
      <h3>{artigo.titulo}</h3>
      <p>{artigo.resumo}</p>
      <time dateTime={artigo.publicadoEm}>{dataPorExtenso(artigo.publicadoEm)}</time>
    </Link>
  );
}

/** Foto de abertura da matéria com o crédito e a licença (exigência das licenças CC). */
export function FotoMateria({ imagem }: { imagem: NonNullable<Artigo["imagem"]> }) {
  return (
    <figure className="artigo-foto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imagem.arquivo} alt={imagem.alt} width={1200} height={800} fetchPriority="high" />
      <figcaption>
        Foto: <a href={imagem.fonte} target="_blank" rel="noopener noreferrer">{imagem.credito}</a> ({imagem.licenca})
      </figcaption>
    </figure>
  );
}

/**
 * Propaganda do SaaS no fim de cada matéria. Matéria é texto próprio (não é curso CC BY-NC),
 * então pode. O preço vem do mesmo plano da página de venda.
 */
export function PropagandaSaas() {
  const plano = planoDoAmbiente();
  const adesao = plano.adesaoCentavos || plano.valorCentavos;
  return (
    <aside className="propaganda" aria-labelledby="propaganda-titulo">
      <div className="propaganda-texto">
        <p className="propaganda-de">Do Aprenda Livre, pra quem tem barbearia</p>
        <h2 id="propaganda-titulo">Seu site e sua agenda, prontos hoje.</h2>
        <ul>
          <li>O cliente vê seus cortes e marca sozinho, a qualquer hora.</li>
          <li>Aviso no seu celular a cada horário novo.</li>
          <li>Seis estilos de site; você muda tudo pelo celular.</li>
        </ul>
        <p className="propaganda-preco">
          {plano.testeDias > 0 && `${plano.testeDias} dias pra testar. `}{reais(adesao)} na contratação (já com o primeiro mês) e {reais(plano.valorCentavos)} por mês, no Pix.
        </p>
        <div className="acoes">
          <Link href="/app/cadastro" className="botao">Criar minha agenda <ArrowRight size={18} aria-hidden /></Link>
          <Link href="/barbeiros#estilos" className="botao-sec">Ver os estilos</Link>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/barbeiros/atemporal.webp" alt="" width={390} height={780} loading="lazy" className="propaganda-celular" />
    </aside>
  );
}
