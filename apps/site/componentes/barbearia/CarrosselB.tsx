"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Carrossel das seções do site da barbearia (serviços, trabalhos, equipe). Rola com o dedo,
 * trackpad ou setas; não anda sozinho. Com "reduzir movimento" o salto das setas é instantâneo.
 * O visual vem do tema (temas.css), então o mesmo carrossel veste os 6 estilos.
 */
export function CarrosselB({ id, titulo, apoio, rodape, className, children }: {
  id: string;
  titulo: string;
  /** Linha curta embaixo do título. */
  apoio?: React.ReactNode;
  /** Link ou botão depois do trilho (ex.: "Ver todos os trabalhos"). */
  rodape?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const trilho = useRef<HTMLUListElement>(null);
  const [inicio, setInicio] = useState(true);
  const [fim, setFim] = useState(false);
  const itens = Children.toArray(children);

  const medir = useCallback(() => {
    const t = trilho.current;
    if (!t) return;
    setInicio(t.scrollLeft <= 4);
    setFim(t.scrollLeft + t.clientWidth >= t.scrollWidth - 4);
  }, []);

  useEffect(() => {
    medir();
    const t = trilho.current;
    if (!t) return;
    t.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => { t.removeEventListener("scroll", medir); window.removeEventListener("resize", medir); };
  }, [medir]);

  function andar(direcao: 1 | -1) {
    const t = trilho.current;
    if (!t) return;
    const parado = matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: direcao * t.clientWidth * 0.85, behavior: parado ? "auto" : "smooth" });
  }

  const soUmaTela = inicio && fim;
  return (
    <section className={`b-secao b-carrossel ${className ?? ""}`} id={id} aria-labelledby={`${id}-titulo`} aria-roledescription="carrossel">
      <div className="b-carrossel-cabeca">
        <div>
          <h2 id={`${id}-titulo`}>{titulo}</h2>
          {apoio && <p className="b-carrossel-apoio">{apoio}</p>}
        </div>
        {!soUmaTela && (
          <div className="b-carrossel-setas">
            <button type="button" onClick={() => andar(-1)} disabled={inicio} aria-controls={`${id}-trilho`} aria-label="Voltar">
              <ArrowLeft size={18} aria-hidden />
            </button>
            <button type="button" onClick={() => andar(1)} disabled={fim} aria-controls={`${id}-trilho`} aria-label="Avançar">
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        )}
      </div>
      <ul className="b-carrossel-trilho" id={`${id}-trilho`} ref={trilho}>
        {itens.map((item, i) => (
          <li key={i} aria-label={`${i + 1} de ${itens.length}`} data-revelar style={{ "--ordem": i % 4 } as React.CSSProperties}>{item}</li>
        ))}
      </ul>
      {rodape && <div className="b-carrossel-rodape">{rodape}</div>}
    </section>
  );
}
