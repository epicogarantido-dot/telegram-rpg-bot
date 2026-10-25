import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agoraNoFuso, dataValida, formatarData, somarDias } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { CalendarOff, CalendarPlus, MessageCircle } from "lucide-react";
import { encerrarSessaoAgenda, exigirAcessoAtivo, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { avisoDeTeste, chavesAviso, mensagemConfirmacao } from "@/lib/avisos";
import { AvisosCelular } from "@/componentes/barbearia/AvisosCelular";
import { situacaoAgora } from "@/lib/barbearias";

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

async function sair() {
  "use server";
  await encerrarSessaoAgenda();
  redirect("/app/entrar");
}

export default async function Painel({ searchParams }: { searchParams: Promise<{ data?: string; novo?: string; cancelado?: string; bloqueado?: string; erro?: string }> }) {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  const sp = await searchParams;
  const hoje = agoraNoFuso(barbearia.fuso).slice(0, 10);
  const data = sp.data && dataValida(sp.data) ? sp.data : hoje;
  const agenda = obterAgenda().agendamentosDoDia(barbearia.id, data);
  const linkPublico = `${process.env.SITE_URL ?? ""}/b/${barbearia.slug}`;
  const diasRestantes = obterAgenda().diasRestantes(barbearia);
  const banco = obterAgenda();
  const profissionais = banco.profissionais(barbearia.id, true);
  // Folgas do dia e quem já estava marcado dentro delas (pra avisar).
  const folgas = banco.bloqueiosDoDia(barbearia.id, data).map((f) => ({
    ...f,
    conflitos: agenda.filter((a) => a.status === "confirmado" && a.inicio < f.fim && a.fim > f.inicio && (f.profissionalId === undefined || a.profissionalId === f.profissionalId)),
  }));
  const recemCancelado = sp.cancelado ? agenda.find((a) => String(a.id) === sp.cancelado && a.status === "cancelado") : undefined;

  return (
    <>
      <div className="linha-topo">
        <h1>{barbearia.nome}</h1>
        <form action={sair}><button className="botao-sec">Sair</button></form>
      </div>
      {sp.novo && (
        <aside className="atribuicao">
          🎉 Conta criada, {usuario.nome}! Já deixamos serviços e horários de exemplo (ter a sáb, 9h–19h).
          Ajuste em <Link href="/app/config">Configurações</Link> e mande o link abaixo pros clientes.
        </aside>
      )}
      {diasRestantes <= 3 && (
        <aside className="atribuicao">
          ⏳ Seu acesso vence {diasRestantes === 1 ? "hoje" : `em ${diasRestantes} dias`}.{" "}
          <Link href="/app/assinatura">Renovar com Pix</Link> pra não bloquear sua agenda.
        </aside>
      )}
      <p>
        Seu site: <a href={`/b/${barbearia.slug}`} target="_blank" rel="noopener noreferrer">{linkPublico}</a>
        {" · "}<Link href="/app/config">Configurações</Link>
        {" · "}<Link href="/app/assinatura">Assinatura</Link>
      </p>

      <Hoje barbeariaId={barbearia.id} />

      <AvisosCelular chavePublica={chavesAviso().publica} salvar={salvarAviso} remover={removerAviso} testar={testarAviso} />

      <p className="pequeno"><Link href="/app/calendario">Ver a agenda no calendário do celular (iPhone ou Google Agenda)</Link></p>

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
                        `Olá, ${a.clienteNome.split(" ")[0]}! Aqui é da ${barbearia.nome}. Tivemos um imprevisto e não vamos conseguir te atender ${formatarData(data)} às ${a.inicio.slice(11, 16)}. Desculpe! Dá pra remarcar por aqui: ${linkPublico}`)}>
                        <MessageCircle size={14} aria-hidden /> Avisar no WhatsApp
                      </a>{" · "}<a href={`#ag-${a.id}`}>ver horário</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        <details className="bloquear-horario">
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

      {agenda.length === 0 && <p>Nenhum agendamento neste dia.</p>}
      <p><Link className="botao" href={`/b/${barbearia.slug}/agendar`}><CalendarPlus size={18} aria-hidden /> Marcar horário pra um cliente</Link></p>
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
            <br />
            {a.clienteNome}
          </div>
          {a.status === "confirmado" && (
            <div className="acoes">
              <a className="botao-sec" target="_blank" rel="noopener noreferrer"
                href={linkWhatsapp(a.clienteTelefone, mensagemConfirmacao({ barbearia: barbearia.nome, cliente: a.clienteNome, servico: a.servico, profissional: a.profissional, inicio: a.inicio }))}>
                <MessageCircle size={16} aria-hidden /> Confirmar no WhatsApp
              </a>
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
              Cancelado. Avise {a.clienteNome.split(" ")[0]} pra não vir à toa:{" "}
              <a target="_blank" rel="noopener noreferrer" href={linkWhatsapp(a.clienteTelefone,
                `Olá, ${a.clienteNome.split(" ")[0]}! Aqui é da ${barbearia.nome}. Precisamos cancelar seu horário de ${a.servico}, ${formatarData(a.inicio.slice(0, 10))} às ${a.inicio.slice(11, 16)}. Desculpe! Pra marcar outro: ${linkPublico}`)}>
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
