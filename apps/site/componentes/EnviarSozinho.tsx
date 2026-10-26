"use client";

import { useEffect } from "react";

/**
 * Envia o formulário assim que a página abre no navegador. Quem só busca a página
 * sem rodar JavaScript (a prévia de link do WhatsApp, robôs) não envia nada, então
 * o link de entrada não é gasto por eles.
 */
export function EnviarSozinho({ formId }: { formId: string }) {
  useEffect(() => {
    (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
  }, [formId]);
  return null;
}
