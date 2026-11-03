"use client";

import { useRef, type ReactNode } from "react";

/**
 * Formulário que anota o envio no servidor e abre o WhatsApp com a mensagem pronta.
 * O servidor devolve o link (em vez de redirecionar): assim o botão volta ao normal logo,
 * e dá pra mandar pro próximo sem atualizar a página. O WhatsApp abre numa aba nova (aberta já no
 * toque, pra o celular não bloquear). A lista se atualiza sozinha com a resposta da ação
 * (revalidatePath no servidor): nada de router.refresh aqui. Antes, cada botão da lista ouvia a volta
 * pra página e pedia uma atualização; com 100 barbearias eram ~200 de uma vez e o painel travava.
 */
export function FormWhats({ acao, className, children }: { acao: (form: FormData) => Promise<string | undefined>; className?: string; children: ReactNode }) {
  const janela = useRef<Window | null>(null);
  return (
    <form className={className}
      onSubmit={() => { janela.current = window.open("about:blank", "_blank"); }}
      action={async (form) => {
        const aba = janela.current;
        janela.current = null;
        let link: string | undefined;
        try { link = await acao(form); } catch { aba?.close(); return; }
        if (!link) { aba?.close(); return; }
        if (aba && !aba.closed) { aba.opener = null; aba.location.href = link; }
        else window.location.href = link;
      }}>
      {children}
    </form>
  );
}
