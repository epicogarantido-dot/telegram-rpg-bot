"use client";
import { useEffect } from "react";

/** Toque na grade leva a um cartão (#ag-<id>): se ele está num <details> recolhido, abre e rola até ele. */
export function AbrirAncora() {
  useEffect(() => {
    const abrir = () => {
      const alvo = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      const caixa = alvo?.closest("details");
      if (alvo && caixa && !caixa.open) { caixa.open = true; alvo.scrollIntoView(); }
    };
    abrir();
    window.addEventListener("hashchange", abrir);
    return () => window.removeEventListener("hashchange", abrir);
  }, []);
  return null;
}
