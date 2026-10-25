"use client";

import { useEffect, useState } from "react";

/**
 * Fica perguntando ao servidor se a mensagem com o código já chegou no bot.
 * Quando chega, envia o formulário de conclusão sozinho: a pessoa manda a
 * mensagem no WhatsApp, volta pro site e já está dentro.
 */
export function AguardarConfirmacao({ formId }: { formId: string }) {
  const [estado, setEstado] = useState<"esperando" | "confirmado" | "expirado">("esperando");

  useEffect(() => {
    let parar = false;
    async function checar() {
      if (parar || document.hidden) return;
      try {
        const r = await fetch("/api/desafio", { cache: "no-store" });
        const d = (await r.json()) as { ativo: boolean; confirmado?: boolean };
        if (!d.ativo) setEstado("expirado");
        else if (d.confirmado) {
          setEstado("confirmado");
          parar = true;
          (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
        }
      } catch {
        /* rede oscilou: tenta de novo no próximo ciclo */
      }
    }
    const id = setInterval(checar, 2500);
    document.addEventListener("visibilitychange", checar);
    void checar();
    return () => {
      parar = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", checar);
    };
  }, [formId]);

  return (
    <p className="status-espera" role="status" aria-live="polite">
      {estado === "esperando" && <><span className="pulso" aria-hidden /> Esperando sua mensagem chegar…</>}
      {estado === "confirmado" && <>✅ Recebemos! Entrando…</>}
      {estado === "expirado" && <>⏱️ O código expirou. Gere outro abaixo.</>}
    </p>
  );
}
