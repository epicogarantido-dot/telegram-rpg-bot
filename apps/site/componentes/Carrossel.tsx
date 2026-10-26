"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MAX_ITENS_CARROSSEL } from "@/lib/carrossel";

/**
 * Faixa que rola de lado (dedo, trackpad ou setas). Sem movimento sozinho: só anda quando a
 * pessoa toca numa seta, e com "reduzir movimento" o salto é instantâneo. Cada item é um link
 * normal, então Tab percorre os itens e o navegador traz o item focado pra tela.
 */
export function Carrossel({ titulo, verTodos, children }: { titulo: string; verTodos?: { href: string; texto: string }; children: React.ReactNode }) {
  const trilho = useRef<HTMLUListElement>(null);
  const [inicio, setInicio] = useState(true);
  const [fim, setFim] = useState(false);
  const itens = Children.toArray(children).slice(0, MAX_ITENS_CARROSSEL);
  const id = `carrossel-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

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
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: direcao * t.clientWidth * 0.85, behavior: parado ? "auto" : "smooth" });
  }

  return (
    <section className="carrossel" aria-labelledby={id} aria-roledescription="carrossel">
      <div className="carrossel-topo">
        <h2 id={id}>{titulo}</h2>
        {verTodos && <Link href={verTodos.href} className="carrossel-todos">{verTodos.texto}</Link>}
        <div className="carrossel-setas">
          <button type="button" onClick={() => andar(-1)} disabled={inicio} aria-controls={`${id}-trilho`} aria-label="Anteriores">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button type="button" onClick={() => andar(1)} disabled={fim} aria-controls={`${id}-trilho`} aria-label="Próximos">
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>
      <ul className="carrossel-trilho" id={`${id}-trilho`} ref={trilho}>
        {itens.map((item, i) => <li key={i} aria-label={`${i + 1} de ${itens.length}`}>{item}</li>)}
      </ul>
    </section>
  );
}
