"use client";

import { useState } from "react";

/**
 * Comparador de antes e depois. Por cima das duas fotos fica um controle
 * deslizante de verdade (input range): funciona arrastando com o dedo ou o
 * mouse em qualquer ponto da foto, e também pelo teclado (setas).
 */
export function AntesDepois({ antes, depois, legenda }: { antes: string; depois: string; legenda?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <figure className="b-comparador" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
      <div className="b-comparador-palco">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={depois} alt={`Depois${legenda ? `: ${legenda}` : ""}`} loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={antes} alt="Antes" className="b-comparador-antes" loading="lazy" />
        <span className="b-comparador-linha" aria-hidden="true" />
        <span className="b-comparador-rotulo antes" aria-hidden="true">Antes</span>
        <span className="b-comparador-rotulo depois" aria-hidden="true">Depois</span>
        <input
          type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
          className="b-comparador-controle" aria-label="Arraste pra comparar o antes e o depois"
        />
      </div>
      {legenda && <figcaption>{legenda}</figcaption>}
    </figure>
  );
}
