import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Medir } from "@/componentes/ContarOrigem";
import { WhatsFixo, WhatsRodape } from "@/componentes/WhatsFixo";
import { BookOpen, CalendarDays } from "lucide-react";
import { soEntrega } from "@/lib/modo";
import "../globals.css";
import "./imperial.css";

export function generateMetadata(): Metadata {
  // No SaaS (só entrega) estas páginas são as do admin, privacidade e termos: sem a marca da venda.
  const marca = soEntrega() ? "Site da Barbearia" : "Aprenda Livre";
  return {
    // Endereço público, pra prévia do WhatsApp achar as fotos (og:image precisa de URL completa).
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: soEntrega() ? { default: marca, template: `%s · ${marca}` } : { default: "Site de barbearia pronto, com agenda online", template: `%s · ${marca}` },
    description: soEntrega() ? "Site e agenda da barbearia." : "Seu site de barbearia pronto, com agenda online: o cliente vê seus cortes, escolhe o horário e marca sozinho. Seis estilos, pagamento por Pix, sem fidelidade.",
  };
}

export const viewport: Viewport = {
  // Tema escuro do Salão Imperial (Cerimônia): a barra do celular acompanha o fundo.
  themeColor: "#120b14",
  colorScheme: "dark",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  // O SaaS usa este layout só no admin, na privacidade e nos termos: nada de link pra venda.
  if (soEntrega()) {
    return (
      <html lang="pt-BR">
        <body className="site-cursos">
          <div className="barra-topo">
            <header className="topo">
              <Link href="/app/entrar" className="marca">
                <span className="marca-icone"><CalendarDays size={18} aria-hidden /></span>
                Site da Barbearia
              </Link>
            </header>
          </div>
          <main>{children}</main>
          <footer className="rodape">
            <Link href="/privacidade">Privacidade</Link> · <Link href="/termos">Termos de uso</Link>
          </footer>
        </body>
      </html>
    );
  }
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
              <a href="/#estilos" data-evento="estilos">Estilos</a>
              <a href="/#preco">Preço</a>
              <a href="/cursos" className="nav-pequeno">Cursos</a>
            </nav>
          </header>
        </div>
        <Medir />
        <main>{children}</main>
        <WhatsFixo />
        <footer className="rodape">
          <WhatsRodape />
          Cursos traduzidos de fontes abertas, com crédito e licença originais, e cursos escritos aqui.{" "}
          <a href="/licencas">Licenças e créditos</a> · <Link href="/privacidade">Privacidade</Link> · <Link href="/termos">Termos de uso</Link>.
        </footer>
      </body>
    </html>
  );
}
