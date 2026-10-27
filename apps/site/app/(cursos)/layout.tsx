import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import "../globals.css";
import "./imperial.css";

export const metadata: Metadata = {
  // Endereço público, pra prévia do WhatsApp achar as fotos (og:image precisa de URL completa).
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "Aprenda Livre", template: "%s · Aprenda Livre" },
  description: "Os melhores cursos gratuitos e abertos do mundo, traduzidos para o português.",
};

export const viewport: Viewport = {
  // Tema escuro do Salão Imperial (Cerimônia): a barra do celular acompanha o fundo.
  themeColor: "#120b14",
  colorScheme: "dark",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="site-cursos">
        <div className="barra-topo">
          <header className="topo">
            <Link href="/" className="marca">
              <span className="marca-icone"><BookOpen size={18} aria-hidden /></span>
              Aprenda Livre
            </Link>
            <nav aria-label="Principal">
              <Link href="/cursos">Cursos</Link>
              <Link href="/revista">Revista</Link>
              <Link href="/barbeiros">Barbeiros</Link>
              <Link href="/minha-area" className="nav-destaque">Entrar</Link>
            </nav>
          </header>
        </div>
        <main>{children}</main>
        <footer className="rodape">
          Cursos traduzidos de fontes abertas, com crédito e licença originais, e cursos escritos aqui.{" "}
          <Link href="/licencas">Licenças e créditos</Link>.
        </footer>
      </body>
    </html>
  );
}
