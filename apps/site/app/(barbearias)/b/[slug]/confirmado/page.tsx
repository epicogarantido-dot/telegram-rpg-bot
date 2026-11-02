import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CalendarPlus, MapPin, MessageCircle } from "lucide-react";
import { formatarData, linkGoogleAgenda } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { obterAgenda } from "@/lib/agenda";
import { eventoDoHorario, linkMapa } from "@/lib/barbearias";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agendado!", robots: { index: false } };

type Busca = { servico?: string; profissional?: string; data?: string; hora?: string; teste?: string };

export default async function Confirmado({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Busca> }) {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  if (!b) notFound();
  const sp = await searchParams;
  // Só mostra o que veio na URL, cruzado com dados públicos da barbearia:
  // nada aqui expõe agendamentos de outras pessoas.
  const r = eventoDoHorario(b, sp);
  // Sem os dados do horário não tem o que confirmar: volta pro site (nada de "Agendado!" vazio).
  if (!r) redirect(`/b/${b.slug}`);
  const teste = !!b.demoAte;
  const { evento, servico, prof } = r;
  const quando = `${formatarData(sp.data!)} às ${sp.hora}`;
  const ics = `/b/${b.slug}/agenda.ics?${new URLSearchParams({ servico: String(servico.id), profissional: String(prof.id), data: sp.data!, hora: sp.hora! })}`;
  const google = linkGoogleAgenda(evento);
  // No Android o Google Agenda é o caminho natural; no iPhone (e no resto), o arquivo .ics.
  const android = /Android/i.test((await headers()).get("user-agent") ?? "");
  const mapa = linkMapa(b);

  return (
    <section className="b-secao b-confirmado">
      <h1>Agendado!</h1>
      <div className="b-resumo">
        <p className="b-resumo-quando">{quando}</p>
        <p>{servico.nome} com {prof.nome} · {b.nome}</p>
        {b.endereco && (
          <p className="b-resumo-local"><MapPin size={16} aria-hidden /> {mapa ? <a href={mapa} target="_blank" rel="noopener noreferrer">{b.endereco}</a> : b.endereco}</p>
        )}
      </div>

      <div className="b-lembrete">
        <a className="b-botao" href={android ? google : ics} {...(android ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          <CalendarPlus size={18} aria-hidden /> Adicionar à minha agenda
        </a>
        <p>{android ? "Abre o Google Agenda com o horário pronto pra salvar." : "Seu celular te lembra 1 hora antes."}</p>
        <a className="b-lembrete-outro" href={android ? ics : google} {...(android ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
          {android ? "Prefere outro app? Baixar arquivo de agenda" : "Usa o Google Agenda? Adicionar por lá"}
        </a>
      </div>

      {teste ? (
        // Site de exemplo: foi um teste. Mostra o que acontece no site de verdade.
        <div className="b-aviso-ok" role="status">
          <p><strong>Isso foi um teste: nada foi marcado.</strong></p>
          <p>No seu site, o horário fica salvo na hora, o barbeiro recebe o aviso no celular e o cliente ganha um link pra remarcar ou cancelar sozinho.</p>
          <p><Link className="b-botao" href={`/app/cadastro?estilo=${b.tema}`}>Quero um site assim</Link></p>
        </div>
      ) : (
      <p className="b-confirmado-ajuda">
        Precisa remarcar ou cancelar?{" "}
        <a target="_blank" rel="noopener noreferrer"
          href={linkWhatsapp(b.telefone, `Olá! Tenho horário de ${servico.nome} com ${prof.nome}, ${quando}.`)}>
          <MessageCircle size={16} aria-hidden /> Fale com a barbearia no WhatsApp
        </a>
      </p>
      )}
    </section>
  );
}
