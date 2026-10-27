import Link from "next/link";
import { cookies } from "next/headers";
import { CalendarDays, Images, LayoutTemplate, Settings, Wallet } from "lucide-react";
import { obterAgenda } from "@/lib/agenda";

// O painel pode ser instalado no celular como app (avisos de horário novo).
export const metadata = {
  manifest: "/painel.webmanifest",
  appleWebApp: { capable: true, title: "Agenda", statusBarStyle: "default" as const },
  icons: { apple: "/painel/icone-192.png" },
};

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const usuario = obterAgenda().usuarioDaSessao((await cookies()).get("sessao_agenda")?.value);
  const barbearia = usuario && obterAgenda().barbeariaPorId(usuario.barbeariaId);
  return (
    <>
      <div className="barra-topo">
        <header className="topo">
          <Link href="/app" className="marca">
            <span className="marca-icone"><CalendarDays size={18} aria-hidden /></span>
            {barbearia?.nome ?? "Agenda da barbearia"}
          </Link>
          {barbearia && !barbearia.emMontagem && (
            <nav aria-label="Painel">
              <Link href="/app"><CalendarDays className="icone" aria-hidden /> Agenda</Link>
              <Link href="/app/site"><LayoutTemplate className="icone" aria-hidden /> Meu site</Link>
              <Link href="/app/fotos"><Images className="icone" aria-hidden /> Fotos</Link>
              <Link href="/app/config"><Settings className="icone" aria-hidden /> Configurações</Link>
              <Link href="/app/assinatura"><Wallet className="icone" aria-hidden /> Assinatura</Link>
            </nav>
          )}
        </header>
      </div>
      <main>{children}</main>
    </>
  );
}
