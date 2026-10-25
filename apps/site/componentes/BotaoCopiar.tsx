"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copia um texto (ex.: link) e mostra "Copiado" por 2 segundos. */
export function BotaoCopiar({ texto, rotulo = "Copiar link" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button type="button" className="botao-sec" aria-live="polite" onClick={async () => {
      try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { prompt("Copie o link:", texto); }
    }}>
      {copiado ? <><Check size={16} aria-hidden /> Copiado</> : <><Copy size={16} aria-hidden /> {rotulo}</>}
    </button>
  );
}
