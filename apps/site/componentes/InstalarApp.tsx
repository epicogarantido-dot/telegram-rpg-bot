"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Estado = "esconder" | "android" | "iphone" | "outro";

/**
 * Botão "Instalar o app" (SaaS): no Android/Chrome abre o pedido de instalação do próprio celular;
 * no iPhone mostra o passo a passo (lá não existe botão de instalar). Some quando já está instalado
 * ou quando a pessoa toca em "Agora não" (lembrado só neste aparelho).
 */
export function InstalarApp({ tipo, nome }: { tipo: "painel" | "site"; nome: string }) {
  const [estado, setEstado] = useState<Estado>("esconder");
  const [pedido, setPedido] = useState<Prompt>();
  const [passos, setPassos] = useState(false);
  const chave = `instalar-app-${tipo}`;

  useEffect(() => {
    const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    let dispensado = false;
    try { dispensado = localStorage.getItem(chave) === "nao"; } catch {}
    if (instalado || dispensado) return;
    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (iphone) { setEstado("iphone"); return; }
    const aoPedir = (e: Event) => { e.preventDefault(); setPedido(e as Prompt); setEstado("android"); };
    const aoInstalar = () => setEstado("esconder");
    window.addEventListener("beforeinstallprompt", aoPedir);
    window.addEventListener("appinstalled", aoInstalar);
    // Celular sem o pedido automático (outro navegador): no painel, mostra o caminho pelo menu.
    const t = tipo === "painel" && /android/i.test(navigator.userAgent) ? setTimeout(() => setEstado((s) => (s === "esconder" ? "outro" : s)), 2500) : undefined;
    return () => { window.removeEventListener("beforeinstallprompt", aoPedir); window.removeEventListener("appinstalled", aoInstalar); if (t) clearTimeout(t); };
  }, [chave, tipo]);

  if (estado === "esconder") return null;
  const dispensar = () => { try { localStorage.setItem(chave, "nao"); } catch {} setEstado("esconder"); };
  const instalar = async () => {
    if (estado === "android" && pedido) {
      await pedido.prompt();
      const { outcome } = await pedido.userChoice;
      if (outcome === "accepted") setEstado("esconder");
      setPedido(undefined);
    } else setPassos((p) => !p);
  };
  const painel = tipo === "painel";

  return (
    <aside className={painel ? "cartao instalar-app" : "b-instalar"} aria-label="Instalar o app">
      {painel
        ? <p><strong>Instale o app da agenda.</strong> Abre com um toque, em tela cheia, e recebe os avisos de horário novo.</p>
        : <p>Marque da próxima vez com um toque: ponha a {nome} na tela do celular.</p>}
      <div className={painel ? "instalar-acoes" : "b-instalar-acoes"}>
        <button type="button" className={painel ? "botao" : "b-botao b-botao-pequeno"} onClick={instalar} aria-expanded={estado === "android" ? undefined : passos}>
          <Download size={16} aria-hidden /> {painel ? "Instalar o app" : "Salvar na tela inicial"}
        </button>
        <button type="button" className={painel ? "botao-sec" : "b-instalar-fechar"} onClick={dispensar}>Agora não</button>
      </div>
      {passos && estado === "iphone" && (
        <ol className={painel ? "instalar-passos" : "b-instalar-passos"}>
          <li>Abra esta página no <strong>Safari</strong>.</li>
          <li>Toque em <Share size={15} aria-label="Compartilhar" /> <strong>Compartilhar</strong> (embaixo da tela).</li>
          <li>Escolha <SquarePlus size={15} aria-hidden /> <strong>Adicionar à Tela de Início</strong> e toque em Adicionar.</li>
        </ol>
      )}
      {passos && estado === "outro" && (
        <ol className={painel ? "instalar-passos" : "b-instalar-passos"}>
          <li>Abra esta página no <strong>Chrome</strong>.</li>
          <li>Toque nos <strong>3 pontinhos</strong> no alto da tela.</li>
          <li>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
        </ol>
      )}
    </aside>
  );
}
