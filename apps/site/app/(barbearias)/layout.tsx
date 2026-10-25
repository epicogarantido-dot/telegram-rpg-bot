import type { Metadata, Viewport } from "next";
import "../globals.css";
import "./temas.css";

/**
 * Segundo site: os sites das barbearias (/b/<nome>) e o painel delas (/app).
 * Layout raiz próprio, sem nada do site de cursos. Roda no mesmo servidor só
 * pra caber no plano da Square Cloud; dá pra separar quando o plano crescer.
 */
export const metadata: Metadata = {
  title: { default: "Agenda online da barbearia", template: "%s" },
};

export const viewport: Viewport = { themeColor: "#111111" };

export default function LayoutBarbearias({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="corpo-barbearias">{children}</body>
    </html>
  );
}
