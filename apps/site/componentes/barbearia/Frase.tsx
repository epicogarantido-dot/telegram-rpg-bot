/**
 * Frase grande entre as seções, numa faixa limpa (sem foto atrás: texto sobre foto polui), correndo
 * de lado sem parar como um letreiro (não depende de rolar a página). Duas voltas iguais emendam
 * sem buraco; leitor de tela lê a frase uma vez só. Com "reduzir movimento", fica parada e inteira.
 */
export function Frase({ texto }: { texto: string }) {
  return (
    <section className="b-frase b-letreiro">
      <p className="b-so-leitor">{texto}</p>
      <div className="b-letreiro-faixa" aria-hidden="true">
        {/* Seis cópias: a metade de cá e a de lá são iguais, então andar 50% emenda certinho. */}
        <div className="b-letreiro-trilho">{[0, 1, 2, 3, 4, 5].map((i) => <span key={i}>{texto}</span>)}</div>
      </div>
    </section>
  );
}
