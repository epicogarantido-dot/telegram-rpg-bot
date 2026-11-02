import { BotaoCopiar } from "@/componentes/BotaoCopiar";
import { primeiroNome } from "@/lib/pos-atendimento";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { CalendarPlus, MapPin, MessageCircle } from "lucide-react";
import QRCode from "qrcode";
import { formatarData, linkGoogleAgenda, pixDoSinal } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { avisarMudancaDoCliente, avisoClienteLigado, chavesAviso } from "@/lib/avisos";
import { barbeariaInstalavel } from "@/lib/app-instalavel";
import { LembreteCliente } from "@/componentes/barbearia/LembreteCliente";
import type { Metadata } from "next";
import { linkMapa, montarEvento, urlAbsoluta } from "@/lib/barbearias";
import { ehOBarbeiro, protegerMudanca } from "@/lib/protecao";

export const dynamic = "force-dynamic";

type Busca = { novo?: string; remarcado?: string; cancelado?: string; cancelar?: string; erro?: string };

/** No celular, o app do site abre direto nesta página do horário (o manifesto leva o `inicio`). */
export async function generateMetadata({ params }: { params: Promise<{ slug: string; token: string }> }): Promise<Metadata> {
  const { slug, token } = await params;
  // Link secreto: nunca vai pro Google nem pra outros sites.
  const base: Metadata = { title: "Seu horário", robots: { index: false, follow: false }, referrer: "no-referrer" };
  const b = barbeariaInstalavel();
  if (!b || b.slug !== slug || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return base;
  return { ...base, manifest: `/manifest-site.webmanifest?inicio=${encodeURIComponent(`/b/${slug}/h/${token}`)}` };
}

/** "Me avise 1 hora antes": guarda o aparelho do cliente pra esse horário e manda o "aviso ligado". */
async function ligarLembrete(slug: string, token: string, aparelho: { endpoint: string; p256dh: string; auth: string }): Promise<string | null> {
  "use server";
  const banco = obterAgenda();
  const b = banco.barbeariaPorSlug(slug);
  const h = b && banco.horarioDoCliente(b.id, token);
  if (!b || !h || h.status !== "confirmado" || h.passou) return "Este horário não está mais ativo.";
  try {
    await protegerMudanca();
    const dados = { endpoint: String(aparelho.endpoint), p256dh: String(aparelho.p256dh), auth: String(aparelho.auth) };
    banco.salvarLembreteCliente(b.id, h.id, dados);
    after(() => avisoClienteLigado(dados, { barbearia: b.nome, slug: b.slug, servico: h.servico, inicio: h.inicio }).catch(() => {}));
    return null;
  } catch (e) {
    return mensagemDeErro(e);
  }
}

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
 * horário, liga o aviso no celular 1 hora antes (o site é um app) e deixa cancelar ou remarcar sem login.
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
  const mapa = linkMapa(b);
  const whats = linkWhatsapp(b.telefone, `Olá! Tenho horário de ${h.servico} com ${h.profissional}, ${quando}.`);

  // O barbeiro marcou pelo próprio celular pro cliente: manda o link pra ele por WhatsApp.
  const barbeiro = await ehOBarbeiro(b.id);
  const linkCliente = urlAbsoluta(base);
  const mandarLink = linkWhatsapp(h.clienteTelefone, `Olá, ${primeiroNome(h.clienteNome)}! Seu horário na ${b.nome} está marcado: ${h.servico} com ${h.profissional}, ${quando}. Pra pôr na agenda, remarcar ou cancelar: ${linkCliente}`);
  // Sinal: só enquanto não foi pago e o horário segue de pé. O Pix é da própria barbearia.
  const pixSinal = podeMudar && !h.sinalPagoEm ? pixDoSinal(b, h) : undefined;
  const qrSinal = pixSinal ? await QRCode.toString(pixSinal, { type: "svg", margin: 1, width: 200 }) : "";
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

      {pixSinal && !barbeiro && (
        <div className="b-sinal">
          <h2>Falta o sinal de {reais(h.sinalCentavos!)}</h2>
          <p>A {b.nome} pede um sinal pelo Pix pra garantir o horário. O restante você acerta no dia.</p>
          <p><strong>No celular:</strong> copie o código, abra o app do banco e escolha Pix Copia e Cola.</p>
          <p><BotaoCopiar texto={pixSinal} rotulo="Copiar código do Pix" className="b-botao" /></p>
          <div className="b-sinal-qr" aria-label="QR code do Pix" dangerouslySetInnerHTML={{ __html: qrSinal }} />
          <p>
            <a target="_blank" rel="noopener noreferrer" href={linkWhatsapp(b.telefone, `Olá! Paguei o sinal do meu horário de ${h.servico}, ${quando}. Segue o comprovante.`)}>
              <MessageCircle size={16} aria-hidden /> Pagou? Mande o comprovante no WhatsApp da barbearia
            </a>
          </p>
        </div>
      )}
      {podeMudar && h.sinalCentavos && h.sinalPagoEm && <p className="b-aviso-ok">Sinal de {reais(h.sinalCentavos)} recebido pela barbearia.</p>}

      {podeMudar && !barbeiro && (
        <>
          <LembreteCliente chavePublica={chavesAviso().publica} barbearia={b.nome} ligar={ligarLembrete.bind(null, slug, token)} />

          <div className="b-mudar">
            <p><strong>Guarde este link:</strong> é por ele que você remarca ou cancela, sem precisar ligar.</p>
            <p className="b-link-horario"><span>{linkCliente}</span> <BotaoCopiar texto={linkCliente} className="b-botao-sec" /></p>
            {sp.cancelar ? (
              <form action={cancelar} className="b-mudar-confirmar" id="cancelar">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="token" value={token} />
                <p>Cancelar {h.servico} de {quando}?</p>
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

      {/* Cancelado: o "Avisar a barbearia" e o "Marcar outro horário" já dão conta; o texto daqui falaria do horário que não existe mais. */}
      {!barbeiro && !cancelado && (
        <p className="b-confirmado-ajuda">
          {podeMudar ? "Alguma dúvida?" : "Precisa de algo?"}{" "}
          <a target="_blank" rel="noopener noreferrer" href={whats}><MessageCircle size={16} aria-hidden /> Fale com a barbearia no WhatsApp</a>
        </p>
      )}
    </section>
  );
}
