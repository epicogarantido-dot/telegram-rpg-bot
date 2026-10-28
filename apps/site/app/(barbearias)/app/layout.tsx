import Link from "next/link";
import { cookies } from "next/headers";
import { CalendarDays, ExternalLink } from "lucide-react";
import { obterAgenda } from "@/lib/agenda";
import { urlFoto } from "@/lib/barbearias";
import { NavPainel } from "@/componentes/barbearia/NavPainel";
import { vendeAqui } from "@/lib/entrega";
import "./painel.css";

// O painel pode ser instalado no celular como app (avisos de horário novo).
export const metadata = {
  manifest: "/painel.webmanifest",
  appleWebApp: { capable: true, title: "Agenda", statusBarStyle: "default" as const },
  icons: { apple: "/painel/icone-192.png" },
};

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const banco = obterAgenda();
  const usuario = banco.usuarioDaSessao((await cookies()).get("sessao_agenda")?.value);
  const barbearia = usuario && banco.barbeariaPorId(usuario.barbeariaId);

  // Fora da conta (entrar, cadastro), com o site ainda em montagem ou no site de leads (que só
  // vende; o painel fica no SaaS): topo simples, sem menu.
  if (!barbearia || barbearia.emMontagem || vendeAqui()) {
    return (
      <>
        <div className="barra-topo">
          <header className="topo">
            <Link href={vendeAqui() ? "/app/assinatura" : "/app"} className="marca">
              <span className="marca-icone"><CalendarDays size={18} aria-hidden /></span>
              {barbearia?.nome ?? "Agenda da barbearia"}
            </Link>
          </header>
        </div>
        <main>{children}</main>
      </>
    );
  }

  const fotos = banco.fotos(barbearia.id);
  const capa = fotos.find((f) => f.capa) ?? fotos[0];
  return (
    <div className="painel">
      <aside className="painel-lado">
        <Link href="/app" className="painel-marca">
          {capa
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={urlFoto(capa.arquivo, "p")} alt="" width={44} height={44} />
            : <span className="painel-marca-inicial" aria-hidden>{barbearia.nome[0]}</span>}
          <span>
            <strong>{barbearia.nome}</strong>
            <small>Painel da barbearia</small>
          </span>
        </Link>
        <NavPainel modo="lado" />
        <a className="painel-ver-site" href={`/b/${barbearia.slug}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden /> Ver meu site
        </a>
      </aside>
      <header className="painel-topo-celular">
        <Link href="/app" className="painel-marca">
          {capa
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={urlFoto(capa.arquivo, "p")} alt="" width={36} height={36} />
            : <span className="painel-marca-inicial" aria-hidden>{barbearia.nome[0]}</span>}
          <strong>{barbearia.nome}</strong>
        </Link>
        <a className="painel-ver-site" href={`/b/${barbearia.slug}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden /> Ver site
        </a>
      </header>
      <main className="painel-conteudo">{children}</main>
      <NavPainel modo="abas" />
    </div>
  );
}
