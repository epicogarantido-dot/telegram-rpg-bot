"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copia um texto (ex.: link) e mostra "Copiado" por 2 segundos. */
export function BotaoCopiar({ texto, rotulo = "Copiar link", className = "botao-sec" }: { texto: string; rotulo?: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button type="button" className={className} aria-live="polite" onClick={async () => {
      try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { prompt("Copie:", texto); }
    }}>
      {copiado ? <><Check size={16} aria-hidden /> Copiado</> : <><Copy size={16} aria-hidden /> {rotulo}</>}
    </button>
  );
}
