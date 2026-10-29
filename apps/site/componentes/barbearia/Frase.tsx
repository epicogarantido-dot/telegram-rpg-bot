import { urlFoto } from "@/lib/barbearias";

/**
 * Frase grande entre as seções, sobre uma foto que lembra barbearia, correndo de lado sem parar
 * como um letreiro (não depende de rolar a página). Duas voltas iguais emendam sem buraco; leitor
 * de tela lê a frase uma vez só. Com "reduzir movimento", a frase fica parada e inteira.
 */
export function Frase({ texto, foto }: { texto: string; foto?: { arquivo: string; largura?: number; altura?: number } }) {
  return (
    <section className={`b-frase b-letreiro ${foto ? "b-frase-foto" : ""}`}>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlFoto(foto.arquivo)} alt="" loading="lazy" width={foto.largura} height={foto.altura} />
      )}
      <p className="b-so-leitor">{texto}</p>
      <div className="b-letreiro-faixa" aria-hidden="true">
        {/* Seis cópias: a metade de cá e a de lá são iguais, então andar 50% emenda certinho. */}
        <div className="b-letreiro-trilho">{[0, 1, 2, 3, 4, 5].map((i) => <span key={i}>{texto}</span>)}</div>
      </div>
    </section>
  );
}
