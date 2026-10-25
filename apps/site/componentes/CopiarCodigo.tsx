"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button type="button" className="codigo" aria-label={`Copiar código ${codigo}`}
      onClick={async () => {
        await navigator.clipboard?.writeText(codigo).catch(() => {});
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1800);
      }}>
      <span>{codigo}</span>
      {copiado ? <Check size={20} aria-hidden /> : <Copy size={20} aria-hidden />}
    </button>
  );
}
