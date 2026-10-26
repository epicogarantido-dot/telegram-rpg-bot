import Link from "next/link";
import { carregarArtigos } from "@aprenda/catalogo";
import { rotuloArtigo } from "@/componentes/revista";
import { dataPorExtenso } from "@/lib/datas";

export const metadata = {
  title: "Revista da barbearia",
  description: "Notícias do mercado, a série Barbearias pelo mundo e curiosidades da profissão.",
};

export default async function Revista() {
  const artigos = await carregarArtigos();
  return (
    <div className="revista">
      <header className="revista-cabeca">
        <h1>Revista da barbearia</h1>
        <p className="suave">Notícias do mercado, como trabalham as barbearias de outros países e curiosidades da profissão. Tudo com as fontes no fim.</p>
      </header>
      {artigos.length === 0 ? <p>Em breve.</p> : (
        <ul className="revista-lista">
          {artigos.map((a) => (
            <li key={a.slug}>
              <Link href={`/revista/${a.slug}`}>
                <span className="revista-tipo">{rotuloArtigo(a)}</span>
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
