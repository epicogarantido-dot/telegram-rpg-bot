"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

/** O que a mensagem pronta diz, pela página onde a pessoa estava (você já sabe do que ela fala). */
function contexto(caminho: string): { pagina: string; texto: string } {
  if (caminho.startsWith("/revista/")) return { pagina: "materia", texto: "Oi! Li uma matéria no site de vocês e quero saber do site com agenda pra minha barbearia." };
  if (caminho.startsWith("/app/cadastro")) return { pagina: "pedido", texto: "Oi! Estou fazendo o pedido do site da minha barbearia e fiquei com uma dúvida." };
  if (caminho.startsWith("/app/assinatura")) return { pagina: "pix", texto: "Oi! Estou no pagamento do site da minha barbearia e fiquei com uma dúvida." };
  if (caminho.startsWith("/cursos")) return { pagina: "cursos", texto: "Oi! Vim pelos cursos e quero saber do site com agenda pra minha barbearia." };
  return { pagina: "inicio", texto: "Oi! Vi os estilos de site de vocês e quero saber mais pra minha barbearia." };
}

/** WhatsApp do responsável, pedido na hora (página gerada no build não tem o .env). */
function useContato() {
  const [contato, setContato] = useState<{ numero: string; texto: string; nome?: string }>();
  useEffect(() => {
    fetch("/api/contato").then((r) => r.json()).then((c) => c?.numero && setContato(c)).catch(() => {});
  }, []);
  return contato;
}

/**
 * Botão de WhatsApp fixo no canto, em todas as páginas do site de vendas (menos o painel do admin).
 * A mensagem já sai dizendo de onde a pessoa veio. Conta no funil como "whatsapp".
 */
export function WhatsFixo() {
  const caminho = usePathname();
  const contato = useContato();
  if (!contato || caminho.startsWith("/painel")) return null;
  const { pagina, texto } = contexto(caminho);
  return (
    <a className="whats-fixo" href={`https://wa.me/${contato.numero}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer"
      data-evento="whatsapp" data-detalhe={pagina} aria-label="Falar no WhatsApp">
      <MessageCircle size={22} aria-hidden /><span>WhatsApp</span>
    </a>
  );
}

/** Linha do rodapé com o WhatsApp do responsável. */
export function WhatsRodape() {
  const contato = useContato();
  if (!contato) return null;
  return (
    <p className="rodape-whats">
      Dúvida sobre o site da sua barbearia?{" "}
      <a href={`https://wa.me/${contato.numero}?text=${encodeURIComponent("Oi! Quero saber do site com agenda pra minha barbearia.")}`} target="_blank" rel="noopener noreferrer" data-evento="whatsapp" data-detalhe="rodape">
        Fale {contato.nome ? `com ${contato.nome} ` : ""}no WhatsApp: {contato.texto}
      </a>
    </p>
  );
}
