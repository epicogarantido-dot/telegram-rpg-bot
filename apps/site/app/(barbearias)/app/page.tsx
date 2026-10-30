import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agoraNoFuso, dataValida, formatarData, somarDias } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { CalendarCheck, CalendarOff, CalendarPlus, Check, ListChecks, Star, MessageCircle, UserX, Users } from "lucide-react";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { BotaoCopiar } from "@/componentes/BotaoCopiar";
import { avisoDeTeste, chavesAviso } from "@/lib/avisos";
import { AvisosCelular } from "@/componentes/barbearia/AvisosCelular";
import { linkPublico, situacaoAgora, urlFoto } from "@/lib/barbearias";
import { mensagemAvaliacao, mensagemLembrete, primeiroNome } from "@/lib/pos-atendimento";
import { proximaData } from "@/lib/datas-barbearia";
import { soEntrega } from "@/lib/modo";
import { confirmarNoWhatsapp } from "./acoes-whatsapp";

export const metadata = { title: "Minha agenda", robots: { index: false } };
export const dynamic = "force-dynamic";

async function cancelar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const id = Number(form.get("id"));
  obterAgenda().cancelar(barbearia.id, id);
  // Volta mostrando o botão de avisar o cliente (cancelar sem avisar = cliente aparece na porta).
  revalidatePath("/app");
  redirect(`/app?data=${encodeURIComponent(String(form.get("data") ?? ""))}&cancelado=${id}#ag-${id}`);
}

/**
 * Lembrete da véspera e pedido de avaliação: anota que foi aberto (pra não repetir) e abre o
 * WhatsApp DO BARBEIRO com a mensagem pronta. Quem envia é ele; o sistema não manda nada sozinho.
 */
async function contatar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const a = banco.agendamento(barbearia.id, Number(form.get("id")));
  const tipo = form.get("tipo") === "avaliacao" ? "avaliacao" : "lembrete";
  if (!a || a.status !== "confirmado") redirect("/app");
  const b = banco.barbeariaPorId(barbearia.id)!;
  if (tipo === "avaliacao" && !b.linkAvaliacao) redirect("/app/config#depois");
  const texto = tipo === "lembrete"
    ? mensagemLembrete({ barbearia: b.nome, cliente: a.clienteNome, servico: a.servico, inicio: a.inicio })
    : mensagemAvaliacao({ barbearia: b.nome, cliente: a.clienteNome, link: b.linkAvaliacao! });
  banco.registrarContato(barbearia.id, a.id, tipo);
  redirect(linkWhatsapp(a.clienteTelefone, texto));
}

/** O cliente não apareceu (ou desfaz). Entra nos números do mês. */
async function marcarFalta(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const data = String(form.get("data") ?? "");
  const id = Number(form.get("id"));
  try {
    obterAgenda().marcarFalta(barbearia.id, id, form.get("faltou") === "1");
  } catch (e) {
    redirect(`/app?data=${encodeURIComponent(data)}&erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/app");
  redirect(`/app?data=${encodeURIComponent(data)}#ag-${id}`);
}

/** Folga em parte do dia (ou o dia todo) de um profissional ou da barbearia toda. */
async function bloquearHorario(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const data = String(form.get("dia") ?? "");
  const diaTodo = form.get("diaTodo") === "on";
  const quem = String(form.get("quem") ?? "");
  try {
    obterAgenda().bloquearPeriodo(barbearia.id, {
      data, de: diaTodo ? "00:00" : String(form.get("de") ?? ""), ate: diaTodo ? "23:59" : String(form.get("ate") ?? ""),
      profissionalId: quem ? Number(quem) : undefined, motivo: String(form.get("motivo") ?? ""),
    });
  } catch (e) {
    redirect(`/app?data=${encodeURIComponent(data)}&erro=${encodeURIComponent(mensagemDeErro(e))}#folgas`);
  }
  revalidatePath("/app");
  redirect(`/app?data=${encodeURIComponent(data)}#folgas`);
}

async function removerFolga(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  obterAgenda().removerBloqueio(barbearia.id, Number(form.get("id")));
  revalidatePath("/app");
  redirect(`/app?data=${encodeURIComponent(String(form.get("data") ?? ""))}#folgas`);
}

/** Trote ou quem sempre marca e não vem: bloqueia o número e cancela os horários futuros dele. */
async function bloquearNumero(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const n = obterAgenda().bloquearTelefone(barbearia.id, String(form.get("telefone")));
  revalidatePath("/app");
  redirect(`/app?data=${encodeURIComponent(String(form.get("data") ?? ""))}&bloqueado=${n}`);
}

async function salvarAviso(inscricao: { endpoint: string; p256dh: string; auth: string }): Promise<string | null> {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  try {
    obterAgenda().salvarInscricaoAviso(barbearia.id, {
      endpoint: String(inscricao.endpoint), p256dh: String(inscricao.p256dh), auth: String(inscricao.auth),
    });
    return null;
  } catch (e) {
    return mensagemDeErro(e);
  }
}

async function removerAviso(endpoint: string): Promise<void> {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  obterAgenda().removerInscricaoAviso(String(endpoint), barbearia.id);
}

async function testarAviso(): Promise<number> {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  return avisoDeTeste(barbearia.id);
}

async function alternarFechadoHoje(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  obterAgenda().fecharHoje(barbearia.id, form.get("fechar") === "1");
  revalidatePath("/app");
}

/** Fila: + e − mudam de 1 em 1; "Sem fila" zera. Cada toque renova o "atualizado agora" do site. */
async function mudarFila(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const atual = obterAgenda().barbeariaPorId(barbearia.id)!.filaPessoas ?? 0;
  const acao = String(form.get("acao"));
  const nova = acao === "zerar" ? 0 : Math.min(50, Math.max(0, atual + (acao === "mais" ? 1 : -1)));
  obterAgenda().definirFila(barbearia.id, nova);
  revalidatePath("/app");
}

export default async function Painel({ searchParams }: { searchParams: Promise<{ data?: string; novo?: string; cancelado?: string; bloqueado?: string; erro?: string; bloquear?: string }> }) {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  const sp = await searchParams;
  const hoje = agoraNoFuso(barbearia.fuso).slice(0, 10);
  const data = sp.data && dataValida(sp.data) ? sp.data : hoje;
  const agenda = obterAgenda().agendamentosDoDia(barbearia.id, data);
  const linkDoSite = linkPublico(barbearia);
  const diasRestantes = obterAgenda().diasRestantes(barbearia);
  const banco = obterAgenda();
  const profissionais = banco.profissionais(barbearia.id, true);
  // Folgas do dia e quem já estava marcado dentro delas (pra avisar).
  const folgas = banco.bloqueiosDoDia(barbearia.id, data).map((f) => ({
    ...f,
    conflitos: agenda.filter((a) => a.status === "confirmado" && a.inicio < f.fim && a.fim > f.inicio && (f.profissionalId === undefined || a.profissionalId === f.profissionalId)),
  }));
  const recemCancelado = sp.cancelado ? agenda.find((a) => String(a.id) === sp.cancelado && a.status === "cancelado") : undefined;
  const agoraLocal = agoraNoFuso(barbearia.fuso);
  const sumidos = banco.clientesSumidos(barbearia.id).length;
  const faltamConfirmar = banco.proximosAgendados(barbearia.id, agoraLocal, 30).filter((a) => !a.confirmacaoEm).length;
  const planos = new Map(banco.planos(barbearia.id).map((p) => [p.telefone, p]));
  const linkAvaliacao = banco.barbeariaPorId(barbearia.id)!.linkAvaliacao;
  // Lembretes da véspera: só na tela de hoje, pros horários de amanhã.
  const amanha = data === hoje ? banco.agendamentosDoDia(barbearia.id, somarDias(hoje, 1)).filter((a) => a.status === "confirmado") : [];
  // Quem já tem o próximo horário marcado (pra não oferecer "marcar o próximo" de novo).
  // Resumo de hoje (vale mesmo olhando outro dia na lista).
  const doDia = (data === hoje ? agenda : banco.agendamentosDoDia(barbearia.id, hoje)).filter((a) => a.status !== "cancelado");
  const porVir = doDia.filter((a) => a.status === "confirmado" && a.inicio > agoraLocal);
  const proximoCliente = porVir[0];
  const precos = new Map(banco.servicos(barbearia.id).map((s) => [s.id, s.precoCentavos]));
  const previstoHoje = doDia.filter((a) => a.status === "confirmado")
    .reduce((t, a) => t + (precos.get(a.servicoId) ?? 0) + (a.adicionais ?? []).reduce((x, id) => x + (precos.get(id) ?? 0), 0), 0);
  const mes = banco.numerosDoMes(barbearia.id, hoje.slice(0, 7));
  const fotos = banco.fotos(barbearia.id);
  const capa = fotos.find((f) => f.capa) ?? fotos[0];
  const proximo = new Map(agenda.filter((a) => a.status === "confirmado").map((a) => [a.id, banco.proximoDoCliente(barbearia.id, a.clienteTelefone)]));

  return (
    <>
      <div className="painel-ola">
        <div>
          <h1>{saudacao(agoraLocal)}, {usuario.nome.split(" ")[0]}!</h1>
          <p>{formatarData(hoje)}</p>
        </div>
      </div>
      {sp.novo && (
        <aside className="atribuicao">
          🎉 Conta criada, {usuario.nome}! Já deixamos serviços e horários de exemplo (ter a sáb, 9h–19h).
          Ajuste em <Link href="/app/config">Configurações</Link> e mande o link abaixo pros clientes.
        </aside>
      )}
      {/* No SaaS quem avisa do prazo é a faixa do layout (sem Pix por aqui). */}
      {!soEntrega() && diasRestantes <= 3 && (
        <aside className="atribuicao">
          ⏳ Seu acesso vence {diasRestantes === 1 ? "hoje" : `em ${diasRestantes} dias`}.{" "}
          <Link href="/app/assinatura">Renovar com Pix</Link> pra não bloquear sua agenda.
        </aside>
      )}

      <dl className="resumo-dia" aria-label="Resumo de hoje">
        <div className="resumo-destaque">
          <dt>Próximo cliente</dt>
          <dd>{proximoCliente ? proximoCliente.inicio.slice(11, 16) : "—"}<small>{proximoCliente ? `${proximoCliente.clienteNome.split(" ")[0]} · ${proximoCliente.servico}` : "Ninguém mais hoje"}</small></dd>
        </div>
        <div>
          <dt>Marcados hoje</dt>
          <dd>{doDia.length}<small>{porVir.length === 0 ? "nenhum por vir" : `${porVir.length} ainda por vir`}</small></dd>
        </div>
        <div>
          <dt>Previsto hoje</dt>
          <dd>{reais(previstoHoje)}</dd>
        </div>
        <div>
          <dt>No mês até agora</dt>
          <dd>{reais(mes.faturamentoCentavos)}<small>{mes.atendidos} {mes.atendidos === 1 ? "atendimento" : "atendimentos"}</small></dd>
        </div>
      </dl>

      <section className="cartao-site" aria-label="Seu site">
        {capa
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={urlFoto(capa.arquivo, "p")} alt="" width={96} height={96} />
          : <span />}
        <div className="cartao-site-texto">
          <p><strong>Seu site está no ar.</strong> Mande o link pros clientes marcarem sozinhos.</p>
          <a className="link-site" href={`/b/${barbearia.slug}`} target="_blank" rel="noopener noreferrer">{linkDoSite.replace(/^https?:\/\//, "")}</a>
          <div className="cartao-site-acoes">
            <BotaoCopiar texto={linkDoSite} />
            <a className="botao-sec" target="_blank" rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Agora dá pra marcar seu horário na ${barbearia.nome} pelo site: ${linkDoSite}`)}`}>
              <MessageCircle size={16} aria-hidden /> Mandar no WhatsApp
            </a>
            <Link className="botao-sec" href="/app/whatsapp">Pôr no WhatsApp Business</Link>
          </div>
        </div>
      </section>

      <div className="atalhos">
        <Link className="atalho-principal" href={`/b/${barbearia.slug}/agendar`}><CalendarPlus size={20} aria-hidden /> Marcar horário</Link>
        <Link href={`/app?data=${data}&bloquear=1#folgas`}><CalendarOff size={20} aria-hidden /> Bloquear horário</Link>
        <Link href="/app/agendados?faltam=1"><ListChecks size={20} aria-hidden /> Confirmar horários{faltamConfirmar > 0 ? ` (${faltamConfirmar})` : ""}</Link>
        <Link href="/app/clientes"><Users size={20} aria-hidden /> Clientes sumidos{sumidos > 0 ? ` (${sumidos})` : ""}</Link>
      </div>

      <Hoje barbeariaId={barbearia.id} />

      {(() => {
        const d = proximaData(hoje);
        if (!d) return null;
        const faltam = Math.round((Date.parse(`${d.dia}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86_400_000);
        return (
          <aside className="data-proxima" aria-label="Próxima data">
            <p><strong>{faltam === 0 ? "Hoje" : `Daqui a ${faltam} dia${faltam > 1 ? "s" : ""}`}: {d.titulo}</strong></p>
            <p className="suave pequeno">{d.ideia}{d.link && !soEntrega() && <> <a href={d.link} target="_blank" rel="noopener noreferrer">Ler a matéria</a></>}</p>
          </aside>
        );
      })()}

      {amanha.length > 0 && (
        <section className="lembretes" aria-labelledby="lembretes-titulo">
          <h2 id="lembretes-titulo">Lembretes de amanhã <small className="suave">({amanha.filter((a) => !a.lembreteEm).length} pra mandar)</small></h2>
          <p className="suave pequeno">Um lembrete na véspera diminui as faltas. Toque pra abrir o seu WhatsApp com a mensagem pronta.</p>
          <ul>
            {amanha.map((a) => (
              <li key={a.id} className="hoje-linha">
                <span><strong>{a.inicio.slice(11)}</strong> · {a.clienteNome} · {a.servico}</span>
                {a.lembreteEm
                  ? <span className="suave pequeno">Lembrete enviado ✓</span>
                  : (
                    <form action={contatar}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="tipo" value="lembrete" />
                      <button className="botao-sec"><MessageCircle size={16} aria-hidden /> Lembrar</button>
                    </form>
                  )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <AvisosCelular chavePublica={chavesAviso().publica} salvar={salvarAviso} remover={removerAviso} testar={testarAviso} />


      <nav className="navegacao">
        <Link href={`/app?data=${somarDias(data, -1)}`}>← dia anterior</Link>
        <strong>{data === hoje ? "Hoje — " : ""}{formatarData(data)}</strong>
        <Link href={`/app?data=${somarDias(data, 1)}`}>próximo dia →</Link>
      </nav>

      <section id="folgas" className="folgas">
        {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
        {folgas.map((f) => (
          <div key={f.id} className="cartao folga">
            <div className="hoje-linha">
              <p>
                <CalendarOff size={16} aria-hidden />{" "}
                <strong>{f.inicio.slice(11) === "00:00" && f.fim.slice(11) === "23:59" ? "Dia todo" : `${f.inicio.slice(11)}–${f.fim.slice(11)}`}</strong>
                {" · "}Folga {f.profissional ? `de ${f.profissional}` : "da barbearia"}{f.motivo ? ` (${f.motivo})` : ""}
              </p>
              <form action={removerFolga}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="data" value={data} />
                <button className="botao-sec">Remover</button>
              </form>
            </div>
            {f.conflitos.length > 0 && (
              <div className="folga-conflitos" role="alert">
                <p><strong>{f.conflitos.length === 1 ? "1 cliente já estava marcado" : `${f.conflitos.length} clientes já estavam marcados`} nesse período.</strong> Avise e cancele (ou remova a folga):</p>
                <ul>
                  {f.conflitos.map((a) => (
                    <li key={a.id}>
                      {a.inicio.slice(11)} · {a.clienteNome} ·{" "}
                      <a target="_blank" rel="noopener noreferrer" href={linkWhatsapp(a.clienteTelefone,
                        `Olá, ${a.clienteNome.split(" ")[0]}! Aqui é da ${barbearia.nome}. Tivemos um imprevisto e não vamos conseguir te atender ${formatarData(data)} às ${a.inicio.slice(11, 16)}. Desculpe! Dá pra remarcar por aqui: ${linkDoSite}`)}>
                        <MessageCircle size={14} aria-hidden /> Avisar no WhatsApp
                      </a>{" · "}<a href={`#ag-${a.id}`}>ver horário</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        <details className="bloquear-horario" open={sp.bloquear === "1"}>
          <summary className="botao-sec"><CalendarOff size={16} aria-hidden /> Bloquear um horário (folga, médico…)</summary>
          <form action={bloquearHorario} className="formulario">
            <label>Dia<input type="date" name="dia" defaultValue={data} min={hoje} required /></label>
            <label className="marcar"><input type="checkbox" name="diaTodo" /> O dia todo</label>
            <div className="linha-horas">
              <label>De<input type="time" name="de" defaultValue="12:00" /></label>
              <label>Até<input type="time" name="ate" defaultValue="14:00" /></label>
            </div>
            {profissionais.length > 1 && (
              <label>Quem vai faltar
                <select name="quem" defaultValue="">
                  <option value="">A barbearia toda</option>
                  {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </label>
            )}
            <label>Motivo (só você vê)<input name="motivo" maxLength={60} placeholder="Ex.: médico, curso" /></label>
            <button>Bloquear</button>
          </form>
        </details>
      </section>

      {agenda.length === 0 && (
        <p className="suave">Nenhum horário marcado neste dia. <Link href={`/b/${barbearia.slug}/agendar`}>Marcar um horário pra um cliente</Link></p>
      )}
      {sp.bloqueado !== undefined && (
        <p className="atribuicao" role="status">
          Número bloqueado{Number(sp.bloqueado) > 0 ? ` e ${sp.bloqueado} horário(s) futuro(s) cancelado(s)` : ""}. Ele não consegue mais marcar pelo site.
          Desbloqueie em <Link href="/app/config#bloqueados">Configurações</Link>.
        </p>
      )}

      {agenda.map((a) => (
        <div key={a.id} id={`ag-${a.id}`} className={`cartao lead ${a.status === "cancelado" ? "cancelado" : ""}`}>
          <div>
            <strong>{a.inicio.slice(11)}–{a.fim.slice(11)}</strong> · {a.servico} com {a.profissional}
            {a.status === "cancelado" && <span className="etiqueta" style={{ marginLeft: 8 }}>cancelado</span>}
            {a.status === "faltou" && <span className="etiqueta" style={{ marginLeft: 8 }}>faltou</span>}
            {planos.get(a.clienteTelefone) && (() => {
              const p = planos.get(a.clienteTelefone)!;
              return <span className={`etiqueta ${p.vencido || p.usadosNoMes > p.usosPorMes ? "etiqueta-alerta" : ""}`} style={{ marginLeft: 8 }}>
                {p.vencido ? "plano vencido" : `plano: ${p.usadosNoMes} de ${p.usosPorMes} no mês`}
              </span>;
            })()}
            <br />
            {a.clienteNome}
            {a.enderecoCliente && (
              <>
                <br />
                <a className="pequeno" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.enderecoCliente)}`} target="_blank" rel="noopener noreferrer">
                  Em domicílio: {a.enderecoCliente}
                </a>
              </>
            )}
            {a.referenciaFoto && (
              <a className="referencia-pedida" href={urlFoto(a.referenciaFoto)} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlFoto(a.referenciaFoto, "p")} alt="Corte que o cliente escolheu" width={56} height={56} />
                <span>Corte que o cliente escolheu</span>
              </a>
            )}
          </div>
          {a.status === "confirmado" && a.inicio <= agoraLocal && (
            <div className="acoes">
              {proximo.get(a.id)
                ? <span className="suave pequeno"><CalendarCheck size={14} aria-hidden /> Próximo: {formatarData(proximo.get(a.id)!.slice(0, 10))} às {proximo.get(a.id)!.slice(11, 16)}</span>
                : <Link className="botao" href={`/app/retorno/${a.id}`}><CalendarPlus size={16} aria-hidden /> Marcar o próximo</Link>}
              {linkAvaliacao
                ? (a.avaliacaoEm
                  ? <span className="suave pequeno">Avaliação pedida ✓</span>
                  : (
                    <form action={contatar}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="tipo" value="avaliacao" />
                      <button className="botao-sec"><Star size={16} aria-hidden /> Pedir avaliação</button>
                    </form>
                  ))
                : <Link className="botao-sec" href="/app/config#depois"><Star size={16} aria-hidden /> Pedir avaliação</Link>}
              <form action={marcarFalta}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="data" value={data} />
                <input type="hidden" name="faltou" value="1" />
                <button className="botao-sec"><UserX size={16} aria-hidden /> Faltou</button>
              </form>
            </div>
          )}
          {a.status === "faltou" && (
            <div className="acoes">
              <a className="botao-sec" target="_blank" rel="noopener noreferrer" href={linkWhatsapp(a.clienteTelefone,
                `Oi, ${primeiroNome(a.clienteNome)}! Aqui é da ${barbearia.nome}. Sentimos sua falta no horário de ${formatarData(a.inicio.slice(0, 10))} às ${a.inicio.slice(11, 16)}. ` +
                `Quer marcar outro? É só escolher aqui: ${linkPublico(barbearia, "/agendar")}`)}>
                <MessageCircle size={16} aria-hidden /> Chamar pra remarcar
              </a>
              <Link className="botao-sec" href={`/app/retorno/${a.id}`}><CalendarPlus size={16} aria-hidden /> Remarcar</Link>
              <form action={marcarFalta}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="data" value={data} />
                <input type="hidden" name="faltou" value="0" />
                <button className="botao-sec">Desfazer falta</button>
              </form>
            </div>
          )}
          {a.status === "confirmado" && a.inicio > agoraLocal && (
            <div className="acoes">
              <form action={confirmarNoWhatsapp}>
                <input type="hidden" name="id" value={a.id} />
                {a.confirmacaoEm
                  ? <button className="botao-sec" title="Mandar de novo"><Check size={16} aria-hidden /> Confirmação enviada</button>
                  : <button className="botao-sec"><MessageCircle size={16} aria-hidden /> Confirmar no WhatsApp</button>}
              </form>
              <details className="confirmar">
                <summary className="botao-sec">Cancelar</summary>
                <div>
                  <form action={cancelar}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="data" value={data} />
                    <p>Cancelar o horário de {a.clienteNome}?</p>
                    <button className="botao">Sim, cancelar</button>
                  </form>
                  <form action={bloquearNumero}>
                    <input type="hidden" name="telefone" value={a.clienteTelefone} />
                    <input type="hidden" name="data" value={data} />
                    <p className="suave pequeno">Foi trote? Bloquear o número cancela todos os horários futuros dele e impede novos pelo site.</p>
                    <button className="botao-sec">Bloquear este número</button>
                  </form>
                </div>
              </details>
            </div>
          )}
          {recemCancelado?.id === a.id && (
            <p className="atribuicao" role="status">
              Cancelado. Avise {primeiroNome(a.clienteNome)} pra não vir à toa:{" "}
              <a target="_blank" rel="noopener noreferrer" href={linkWhatsapp(a.clienteTelefone,
                `Olá, ${primeiroNome(a.clienteNome)}! Aqui é da ${barbearia.nome}. Precisamos cancelar seu horário de ${a.servico}, ${formatarData(a.inicio.slice(0, 10))} às ${a.inicio.slice(11, 16)}. Desculpe! Pra marcar outro: ${linkDoSite}`)}>
                <MessageCircle size={16} aria-hidden /> Avisar no WhatsApp
              </a>
            </p>
          )}
        </div>
      ))}
    </>
  );
}

function Hoje({ barbeariaId }: { barbeariaId: number }) {
  const banco = obterAgenda();
  const b = banco.barbeariaPorId(barbeariaId)!;
  const estado = situacaoAgora(b, banco.expedientes(b.id));
  const fechadoHoje = banco.fechadoHoje(b);
  const fila = b.atendimento !== "agenda" ? banco.filaAgora(b) : undefined;
  return (
    <section className="hoje-painel" aria-label="Hoje">
      <div className="hoje-linha">
        <p className={`selo-estado ${estado.aberto ? "aberto" : ""}`}>{estado.texto}</p>
        <form action={alternarFechadoHoje}>
          <input type="hidden" name="fechar" value={fechadoHoje ? "0" : "1"} />
          <button className="botao-sec">{fechadoHoje ? "Reabrir hoje" : "Fechar hoje"}</button>
        </form>
      </div>
      {fechadoHoje && <p className="suave pequeno">O site mostra &quot;Fechado hoje&quot; e não oferece horários pra hoje.</p>}
      {b.atendimento !== "agenda" && (
        <div className="hoje-linha">
          <div>
            <strong>Fila agora</strong>
            <p className="suave pequeno">
              {fila ? `No site: ${fila.pessoas === 0 ? "sem fila" : `${fila.pessoas} na fila, espera de ~${fila.esperaMin} min`} · atualizado ${fila.haMin < 1 ? "agora" : `há ${fila.haMin} min`}`
                : "Não aparece no site até você atualizar (some depois de 3 horas sem atualizar)."}
            </p>
          </div>
          <div className="fila-controle">
            <form action={mudarFila}><input type="hidden" name="acao" value="menos" /><button className="botao-sec" aria-label="Uma pessoa a menos na fila">−</button></form>
            <span className="fila-numero" aria-live="polite">{b.filaPessoas ?? 0}<small>na fila</small></span>
            <form action={mudarFila}><input type="hidden" name="acao" value="mais" /><button className="botao" aria-label="Uma pessoa a mais na fila">+</button></form>
            <form action={mudarFila}><input type="hidden" name="acao" value="zerar" /><button className="botao-sec fila-zerar">Sem fila</button></form>
          </div>
        </div>
      )}
    </section>
  );
}

function saudacao(agora: string): string {
  const h = Number(agora.slice(11, 13));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
