import { urlFoto } from "@/lib/barbearias";

/**
 * Frase grande entre as seções. As palavras aparecem uma a uma quando a frase entra na tela
 * (Efeitos.tsx marca `data-revelar`); sem JavaScript ou com movimento reduzido, já vem inteira.
 * Com `foto`, a frase fica sobre a foto, que corre mais devagar que a página.
 */
export function Frase({ texto, foto }: { texto: string; foto?: { arquivo: string; largura?: number; altura?: number } }) {
  let i = 0;
  return (
    <section className={`b-frase ${foto ? "b-frase-foto" : ""}`} data-revelar>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlFoto(foto.arquivo)} alt="" loading="lazy" width={foto.largura} height={foto.altura} />
      )}
      <p>
        {texto.split(" ").map((p, k) => (
          <span key={k} className="b-frase-palavra" style={{ "--i": i++ } as React.CSSProperties}>{p} </span>
        ))}
      </p>
    </section>
  );
}
