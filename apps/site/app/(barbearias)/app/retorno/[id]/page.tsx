import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agoraNoFuso, dataValida, formatarData, somarDias } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { CalendarCheck, MessageCircle } from "lucide-react";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { urlAbsoluta } from "@/lib/barbearias";
import { mensagemRetorno } from "@/lib/pos-atendimento";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";

export const metadata = { title: "Marcar o próximo", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * "Marcar o próximo": o barbeiro, com o cliente ainda na cadeira, marca a volta dele no
 * mesmo serviço. A data sugerida vem do ritmo do cliente (ou do retorno padrão).
 */
async function marcar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const origem = banco.agendamento(barbearia.id, Number(form.get("origem")));
  if (!origem) notFound();
  const data = String(form.get("data"));
  let novo: number;
  try {
    novo = banco.agendar({
      barbeariaId: barbearia.id, profissionalId: Number(form.get("profissional")), servicoId: origem.servicoId,
      data, hora: String(form.get("hora")), clienteNome: origem.clienteNome, clienteTelefone: origem.clienteTelefone,
      peloBarbeiro: true, enderecoCliente: origem.enderecoCliente,
    });
  } catch (e) {
    redirect(`/app/retorno/${origem.id}?data=${encodeURIComponent(data)}&erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/app");
  redirect(`/app/retorno/${origem.id}?marcado=${novo}`);
}

/** Gera o link secreto do novo horário e abre o WhatsApp do barbeiro com a mensagem pronta. */
async function avisar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const a = banco.agendamento(barbearia.id, Number(form.get("id")));
  if (!a || a.status !== "confirmado") redirect("/app");
  const token = banco.criarLinkCliente(barbearia.id, a.id);
  redirect(linkWhatsapp(a.clienteTelefone, mensagemRetorno({
    barbearia: barbearia.nome, cliente: a.clienteNome, servico: a.servico, inicio: a.inicio,
    link: urlAbsoluta(`/b/${barbearia.slug}/h/${token}`),
  })));
}

export default async function Retorno({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ data?: string; prof?: string; erro?: string; marcado?: string }>;
}) {
  const { barbearia } = await exigirAcessoAtivo();
  const { id } = await params;
  const sp = await searchParams;
  const banco = obterAgenda();
  const origem = banco.agendamento(barbearia.id, Number(id));
  if (!origem) notFound();
  const nome = origem.clienteNome.split(" ")[0];

  if (sp.marcado) {
    const novo = banco.agendamento(barbearia.id, Number(sp.marcado));
    if (!novo || novo.clienteTelefone !== origem.clienteTelefone) notFound();
    return (
      <>
        <p><Link href="/app">← Voltar pra agenda</Link></p>
        <h1><CalendarCheck size={26} aria-hidden /> Marcado!</h1>
        <p>{novo.clienteNome} volta {formatarData(novo.inicio.slice(0, 10))} às {novo.inicio.slice(11, 16)} ({novo.servico} com {novo.profissional}).</p>
        <form action={avisar}>
          <input type="hidden" name="id" value={novo.id} />
          <BotaoEnviar className="botao"><MessageCircle size={18} aria-hidden /> Mandar pro {nome} no WhatsApp</BotaoEnviar>
        </form>
        <p className="suave pequeno">A mensagem leva o link dele pra ver, pôr na agenda do celular, remarcar ou cancelar.</p>
      </>
    );
  }

  const sugestao = banco.sugestaoDeRetorno(barbearia.id, origem.clienteTelefone);
  const hoje = agoraNoFuso(barbearia.fuso).slice(0, 10);
  const data = sp.data && dataValida(sp.data) && sp.data > hoje ? sp.data : sugestao.data;
  const profissionais = banco.profissionais(barbearia.id, true);
  const profId = profissionais.some((p) => String(p.id) === sp.prof) ? Number(sp.prof)
    : profissionais.some((p) => p.id === origem.profissionalId) ? origem.profissionalId : profissionais[0]?.id;
  const livres = profId ? banco.horariosLivres(barbearia.id, profId, origem.servicoId, data) : [];
  const ir = (d: string) => `/app/retorno/${origem.id}?data=${d}${profId ? `&prof=${profId}` : ""}`;
  const jaTem = banco.proximoDoCliente(barbearia.id, origem.clienteTelefone);

  return (
    <>
      <p><Link href={`/app?data=${origem.inicio.slice(0, 10)}`}>← Voltar pra agenda</Link></p>
      <h1>Marcar o próximo de {nome}</h1>
      <p>
        {origem.servico} · {sugestao.deHistorico
          ? `${nome} costuma voltar a cada ${sugestao.ritmoDias} dias.`
          : `Sem histórico ainda: sugestão de ${sugestao.ritmoDias} dias (muda em Configurações).`}
      </p>
      {jaTem && <p className="atribuicao">{nome} já tem horário marcado: {formatarData(jaTem.slice(0, 10))} às {jaTem.slice(11, 16)}.</p>}
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}

      <nav className="navegacao">
        {data > somarDias(hoje, 1) ? <Link href={ir(somarDias(data, -1))}>← dia anterior</Link> : <span />}
        <strong>{formatarData(data)}{data === sugestao.data ? " (sugerido)" : ""}</strong>
        <Link href={ir(somarDias(data, 1))}>próximo dia →</Link>
      </nav>

      <form method="get" className="formulario linha">
        <label>Outro dia<input type="date" name="data" defaultValue={data} min={somarDias(hoje, 1)} /></label>
        {profissionais.length > 1 && (
          <label>Com
            <select name="prof" defaultValue={profId}>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
        )}
        <button className="botao-sec">Ver horários</button>
      </form>

      {livres.length === 0
        ? <p>Sem horário livre nesse dia. <Link href={ir(somarDias(data, 1))}>Ver o dia seguinte</Link></p>
        : (
          <ul className="horarios-retorno">
            {livres.map((h) => (
              <li key={h}>
                <form action={marcar}>
                  <input type="hidden" name="origem" value={origem.id} />
                  <input type="hidden" name="data" value={data} />
                  <input type="hidden" name="hora" value={h} />
                  <input type="hidden" name="profissional" value={profId} />
                  <BotaoEnviar className="botao-sec" carregando="Marcando…">{h}</BotaoEnviar>
                </form>
              </li>
            ))}
          </ul>
        )}
    </>
  );
}
