"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Images, LayoutTemplate, ListChecks, MessageCircle, Settings, UserRound, Users } from "lucide-react";

const ITENS = [
  { href: "/app", rotulo: "Agenda", Icone: CalendarDays, aba: true },
  // Agendados nas abas do celular: confirmar com o cliente é coisa de todo dia; Números fica no menu e na conta.
  { href: "/app/agendados", rotulo: "Agendados", Icone: ListChecks, aba: true },
  { href: "/app/site", rotulo: "Meu site", Icone: LayoutTemplate, aba: true },
  { href: "/app/fotos", rotulo: "Fotos", Icone: Images, aba: true },
  { href: "/app/numeros", rotulo: "Números", Icone: BarChart3, aba: false },
  { href: "/app/clientes", rotulo: "Clientes", Icone: Users, aba: false },
  { href: "/app/whatsapp", rotulo: "WhatsApp", Icone: MessageCircle, aba: false },
  { href: "/app/config", rotulo: "Configurações", Icone: Settings, aba: false },
  { href: "/app/conta", rotulo: "Minha conta", Icone: UserRound, aba: true },
] as const;

/** Item ativo: /app só na própria página; os outros também nas subpáginas. */
function ativo(caminho: string, href: string) {
  return href === "/app" ? caminho === "/app" : caminho === href || caminho.startsWith(`${href}/`);
}

/** Menu lateral (computador) ou abas embaixo da tela (celular), com o item da página marcado. */
export function NavPainel({ modo }: { modo: "lado" | "abas" }) {
  const caminho = usePathname();
  const itens = modo === "abas" ? ITENS.filter((i) => i.aba) : ITENS;
  return (
    <nav className={modo === "lado" ? "painel-menu" : "painel-abas"} aria-label={modo === "lado" ? "Painel" : "Atalhos do painel"}>
      {itens.map(({ href, rotulo, Icone }) => (
        <Link key={href} href={href} aria-current={ativo(caminho, href) ? "page" : undefined}>
          <Icone size={modo === "lado" ? 18 : 22} aria-hidden />
          <span>{modo === "abas" && rotulo === "Minha conta" ? "Conta" : rotulo}</span>
        </Link>
      ))}
    </nav>
  );
}
