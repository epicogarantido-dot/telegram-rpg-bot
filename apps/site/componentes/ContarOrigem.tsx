"use client";

import { useEffect } from "react";

/** Origem do link pelo qual a pessoa chegou (guardada na aba pro cadastro contar também). */
export const CHAVE_ORIGEM = "aprenda-origem";
const VALIDA = /^[a-z0-9-]{2,60}$/;

/**
 * Chegou por um link com ?origem= (post do grupo, cartão, convite)? Conta uma visita, uma vez
 * por aba. Fica só no sessionStorage do navegador: some ao fechar a aba, não é cookie.
 */
export function ContarOrigem() {
  useEffect(() => {
    const origem = new URLSearchParams(window.location.search).get("origem")?.toLowerCase();
    if (!origem || !VALIDA.test(origem)) return;
    try {
      if (sessionStorage.getItem(CHAVE_ORIGEM) === origem) return;
      sessionStorage.setItem(CHAVE_ORIGEM, origem);
    } catch {
      // Navegador sem sessionStorage (aba anônima restrita): conta mesmo assim.
    }
    fetch("/api/origem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ origem }), keepalive: true }).catch(() => {});
  }, []);
  return null;
}

/** Campo escondido no cadastro da barbearia: leva a origem da aba, se houver. */
export function CampoOrigem() {
  useEffect(() => {
    const campo = document.querySelector<HTMLInputElement>('input[name="origem"]');
    try {
      // Veio de um link antigo (/montar?origem=...) direto pro cadastro, ou guardada na aba.
      const origem = new URLSearchParams(window.location.search).get("origem")?.toLowerCase() || sessionStorage.getItem(CHAVE_ORIGEM);
      if (campo && origem && VALIDA.test(origem)) campo.value = origem;
    } catch {
      // sem sessionStorage: cadastro conta sem origem
    }
  }, []);
  return <input type="hidden" name="origem" defaultValue="" />;
}
