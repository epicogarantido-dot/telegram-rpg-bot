"use client";

import { useEffect, useRef, useState } from "react";

export type Slide = { src: string; alt: string; largura?: number; altura?: number };

/**
 * Fotos da abertura, uma por vez, trocando com um esmaecer. Passa sozinha só quando o tema
 * permite (`passar` em ms), a aba está aberta e ninguém pediu "reduzir movimento"; dá uma
 * volta e para na primeira foto (nada se mexe pra sempre) e para antes se o mouse está em
 * cima ou a pessoa tocou. Bolinhas e deslizar o dedo trocam na hora.
 */
export function CapaSlides({ slides, passar }: { slides: Slide[]; passar?: number }) {
  const [atual, setAtual] = useState(0);
  const [parado, setParado] = useState(false);
  const toque = useRef<number | null>(null);
  const total = slides.length;

  useEffect(() => {
    if (!passar || total < 2 || parado) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let passos = 0;
    const id = setInterval(() => {
      if (document.hidden) return;
      setAtual((a) => (a + 1) % total);
      if (++passos >= total) clearInterval(id);
    }, passar);
    return () => clearInterval(id);
  }, [passar, total, parado]);

  if (total === 0) return null;
  const ir = (i: number) => setAtual((i + total) % total);

  return (
    <div
      className="b-heroi-midia b-slides"
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onPointerDown={(e) => { if (e.pointerType !== "mouse") toque.current = e.clientX; }}
      onPointerUp={(e) => {
        if (toque.current === null) return;
        const dx = e.clientX - toque.current;
        toque.current = null;
        if (Math.abs(dx) > 40) { setParado(true); ir(atual + (dx < 0 ? 1 : -1)); }
      }}
    >
      {slides.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- fotos já otimizadas no envio
        <img
          key={s.src}
          src={s.src}
          alt={i === atual ? s.alt : ""}
          aria-hidden={i !== atual}
          width={s.largura}
          height={s.altura}
          className={i === atual ? "ativa" : undefined}
          fetchPriority={i === 0 ? "high" : undefined}
          loading={i === 0 ? undefined : "lazy"}
        />
      ))}
      {total > 1 && (
        <div className="b-slides-pontos" role="group" aria-label="Fotos da barbearia">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Foto ${i + 1} de ${total}`}
              aria-current={i === atual ? "true" : undefined}
              onClick={() => { setParado(true); ir(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
