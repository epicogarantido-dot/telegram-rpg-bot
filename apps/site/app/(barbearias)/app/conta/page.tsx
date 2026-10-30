import Link from "next/link";
import { redirect } from "next/navigation";
import { semEmail, TEMAS } from "@aprenda/agenda";
import { CalendarDays, CreditCard, Download, KeyRound, LogOut, MessageCircle, Repeat, Settings, Star, Users, BarChart3 } from "lucide-react";
import { encerrarSessaoAgenda, exigirAcessoAtivo, obterAgenda, reais } from "@/lib/agenda";
import { dataPorExtenso } from "@/lib/datas";
import { linkPublico } from "@/lib/barbearias";
import { soEntrega } from "@/lib/modo";

export const metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

async function sair() {
  "use server";
  await encerrarSessaoAgenda();
  redirect("/app/entrar");
}

/** Dados da conta, do plano e do site num lugar só, com atalhos pro resto do painel. */
export default async function Conta() {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const b = banco.barbeariaPorId(barbearia.id)!;
  const dias = banco.diasRestantes(b);
  const site = linkPublico(b);
  const telefone = b.telefone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
  const estilo = TEMAS.find((t) => t.id === b.tema)?.nome ?? b.tema;
  const situacao = dias <= 0 ? { texto: soEntrega() ? "Período pago acabou" : "Vencido", classe: "vencido" } : dias <= 5 ? { texto: `Vence em ${dias} ${dias === 1 ? "dia" : "dias"}`, classe: "alerta" } : { texto: "Em dia", classe: "" };

  return (
    <>
      <div className="painel-ola">
        <div>
          <h1>Minha conta</h1>
          <p>{usuario.nome}</p>
        </div>
      </div>

      <div className="conta-grade">
        <section className="conta-bloco" aria-labelledby="plano-titulo">
          <h2 id="plano-titulo">Plano</h2>
          <dl className="conta-dados">
            <div><dt>Situação</dt><dd><span className={`conta-status ${situacao.classe}`}>{situacao.texto}</span></dd></div>
            <div><dt>{soEntrega() ? "Pago até" : "Acesso até"}</dt><dd>{dataPorExtenso(b.acessoAte)}</dd></div>
            {!soEntrega() && <div><dt>Mensalidade</dt><dd>{reais(banco.plano.valorCentavos)} a cada 30 dias, por Pix</dd></div>}
          </dl>
          <p style={{ marginBottom: 0 }}>
            {/* No SaaS não se paga por aqui: a página do plano mostra o prazo e o WhatsApp pra renovar. */}
            <Link className="botao" href="/app/assinatura"><CreditCard size={18} aria-hidden /> {soEntrega() ? "Ver o plano e renovar" : "Pagar ou ver pagamentos"}</Link>
          </p>
        </section>

        <section className="conta-bloco" aria-labelledby="dados-titulo">
          <h2 id="dados-titulo">Seus dados</h2>
          <dl className="conta-dados">
            <div><dt>Barbearia</dt><dd>{b.nome}</dd></div>
            <div><dt>Responsável</dt><dd>{usuario.nome}</dd></div>
            {!soEntrega() && !semEmail(usuario.email) && <div><dt>E-mail de acesso</dt><dd>{usuario.email}</dd></div>}
            <div><dt>WhatsApp</dt><dd>{telefone}</dd></div>
            {b.cidade && <div><dt>Cidade</dt><dd>{b.cidade}</dd></div>}
          </dl>
        </section>

        <section className="conta-bloco" aria-labelledby="site-titulo">
          <h2 id="site-titulo">Seu site</h2>
          <dl className="conta-dados">
            <div><dt>Endereço</dt><dd><a href={`/b/${b.slug}`} target="_blank" rel="noopener noreferrer">{site.replace(/^https?:\/\//, "")}</a></dd></div>
            <div><dt>Estilo</dt><dd>{estilo}</dd></div>
            <div><dt>Como atende</dt><dd>{b.atendimento === "agenda" ? "Horário marcado" : b.atendimento === "chegada" ? "Ordem de chegada" : "Horário marcado e ordem de chegada"}</dd></div>
          </dl>
          <p style={{ marginBottom: 0 }}><Link className="botao-sec" href="/app/site">Mudar textos e estilo do site</Link></p>
        </section>

        <section className="conta-bloco" aria-labelledby="mais-titulo">
          <h2 id="mais-titulo">Mais do painel</h2>
          <ul className="conta-links">
            <li><Link href="/app/whatsapp"><MessageCircle size={20} aria-hidden /><span>WhatsApp Business<small>Mensagem automática com o link de agendar</small></span></Link></li>
            <li><Link href="/app/config"><Settings size={20} aria-hidden /><span>Configurações<small>Serviços, equipe, horários e como você atende</small></span></Link></li>
            <li><Link href="/app/planos"><Repeat size={20} aria-hidden /><span>Planos mensais<small>Clientes que pagam por mês</small></span></Link></li>
            <li><Link href="/app/clientes"><Users size={20} aria-hidden /><span>Clientes que sumiram<small>Quem não volta faz tempo</small></span></Link></li>
            <li><Link href="/app/numeros"><BarChart3 size={20} aria-hidden /><span>Números<small>Atendimentos, faturamento e quem voltou no mês</small></span></Link></li>
            <li><Link href="/app/calendario"><CalendarDays size={20} aria-hidden /><span>Agenda no celular<small>Ver os horários no calendário do iPhone ou Google</small></span></Link></li>
            <li><Link href="/app/avaliacao"><Star size={20} aria-hidden /><span>Placa de avaliação<small>QR pra pedir avaliação no Google</small></span></Link></li>
            {soEntrega()
              ? <li><a href="/app/backup"><Download size={20} aria-hidden /><span>Cópia dos dados<small>Baixar tudo (clientes, horários, serviços) num arquivo</small></span></a></li>
              : <li><Link href="/app/config#senha"><KeyRound size={20} aria-hidden /><span>Trocar senha</span></Link></li>}
          </ul>
        </section>
      </div>

      <form action={sair} className="conta-sair">
        <button className="botao-sec"><LogOut size={16} aria-hidden /> Sair do painel</button>
      </form>
    </>
  );
}
