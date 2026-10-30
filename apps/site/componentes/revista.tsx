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

/** A ponte pro site, ligada ao assunto do que a pessoa acabou de ler (uma só, depois da parte útil). */
const PONTES = [
  { assunto: /agenda|hor[aá]rio|falt|volt|fideli|retorno|cliente/i, titulo: "Agenda cheia começa com o cliente marcando sozinho.", frase: "No seu site, o cliente vê os horários livres e marca a qualquer hora, sem você parar o corte pra responder." },
  { assunto: /pre[cç]o|lucro|dinheiro|financ|custo|caixa|cobr/i, titulo: "Preço bem mostrado vende sozinho.", frase: "No seu site, cada serviço aparece com o preço, o tempo e o que inclui, e o cliente já soma a barba no corte." },
  { assunto: /foto|v[ií]deo|instagram|marketing|divulg|redes|google/i, titulo: "Seu trabalho merece uma vitrine.", frase: "No seu site, os seus cortes ficam em destaque, com antes e depois, e o link vai na bio do Instagram e no Google." },
  { assunto: /equipe|barbeiro parceiro|funcion|comiss/i, titulo: "Cada barbeiro com a sua agenda.", frase: "No seu site, o cliente vê a equipe com foto e escolhe com quem quer cortar; você vê a divisão do mês." },
] as const;

/**
 * Propaganda do SaaS no fim de cada matéria e lição (nunca em curso CC BY-NC). Matéria é texto
 * próprio, então pode. O título muda com o assunto (`assunto`: título e resumo do que foi lido).
 */
/**
 * Convite curto logo abaixo da foto da matéria: quem chega pelo grupo e não lê até o fim
 * também fica sabendo do site. Sem preço (a página é gerada no build); o preço vem na propaganda do fim.
 */
export function FaixaSaas() {
  return (
    <p className="faixa-saas">
      <span><strong>Tem barbearia?</strong> Site com agenda online pro cliente marcar sozinho, pronto em até 24 horas.</span>
      <a href="/#estilos" data-evento="estilos" data-detalhe="faixa-materia">Ver os estilos</a>
    </p>
  );
}

export function PropagandaSaas({ assunto = "" }: { assunto?: string }) {
  const plano = planoDoAmbiente();
  const adesao = plano.adesaoCentavos || plano.valorCentavos;
  const ponte = PONTES.find((p) => p.assunto.test(assunto));
  return (
    <aside className="propaganda" aria-labelledby="propaganda-titulo">
      <div className="propaganda-texto">
        <p className="propaganda-de">Pra quem tem barbearia</p>
        <h2 id="propaganda-titulo">{ponte?.titulo ?? "Um site com a cara da sua barbearia."}</h2>
        <p>{ponte?.frase ?? "As suas fotos, os seus serviços e preços e a sua equipe, e o cliente marca sozinho, a qualquer hora."}</p>
        <p className="propaganda-preco">
          {reais(adesao)} pra começar (com o primeiro mês) e {reais(plano.valorCentavos)} por mês, no Pix. Sem fidelidade.
        </p>
        <div className="acoes">
          <a href="/#estilos" className="botao" data-evento="estilos">Ver os estilos</a>
          <a href="/app/cadastro" className="botao-sec" data-evento="quero">Quero o meu site</a>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/barbeiros/atemporal.webp" alt="" width={390} height={780} loading="lazy" className="propaganda-celular" />
    </aside>
  );
}
