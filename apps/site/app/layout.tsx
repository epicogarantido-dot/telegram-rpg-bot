import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aprenda Livre", template: "%s · Aprenda Livre" },
  description: "Os melhores cursos gratuitos e abertos do mundo, traduzidos para o português.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#121412" },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="barra-topo">
          <header className="topo">
            <Link href="/" className="marca">
              <span className="marca-icone"><BookOpen size={18} aria-hidden /></span>
              Aprenda Livre
            </Link>
            <nav aria-label="Principal">
              <Link href="/cursos">Cursos</Link>
              <Link href="/barbeiros">Barbeiros</Link>
              <Link href="/app">Minha agenda</Link>
            </nav>
          </header>
        </div>
        <main>{children}</main>
        <footer className="rodape">
          Conteúdo traduzido de fontes abertas, sempre com crédito e licença originais.{" "}
          <Link href="/licencas">Licenças e créditos</Link>.
        </footer>
      </body>
    </html>
  );
}
