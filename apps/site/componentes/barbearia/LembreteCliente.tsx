"use client";

import { useEffect, useState } from "react";
import { Bell, Share, SquarePlus } from "lucide-react";

type Estado = "carregando" | "sem-suporte" | "instalar-iphone" | "negado" | "desligado" | "ligado";
type Aparelho = { endpoint: string; p256dh: string; auth: string };

/**
 * "Me avise 1 hora antes": o site da barbearia é um app, e o lembrete chega como aviso no celular
 * (no lugar de pôr na agenda do Google). No iPhone o aviso só funciona com o site salvo na tela de
 * início; aí ele abre direto nesta página do horário (o manifesto leva o `inicio`).
 */
export function LembreteCliente({ chavePublica, ligar, barbearia }: {
  chavePublica: string; barbearia: string; ligar: (a: Aparelho) => Promise<string | null>;
}) {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  // Lembra só neste aparelho que o aviso deste horário já foi ligado (o link é do horário).
  const chave = () => `lembrete:${location.pathname}`;

  useEffect(() => {
    const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const instalado = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setEstado(iphone && !instalado ? "instalar-iphone" : "sem-suporte");
      return;
    }
    let ligadoAqui = false;
    try { ligadoAqui = localStorage.getItem(chave()) === "1"; } catch {}
    navigator.serviceWorker.register("/cliente-sw.js", { scope: "/" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub && ligadoAqui ? "ligado" : Notification.permission === "denied" ? "negado" : "desligado"))
      .catch(() => setEstado("sem-suporte"));
  }, []);

  async function pedir() {
    setOcupado(true);
    setMensagem(null);
    try {
      if ((await Notification.requestPermission()) !== "granted") { setEstado("negado"); return; }
      const reg = await navigator.serviceWorker.register("/cliente-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64url(chavePublica) });
      const json = sub.toJSON();
      const erro = await ligar({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" });
      if (erro) { setMensagem(erro); return; }
      try { localStorage.setItem(chave(), "1"); } catch {}
      setEstado("ligado");
    } catch {
      setMensagem("Não deu pra ligar o aviso neste celular. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  if (estado === "carregando") return null;
  return (
    <div className="b-lembrete" aria-live="polite">
      {estado === "ligado" && <p><Bell size={18} aria-hidden /> <strong>Aviso ligado.</strong> A {barbearia} te avisa neste celular 1 hora antes.</p>}
      {estado === "desligado" && (
        <>
          <button type="button" className="b-botao" onClick={pedir} disabled={ocupado}>
            <Bell size={18} aria-hidden /> {ocupado ? "Ligando…" : "Me avise 1 hora antes"}
          </button>
          <p>O aviso chega no seu celular, como mensagem de app.</p>
        </>
      )}
      {estado === "negado" && <p>Os avisos estão bloqueados neste navegador. Libere as notificações deste site nas configurações do celular pra receber o lembrete.</p>}
      {estado === "instalar-iphone" && (
        <>
          <p><strong>Quer o aviso 1 hora antes?</strong> No iPhone, salve este horário na tela de início e abra por lá:</p>
          <ol className="b-instalar-passos">
            <li>Toque em <Share size={15} aria-label="Compartilhar" /> <strong>Compartilhar</strong> (embaixo da tela, no Safari).</li>
            <li>Escolha <SquarePlus size={15} aria-hidden /> <strong>Adicionar à Tela de Início</strong>.</li>
            <li>Abra o ícone da {barbearia} e toque em <strong>Me avise 1 hora antes</strong>.</li>
          </ol>
        </>
      )}
      {estado === "sem-suporte" && <p>Guarde o link abaixo: é por ele que você vê, troca ou cancela o horário.</p>}
      {mensagem && <p className="erro" role="alert">{mensagem}</p>}
    </div>
  );
}

function base64url(texto: string): Uint8Array<ArrayBuffer> {
  const base = (texto + "=".repeat((4 - (texto.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
