"use client";

import { useRef, type ReactNode } from "react";

/**
 * Inclina o conteúdo em 3D seguindo o dedo/mouse, com um brilho que acompanha.
 * Só CSS transform: leve, e desliga sozinho com "reduzir movimento".
 */
export function Inclinavel({ children, intensidade = 10, className = "" }: { children: ReactNode; intensidade?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function mover(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * intensidade).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * intensidade).toFixed(2)}deg`);
    el.style.setProperty("--brilho-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--brilho-y", `${((y + 0.5) * 100).toFixed(1)}%`);
  }
  function soltar() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={ref} className={`inclinavel ${className}`} onPointerMove={mover} onPointerLeave={soltar}>
      {children}
    </div>
  );
}
