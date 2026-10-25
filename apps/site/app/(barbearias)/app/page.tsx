import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agoraNoFuso, dataValida, formatarData, somarDias } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { MessageCircle } from "lucide-react";
import { encerrarSessaoAgenda, exigirAcessoAtivo, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { avisoDeTeste, chavesAviso, mensagemConfirmacao } from "@/lib/avisos";
import { AvisosCelular } from "@/componentes/barbearia/AvisosCelular";
import { situacaoAgora } from "@/lib/barbearias";

export const metadata = { title: "Minha agenda", robots: { index: false } };
export const dynamic = "force-dynamic";

async function cancelar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  obterAgenda().cancelar(barbearia.id, Number(form.get("id")));
  revalidatePath("/app");
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

export default async function Painel({ searchParams }: { searchParams: Promise<{ data?: string; novo?: string }> }) {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  const sp = await searchParams;
  const hoje = agoraNoFuso(barbearia.fuso).slice(0, 10);
  const data = sp.data && dataValida(sp.data) ? sp.data : hoje;
  const agenda = obterAgenda().agendamentosDoDia(barbearia.id, data);
  const linkPublico = `${process.env.SITE_URL ?? ""}/b/${barbearia.slug}`;
  const diasRestantes = obterAgenda().diasRestantes(barbearia);

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

      <nav className="navegacao">
        <Link href={`/app?data=${somarDias(data, -1)}`}>← dia anterior</Link>
        <strong>{data === hoje ? "Hoje — " : ""}{formatarData(data)}</strong>
        <Link href={`/app?data=${somarDias(data, 1)}`}>próximo dia →</Link>
      </nav>

      {agenda.length === 0 && <p>Nenhum agendamento neste dia.</p>}
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
              <form action={cancelar}>
                <input type="hidden" name="id" value={a.id} />
                <button className="botao-sec">Cancelar</button>
              </form>
            </div>
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
