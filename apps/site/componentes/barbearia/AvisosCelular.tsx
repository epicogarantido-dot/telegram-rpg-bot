"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

type Estado = "carregando" | "sem-suporte" | "instalar-iphone" | "negado" | "desligado" | "ligado";
type Inscricao = { endpoint: string; p256dh: string; auth: string };

/**
 * Liga os avisos de horário novo neste aparelho. No iPhone, o navegador só
 * permite depois de pôr o painel na tela de início (iOS 16.4+).
 */
export function AvisosCelular({ chavePublica, salvar, remover, testar }: {
  chavePublica: string;
  salvar: (i: Inscricao) => Promise<string | null>;
  remover: (endpoint: string) => Promise<void>;
  testar: () => Promise<number>;
}) {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const instalado = matchMedia("(display-mode: standalone)").matches;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setEstado(iphone && !instalado ? "instalar-iphone" : "sem-suporte");
      return;
    }
    navigator.serviceWorker.register("/painel-sw.js", { scope: "/app" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub ? "ligado" : Notification.permission === "denied" ? "negado" : "desligado"))
      .catch(() => setEstado("sem-suporte"));
  }, []);

  async function ligar() {
    setOcupado(true);
    setMensagem(null);
    try {
      if ((await Notification.requestPermission()) !== "granted") { setEstado("negado"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64url(chavePublica) });
      const json = sub.toJSON();
      const erro = await salvar({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" });
      if (erro) { await sub.unsubscribe(); setMensagem(erro); return; }
      setEstado("ligado");
      await testar();
    } catch {
      setMensagem("Não deu pra ligar os avisos neste aparelho. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) { await remover(sub.endpoint); await sub.unsubscribe(); }
      setEstado("desligado");
    } finally {
      setOcupado(false);
    }
  }

  async function mandarTeste() {
    setOcupado(true);
    setMensagem((await testar()) > 0 ? "Aviso de teste enviado." : "Não chegou em nenhum aparelho. Desligue e ligue de novo.");
    setOcupado(false);
  }

  if (estado === "carregando") return null;
  return (
    <section className="avisos-celular" aria-live="polite">
      {estado === "ligado" && (
        <>
          <p><Bell size={18} aria-hidden /> <strong>Avisos ligados neste aparelho.</strong> Cada horário novo chega aqui, com um botão pra confirmar com o cliente no WhatsApp.</p>
          <div className="acoes">
            <button type="button" className="botao-sec" onClick={mandarTeste} disabled={ocupado}>Mandar aviso de teste</button>
            <button type="button" className="botao-sec" onClick={desligar} disabled={ocupado}><BellOff size={16} aria-hidden /> Desligar</button>
          </div>
        </>
      )}
      {estado === "desligado" && (
        <>
          <p><strong>Saiba na hora quando alguém marcar.</strong> Ligue os avisos e cada horário novo aparece no seu celular, com um botão pra confirmar com o cliente no WhatsApp.</p>
          <button type="button" className="botao" onClick={ligar} disabled={ocupado}><Bell size={18} aria-hidden /> Ligar avisos neste aparelho</button>
        </>
      )}
      {estado === "instalar-iphone" && (
        <p><strong>Avisos no iPhone:</strong> toque em Compartilhar e depois em &quot;Adicionar à Tela de Início&quot;. Abra a Agenda pelo ícone novo e ligue os avisos por lá.</p>
      )}
      {estado === "negado" && (
        <p><strong>Os avisos estão bloqueados neste navegador.</strong> Libere as notificações deste site nas configurações do navegador e recarregue a página.</p>
      )}
      {estado === "sem-suporte" && (
        <p>Este navegador não recebe avisos. No celular, use o Chrome (Android) ou adicione a Agenda à tela de início (iPhone).</p>
      )}
      {mensagem && <p className="avisos-mensagem">{mensagem}</p>}
    </section>
  );
}

function base64url(texto: string): Uint8Array<ArrayBuffer> {
  const base = (texto + "=".repeat((4 - (texto.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
