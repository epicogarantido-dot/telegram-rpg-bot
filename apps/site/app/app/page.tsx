import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agoraNoFuso, dataValida, formatarData, somarDias } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { encerrarSessaoAgenda, exigirAcessoAtivo, obterAgenda } from "../../lib/agenda";

export const metadata = { title: "Minha agenda", robots: { index: false } };
export const dynamic = "force-dynamic";

async function cancelar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  obterAgenda().cancelar(barbearia.id, Number(form.get("id")));
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
        Link de agendamento: <a href={`/b/${barbearia.slug}`} target="_blank" rel="noopener noreferrer">{linkPublico}</a>
        {" · "}<Link href="/app/config">Configurações</Link>
        {" · "}<Link href="/app/assinatura">Assinatura</Link>
      </p>

      <nav className="navegacao">
        <Link href={`/app?data=${somarDias(data, -1)}`}>← dia anterior</Link>
        <strong>{data === hoje ? "Hoje — " : ""}{formatarData(data)}</strong>
        <Link href={`/app?data=${somarDias(data, 1)}`}>próximo dia →</Link>
      </nav>

      {agenda.length === 0 && <p>Nenhum agendamento neste dia.</p>}
      {agenda.map((a) => (
        <div key={a.id} className={`cartao lead ${a.status === "cancelado" ? "cancelado" : ""}`}>
          <div>
            <strong>{a.inicio.slice(11)}–{a.fim.slice(11)}</strong> · {a.servico} com {a.profissional}
            {a.status === "cancelado" && <span className="etiqueta" style={{ marginLeft: 8 }}>cancelado</span>}
            <br />
            {a.clienteNome} ·{" "}
            <a href={linkWhatsapp(a.clienteTelefone, `Olá, ${a.clienteNome}! Aqui é da ${barbearia.nome}, sobre seu horário de ${formatarData(data)} às ${a.inicio.slice(11)}.`)}
              target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
          {a.status === "confirmado" && (
            <form action={cancelar} className="acoes">
              <input type="hidden" name="id" value={a.id} />
              <button className="botao-sec">Cancelar</button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}
