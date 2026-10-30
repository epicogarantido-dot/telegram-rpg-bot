import { urlFoto } from "@/lib/barbearias";

/**
 * Frase entre as partes da página: primeiro uma foto grande, como a capa, e embaixo a frase
 * inteira, parada (sem letreiro e sem texto em cima da foto). Sem foto, fica só a frase.
 */
export function Frase({ texto, foto }: { texto: string; foto?: { arquivo: string; largura?: number; altura?: number; legenda?: string } }) {
  return (
    <section className={`b-frase-capa ${foto ? "" : "sem-foto"}`}>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlFoto(foto.arquivo)} alt="" loading="lazy" width={foto.largura} height={foto.altura} data-revelar />
      )}
      <p className="b-frase-texto">{texto}</p>
    </section>
  );
}
