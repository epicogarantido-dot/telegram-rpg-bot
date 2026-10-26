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
      <span className="revista-tipo">{rotuloArtigo(artigo)}</span>
      <h3>{artigo.titulo}</h3>
      <p>{artigo.resumo}</p>
      <time dateTime={artigo.publicadoEm}>{dataPorExtenso(artigo.publicadoEm)}</time>
    </Link>
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
          {plano.testeDias > 0 && `${plano.testeDias} dias grátis. `}Depois {reais(adesao)} na contratação e {reais(plano.valorCentavos)} por mês, no Pix.
        </p>
        <div className="acoes">
          <Link href="/app/cadastro" className="botao">Criar minha agenda grátis <ArrowRight size={18} aria-hidden /></Link>
          <Link href="/barbeiros#estilos" className="botao-sec">Ver os estilos</Link>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/barbeiros/atemporal.webp" alt="" width={390} height={780} loading="lazy" className="propaganda-celular" />
    </aside>
  );
}
