import Link from "next/link";
import { carregarArtigos, type Artigo } from "@aprenda/catalogo";
import { dataPorExtenso } from "@/lib/datas";

export const metadata = {
  title: "Revista da barbearia",
  description: "Notícias do mercado, a série Barbearias pelo mundo e guias pra quem vive de barbearia.",
};

const TIPO: Record<Artigo["tipo"], string> = { noticia: "Mercado", serie: "Série", guia: "Guia" };

export default async function Revista() {
  const artigos = await carregarArtigos();
  return (
    <div className="revista">
      <header className="revista-cabeca">
        <h1>Revista da barbearia</h1>
        <p className="suave">Notícias do mercado, como trabalham as barbearias de outros países e guias pra aprender mais. Tudo com as fontes no fim.</p>
      </header>
      {artigos.length === 0 ? <p>Em breve.</p> : (
        <ul className="revista-lista">
          {artigos.map((a) => (
            <li key={a.slug}>
              <Link href={`/revista/${a.slug}`}>
                <span className="revista-tipo">{a.serie ? `${a.serie.nome} · Ep. ${a.serie.episodio}` : TIPO[a.tipo]}</span>
                <strong>{a.titulo}</strong>
                <span className="suave">{a.resumo}</span>
                <time dateTime={a.publicadoEm}>{dataPorExtenso(a.publicadoEm)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
