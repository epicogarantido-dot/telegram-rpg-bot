"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

/**
 * Botão "concluí esta lição". A página da lição é estática (rápida e boa
 * pro Google); o estado do aluno vem depois, por fetch.
 */
export function ProgressoLicao({ curso, licao }: { curso: string; licao: string }) {
  const [estado, setEstado] = useState<{ logado: boolean; feita: boolean } | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch(`/api/progresso?curso=${encodeURIComponent(curso)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { logado: boolean; concluidas: string[] }) => setEstado({ logado: d.logado, feita: d.concluidas.includes(licao) }))
      .catch(() => setEstado({ logado: false, feita: false }));
  }, [curso, licao]);

  if (!estado) return <div className="progresso-licao" aria-hidden />;
  if (!estado.logado) {
    return (
      <div className="progresso-licao cta">
        <Sparkles size={20} aria-hidden />
        <span><Link href="/cadastro">Crie sua conta grátis</Link> pra salvar seu progresso e continuar de onde parou.</span>
      </div>
    );
  }
  async function alternar() {
    setSalvando(true);
    const feita = !estado!.feita;
    const r = await fetch("/api/progresso", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ curso, licao, concluida: feita }),
    }).catch(() => null);
    if (r?.ok) setEstado({ logado: true, feita });
    setSalvando(false);
  }
  return (
    <button type="button" className={`progresso-licao botao-concluir ${estado.feita ? "feita" : ""}`} onClick={alternar} disabled={salvando} aria-pressed={estado.feita}>
      {estado.feita ? <CheckCircle2 size={22} aria-hidden /> : <Circle size={22} aria-hidden />}
      {estado.feita ? "Lição concluída!" : "Marcar lição como concluída"}
    </button>
  );
}
