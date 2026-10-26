"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const CHAVE = "convite-demo";

/**
 * "Quero este site" só aparece pra quem recebeu o link com o convite (o barbeiro do lead).
 * O convite fica guardado na aba enquanto ele navega pelas outras páginas da demonstração.
 * Quem confere se vale é o cadastro (`assumirDemonstracao`).
 */
export function QueroEsteSite() {
  const daUrl = useSearchParams().get("convite");
  const [convite, setConvite] = useState(daUrl);
  useEffect(() => {
    try {
      if (daUrl) sessionStorage.setItem(CHAVE, daUrl);
      else setConvite(sessionStorage.getItem(CHAVE));
    } catch {
      // Sem sessionStorage (aba anônima restrita): o botão só aparece com o convite na URL.
    }
  }, [daUrl]);
  if (!convite) return null;
  return <a className="b-demo-botao" href={`/app/cadastro?demo=${encodeURIComponent(convite)}`}>Quero este site</a>;
}
