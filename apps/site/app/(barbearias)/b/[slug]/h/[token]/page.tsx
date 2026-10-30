import { BotaoCopiar } from "@/componentes/BotaoCopiar";
import { primeiroNome } from "@/lib/pos-atendimento";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { CalendarPlus, MapPin, MessageCircle } from "lucide-react";
import { formatarData, linkGoogleAgenda } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { avisarMudancaDoCliente } from "@/lib/avisos";
import { linkMapa, montarEvento, urlAbsoluta } from "@/lib/barbearias";
import { ehOBarbeiro, protegerMudanca } from "@/lib/protecao";

export const dynamic = "force-dynamic";
// Link secreto: nunca vai pro Google nem pra outros sites.
export const metadata = { title: "Seu horário", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

type Busca = { novo?: string; remarcado?: string; cancelado?: string; cancelar?: string; erro?: string };

async function cancelar(form: FormData) {
  "use server";
  const slug = String(form.get("slug"));
  const token = String(form.get("token"));
  const b = obterAgenda().barbeariaPorSlug(slug);
  if (!b) notFound();
  try {
    await protegerMudanca();
    const h = obterAgenda().cancelarPeloCliente(b.id, token);
    after(() => avisarMudancaDoCliente(b.id, { tipo: "cancelou", id: h.id, cliente: h.clienteNome, servico: h.servico, inicio: h.inicio })
      .catch((e) => console.error("Aviso não enviado:", e)));
  } catch (e) {
    redirect(`/b/${slug}/h/${token}?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  redirect(`/b/${slug}/h/${token}?cancelado=1`);
}

/**
 * Página do horário do cliente (link secreto gerado ao marcar). Mostra o
 * horário, adiciona à agenda do celular e deixa cancelar ou remarcar sem login.
 */
export default async function SeuHorario({ params, searchParams }: { params: Promise<{ slug: string; token: string }>; searchParams: Promise<Busca> }) {
  const { slug, token } = await params;
  const sp = await searchParams;
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug(slug);
  if (!b) notFound();
  const h = banco.horarioDoCliente(b.id, token);
  if (!h) notFound();

  const base = `/b/${slug}/h/${token}`;
  const quando = `${formatarData(h.inicio.slice(0, 10))} às ${h.inicio.slice(11, 16)}`;
  const cancelado = h.status === "cancelado";
  const podeMudar = !cancelado && !h.passou;
  const evento = montarEvento(b, { servico: h.servico, profissional: h.profissional, inicio: h.inicio, duracaoMin: h.duracaoMin, linkGestao: urlAbsoluta(base) });
  const android = /Android/i.test((await headers()).get("user-agent") ?? "");
  const ics = `${base}/agenda.ics`;
  const google = linkGoogleAgenda(evento);
  const mapa = linkMapa(b);
  const whats = linkWhatsapp(b.telefone, `Olá! Tenho horário de ${h.servico} com ${h.profissional}, ${quando}.`);

  // O barbeiro marcou pelo próprio celular pro cliente: manda o link pra ele por WhatsApp.
  const barbeiro = await ehOBarbeiro(b.id);
  const linkCliente = urlAbsoluta(base);
  const mandarLink = linkWhatsapp(h.clienteTelefone, `Olá, ${primeiroNome(h.clienteNome)}! Seu horário na ${b.nome} está marcado: ${h.servico} com ${h.profissional}, ${quando}. Pra pôr na agenda, remarcar ou cancelar: ${linkCliente}`);
  const titulo = cancelado ? "Horário cancelado" : sp.novo ? "Agendado!" : sp.remarcado ? "Horário trocado!" : h.passou ? "Seu último horário" : "Seu horário";

  return (
    <section className="b-secao b-confirmado">
      <h1>{titulo}</h1>
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
      {sp.cancelado && <p className="b-aviso-ok" role="status">Pronto, cancelamos. O horário ficou livre pra outra pessoa.</p>}
      {/* Cliente mudou o horário: a barbearia recebe o aviso no painel, mas um toque no WhatsApp dela ajuda quem não vive no painel. */}
      {!barbeiro && (sp.cancelado || sp.remarcado) && (
        <p>
          <a className="b-botao-sec" target="_blank" rel="noopener noreferrer" href={linkWhatsapp(b.telefone, sp.cancelado
            ? `Olá! Aqui é ${h.clienteNome}. Cancelei pelo site o meu horário de ${h.servico}, ${quando}.`
            : `Olá! Aqui é ${h.clienteNome}. Troquei pelo site o meu horário: agora é ${h.servico}, ${quando}.`)}>
            <MessageCircle size={16} aria-hidden /> Avisar a barbearia no WhatsApp
          </a>
        </p>
      )}

      {/* Barbeiro logado que marcou pro cliente: o que importa é mandar o link pra ele (o resto da página é do cliente). */}
      {barbeiro && podeMudar && (
        <div className="b-aviso-ok b-barbeiro-marcou">
          <p>Marcado na sua agenda. Mande o link pro cliente: por ele, o cliente põe na agenda do celular, remarca ou cancela.</p>
          <a className="b-botao" href={mandarLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden /> Mandar o link pra {primeiroNome(h.clienteNome)}</a>
          <a href="/app">Voltar pra agenda</a>
        </div>
      )}

      <div className={`b-resumo ${cancelado ? "riscado" : ""}`}>
        <p className="b-resumo-quando">{quando}</p>
        <p>{h.servico} com {h.profissional} · {b.nome}</p>
        {b.endereco && (
          <p className="b-resumo-local"><MapPin size={16} aria-hidden /> {mapa ? <a href={mapa} target="_blank" rel="noopener noreferrer">{b.endereco}</a> : b.endereco}</p>
        )}
      </div>

      {podeMudar && !barbeiro && (
        <>
          <div className="b-lembrete">
            <a className="b-botao" href={android ? google : ics} {...(android ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <CalendarPlus size={18} aria-hidden /> Adicionar à minha agenda
            </a>
            <p>{android ? "Abre o Google Agenda com o horário pronto pra salvar." : "Seu celular te lembra 1 hora antes."}</p>
            <a className="b-lembrete-outro" href={android ? ics : google} {...(android ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
              {android ? "Prefere outro app? Baixar arquivo de agenda" : "Usa o Google Agenda? Adicionar por lá"}
            </a>
          </div>

          <div className="b-mudar">
            <p><strong>Guarde este link:</strong> é por ele que você remarca ou cancela, sem precisar ligar.</p>
            <p className="b-link-horario"><span>{linkCliente}</span> <BotaoCopiar texto={linkCliente} className="b-botao-sec" /></p>
            {sp.cancelar ? (
              <form action={cancelar} className="b-mudar-confirmar" id="cancelar">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="token" value={token} />
                <p>Cancelar {h.servico.toLowerCase()} de {quando}?</p>
                <div className="b-acoes">
                  <BotaoEnviar className="b-botao" carregando="Cancelando…">Sim, cancelar</BotaoEnviar>
                  <Link className="b-botao-sec" href={base}>Não, manter</Link>
                </div>
              </form>
            ) : (
              <div className="b-acoes">
                <Link className="b-botao-sec" href={`/b/${slug}/agendar?servico=${h.servicoId}&remarcar=${token}`}>Trocar dia ou horário</Link>
                <Link className="b-botao-sec" href={`${base}?cancelar=1#cancelar`}>Cancelar horário</Link>
              </div>
            )}
          </div>
        </>
      )}

      {cancelado && <p><Link className="b-botao" href={`/b/${slug}/agendar?servico=${h.servicoId}`}>Marcar outro horário</Link></p>}

      <p className="b-confirmado-ajuda">
        {podeMudar ? "Alguma dúvida?" : "Precisa de algo?"}{" "}
        <a target="_blank" rel="noopener noreferrer" href={whats}><MessageCircle size={16} aria-hidden /> Fale com a barbearia no WhatsApp</a>
      </p>
    </section>
  );
}
