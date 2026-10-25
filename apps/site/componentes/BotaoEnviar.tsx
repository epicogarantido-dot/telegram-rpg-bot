"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Botão de formulário que mostra "carregando" enquanto o servidor responde
 * e não deixa enviar duas vezes. Mantém o texto original visível.
 */
export function BotaoEnviar({ children, carregando, className }: { children: ReactNode; carregando: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? <><span className="girando" aria-hidden /> {carregando}</> : children}
    </button>
  );
}
