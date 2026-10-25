import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aprenda Livre", template: "%s · Aprenda Livre" },
  description: "Os melhores cursos gratuitos e abertos do mundo, traduzidos para o português.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="topo">
          <Link href="/" className="marca">📚 Aprenda Livre</Link>
          <nav>
            <Link href="/cursos">Cursos</Link>
            <Link href="/barbeiros">Barbeiros</Link>
            <Link href="/app">Minha agenda</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="rodape">
          Conteúdo traduzido de fontes abertas, sempre com crédito e licença originais.{" "}
          <Link href="/licencas">Saiba mais</Link>.
        </footer>
      </body>
    </html>
  );
}
