"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export type Slide = { src: string; alt: string; largura?: number; altura?: number };

/**
 * Fotos da abertura passando como num vídeo: uma esmaece na outra enquanto a foto da vez se
 * aproxima devagar (efeito Ken Burns, no CSS). Passa sozinha a cada `passar` ms, com botão de
 * pausar; para com o mouse em cima, com a aba escondida e com "reduzir movimento" (aí fica a
 * primeira foto, parada). Bolinhas e deslizar o dedo trocam na hora.
 */
export function CapaSlides({ slides, passar = 6500 }: { slides: Slide[]; passar?: number }) {
  const [atual, setAtual] = useState(0);
  // A que está saindo continua no mesmo zoom enquanto esmaece (não dá pulo).
  const [anterior, setAnterior] = useState<number | null>(null);
  const atualRef = useRef(0);
  const [pausado, setPausado] = useState(false);
  const [mouse, setMouse] = useState(false);
  const [semMovimento, setSemMovimento] = useState(true);
  const toque = useRef<number | null>(null);
  const total = slides.length;

  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    setSemMovimento(m.matches);
    const mudou = () => setSemMovimento(m.matches);
    m.addEventListener("change", mudou);
    return () => m.removeEventListener("change", mudou);
  }, []);

  function trocar(i: number) {
    const novo = (i + total) % total;
    if (novo === atualRef.current) return;
    setAnterior(atualRef.current);
    atualRef.current = novo;
    setAtual(novo);
  }
  const ir = trocar;

  useEffect(() => {
    if (total < 2 || pausado || mouse || semMovimento) return;
    const id = setInterval(() => { if (!document.hidden) trocar(atualRef.current + 1); }, passar);
    return () => clearInterval(id);
  }, [passar, total, pausado, mouse, semMovimento]);

  if (total === 0) return null;

  return (
    <div
      className="b-heroi-midia b-slides"
      onMouseEnter={() => setMouse(true)}
      onMouseLeave={() => setMouse(false)}
      onPointerDown={(e) => { if (e.pointerType !== "mouse") toque.current = e.clientX; }}
      onPointerUp={(e) => {
        if (toque.current === null) return;
        const dx = e.clientX - toque.current;
        toque.current = null;
        if (Math.abs(dx) > 40) ir(atual + (dx < 0 ? 1 : -1));
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
          className={i === atual ? "ativa" : i === anterior ? "saindo" : undefined}
          style={{ "--dir": i % 2 ? -1 : 1, "--tempo": `${passar + 1500}ms` } as React.CSSProperties}
          fetchPriority={i === 0 ? "high" : undefined}
          loading={i === 0 ? undefined : "lazy"}
        />
      ))}
      {total > 1 && (
        <div className="b-slides-controles">
          {!semMovimento && (
            <button type="button" className="b-slides-pausa" onClick={() => setPausado((p) => !p)} aria-label={pausado ? "Continuar as fotos" : "Pausar as fotos"}>
              {pausado ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            </button>
          )}
          <div className="b-slides-pontos" role="group" aria-label="Fotos da barbearia">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Foto ${i + 1} de ${total}`}
                aria-current={i === atual ? "true" : undefined}
                onClick={() => ir(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
