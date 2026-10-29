"use client";

import { useEffect } from "react";

/** Origem do link (?origem=) e código do lead (?l=), guardados na aba pro cadastro contar também. */
export const CHAVE_ORIGEM = "aprenda-origem";
const CHAVE_LEAD = "aprenda-lead";
const VALIDA = /^[a-z0-9-]{2,60}$/;
const CODIGO = /^[a-z0-9]{7}$/;

function ler(chave: string): string | undefined {
  try {
    return sessionStorage.getItem(chave) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Cada passo conta uma vez por aba (recarregar ou voltar não infla o funil). Sem sessionStorage, conta sempre. */
function primeiraVez(chave: string): boolean {
  try {
    if (sessionStorage.getItem(chave)) return false;
    sessionStorage.setItem(chave, "1");
  } catch {
    // aba anônima restrita: segue contando
  }
  return true;
}

function enviar(dados: { evento: string; origem?: string; detalhe?: string; lead?: string }) {
  fetch("/api/origem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(dados), keepalive: true }).catch(() => {});
}

/**
 * Funil de venda, só contagem (nada de IP, cookie ou aparelho): a chegada ("abriu", com a origem
 * do link), o passo da página (`evento`, ex.: "exemplo" no site de exemplo) e os toques em
 * qualquer elemento com `data-evento` (e `data-detalhe`). Com ?l=<código> no link, o painel de
 * leads mostra o que aquele lead fez.
 */
export function Medir({ evento, detalhe }: { evento?: string; detalhe?: string }) {
  useEffect(() => {
    // Painel de leads é do admin: visita dele não entra no funil.
    if (/^\/painel(\/|$)/.test(window.location.pathname)) return;
    const url = new URLSearchParams(window.location.search);
    const origem = url.get("origem")?.toLowerCase();
    const codigo = url.get("l")?.toLowerCase();
    try {
      if (origem && VALIDA.test(origem)) sessionStorage.setItem(CHAVE_ORIGEM, origem);
      if (codigo && CODIGO.test(codigo)) sessionStorage.setItem(CHAVE_LEAD, codigo);
    } catch {
      // sem sessionStorage: vale só pra esta página
    }
    const lead = ler(CHAVE_LEAD) ?? (codigo && CODIGO.test(codigo) ? codigo : undefined);
    if (primeiraVez("medir:abriu")) enviar({ evento: "abriu", origem: origem && VALIDA.test(origem) ? origem : undefined, lead });
    if (evento && primeiraVez(`medir:${evento}:${detalhe ?? ""}`)) enviar({ evento, detalhe, lead });
    const aoClicar = (e: MouseEvent) => {
      const alvo = (e.target as Element | null)?.closest?.("[data-evento]");
      const ev = alvo?.getAttribute("data-evento");
      if (!alvo || !ev) return;
      const det = alvo.getAttribute("data-detalhe") ?? undefined;
      if (primeiraVez(`medir:${ev}:${det ?? ""}`)) enviar({ evento: ev, detalhe: det, lead: ler(CHAVE_LEAD) ?? lead });
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [evento, detalhe]);
  return null;
}

/** Campos escondidos no cadastro: levam a origem e o código do lead da aba, se houver. */
export function CampoOrigem() {
  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    try {
      // Veio de um link antigo (/montar?origem=...) direto pro cadastro, ou guardada na aba.
      const origem = url.get("origem")?.toLowerCase() || sessionStorage.getItem(CHAVE_ORIGEM);
      const campo = document.querySelector<HTMLInputElement>('input[name="origem"]');
      if (campo && origem && VALIDA.test(origem)) campo.value = origem;
      const lead = url.get("l")?.toLowerCase() || sessionStorage.getItem(CHAVE_LEAD);
      const campoLead = document.querySelector<HTMLInputElement>('input[name="lead"]');
      if (campoLead && lead && CODIGO.test(lead)) campoLead.value = lead;
    } catch {
      // sem sessionStorage: cadastro conta sem origem
    }
  }, []);
  return (
    <>
      <input type="hidden" name="origem" defaultValue="" />
      <input type="hidden" name="lead" defaultValue="" />
    </>
  );
}
