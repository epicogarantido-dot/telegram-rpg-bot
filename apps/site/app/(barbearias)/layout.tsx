import type { Metadata, Viewport } from "next";
import "../globals.css";
import "./temas.css";
import { Medir } from "@/componentes/ContarOrigem";
import { soEntrega } from "@/lib/modo";

/**
 * Segundo site: os sites das barbearias (/b/<nome>) e o painel delas (/app).
 * Layout raiz próprio, sem nada do site de cursos. Pode rodar junto com o site de
 * cursos ou num app separado (MODO_SITE=saas, ver lib/modo.ts).
 */
export const metadata: Metadata = {
  title: { default: "Agenda online da barbearia", template: "%s" },
};

export const viewport: Viewport = { themeColor: "#111111" };

export default function LayoutBarbearias({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="corpo-barbearias">
        {children}
        {/* Funil de venda (exemplos, cadastro). No app do barbeiro (SaaS) não se mede nada do cliente dele. */}
        {!soEntrega() && <Medir />}
      </body>
    </html>
  );
}
