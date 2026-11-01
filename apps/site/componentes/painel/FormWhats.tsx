"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Formulário que anota o envio no servidor e abre o WhatsApp com a mensagem pronta.
 * O servidor devolve o link (em vez de redirecionar): assim o botão volta ao normal logo,
 * e dá pra mandar pro próximo sem atualizar a página. O WhatsApp abre numa aba nova (aberta já no
 * toque, pra o celular não bloquear), e a lista continua aqui; ao voltar, ela se atualiza.
 */
export function FormWhats({ acao, className, children }: { acao: (form: FormData) => Promise<string | undefined>; className?: string; children: ReactNode }) {
  const router = useRouter();
  const janela = useRef<Window | null>(null);
  useEffect(() => {
    const aoVoltar = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("pageshow", aoVoltar);
    return () => { document.removeEventListener("visibilitychange", aoVoltar); window.removeEventListener("pageshow", aoVoltar); };
  }, [router]);
  return (
    <form className={className}
      onSubmit={() => { janela.current = window.open("about:blank", "_blank"); }}
      action={async (form) => {
        const link = await acao(form);
        const aba = janela.current;
        janela.current = null;
        router.refresh();
        if (!link) { aba?.close(); return; }
        if (aba && !aba.closed) { aba.opener = null; aba.location.href = link; }
        else window.location.href = link;
      }}>
      {children}
    </form>
  );
}
