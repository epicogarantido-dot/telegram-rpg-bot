import Link from "next/link";
import { cookies } from "next/headers";
import { CalendarDays, ExternalLink } from "lucide-react";
import { obterAgenda } from "@/lib/agenda";
import { urlFoto } from "@/lib/barbearias";
import { NavPainel } from "@/componentes/barbearia/NavPainel";
import { soEntrega, soVenda } from "@/lib/modo";
import { prazoDaConta } from "@/lib/prazo";
import { contatoResponsavel } from "@/lib/contato";
import { WhatsFixo } from "@/componentes/WhatsFixo";
import "./painel.css";
import "./painel-temas.css";
import { barbeariaDoApp } from "@/lib/barbearia-do-app";
import "../../(cursos)/imperial.css";

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

  // Site de leads (só mostra e cobra; o painel fica no SaaS): pedido, pagamento e entrar com o
  // mesmo visual e a mesma marca da página de venda, pra quem compra não achar que saiu do site.
  if (soVenda()) {
    return (
      <div className="site-cursos app-venda">
        <div className="barra-topo">
          <header className="topo">
            <Link href="/" className="marca">Site da Barbearia</Link>
            <nav aria-label="Principal"><a href="/#estilos">Estilos</a></nav>
          </header>
        </div>
        <main>{children}</main>
        {/* Dúvida na hora de pedir ou pagar: o WhatsApp continua à mão, como no resto da venda. */}
        <WhatsFixo />
      </div>
    );
  }

  // Fora da conta (entrar, cadastro), com o site ainda em montagem ou suspenso pelo admin: topo simples, sem menu.
  // No SaaS, até a tela de entrar já veste o estilo do site do barbeiro.
  if (!barbearia || barbearia.emMontagem || barbearia.suspensa) {
    const doApp = soEntrega() ? barbeariaDoApp() : undefined;
    const tema = barbearia?.tema ?? doApp?.tema;
    return (
      <div className="painel-simples" data-tema-painel={tema}>
        <div className="barra-topo">
          <header className="topo">
            <Link href="/app" className="marca">
              <span className="marca-icone"><CalendarDays size={18} aria-hidden /></span>
              {barbearia?.nome ?? doApp?.nome ?? "Agenda da barbearia"}
            </Link>
          </header>
        </div>
        <main>{children}</main>
      </div>
    );
  }

  const fotos = banco.fotos(barbearia.id);
  const capa = fotos.find((f) => f.capa) ?? fotos[0];
  // SaaS: o prazo pago só avisa (faltando poucos dias e depois que acaba); nada sai do ar por isso.
  const prazo = soEntrega() ? prazoDaConta(barbearia) : undefined;
  const contato = contatoResponsavel();
  const faixa = prazo && prazo.situacao !== "em dia" && (
    <div className={`faixa-prazo ${prazo.situacao}`} role="status">
      <p>
        <strong>{prazo.frase}</strong>{" "}
        {prazo.situacao === "acabou" ? "O seu site e a agenda continuam funcionando. " : ""}Pra renovar, fale com a gente.
      </p>
      {contato
        ? <a className="botao-sec" target="_blank" rel="noopener noreferrer" href={`${contato.link}?text=${encodeURIComponent(`Olá! Quero renovar o site da ${barbearia.nome}.`)}`}>Renovar pelo WhatsApp</a>
        : <Link className="botao-sec" href="/app/assinatura">Ver o plano</Link>}
    </div>
  );
  return (
    <div className="painel" data-tema-painel={barbearia.tema}>
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
      <main className="painel-conteudo">{faixa}{children}</main>
      <NavPainel modo="abas" />
    </div>
  );
}
