import { carregarCursos, permiteUsoComercial } from "@aprenda/catalogo";

export const metadata = { title: "Licenças e créditos" };

export default async function Licencas() {
  const cursos = await carregarCursos();
  return (
    <>
      <h1>Licenças e créditos</h1>
      <p>
        Só publicamos material cuja licença permite tradução e redistribuição (Creative Commons e licenças de
        software livre). Cada tradução mantém a mesma licença do original quando ela exige isso
        (“CompartilhaIgual”) e dá crédito aos autores em todas as páginas.
      </p>
      <ul>
        {cursos.map((c) => (
          <li key={c.slug}>
            <strong>{c.titulo}</strong> — {c.fonte.atribuicao}{" "}
            {!permiteUsoComercial(c.fonte.licenca) && <em>(uso não comercial)</em>}{" "}
            {c.fonte.url && <a href={c.fonte.url} target="_blank" rel="noopener noreferrer">original</a>}
          </li>
        ))}
      </ul>
    </>
  );
}
