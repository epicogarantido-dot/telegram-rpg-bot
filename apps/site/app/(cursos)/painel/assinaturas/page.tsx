import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatarData } from "@aprenda/agenda";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { exigirLogin } from "@/lib/painel";

export const metadata = { title: "Assinaturas", robots: { index: false } };
export const dynamic = "force-dynamic";

async function decidir(form: FormData) {
  "use server";
  await exigirLogin();
  const id = Number(form.get("id"));
  try {
    if (form.get("acao") === "confirmar") obterAgenda().confirmarPagamento(id);
    else obterAgenda().recusarPagamento(id);
  } catch (e) {
    redirect(`/painel/assinaturas?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/painel/assinaturas");
}

async function bloquear(form: FormData) {
  "use server";
  await exigirLogin();
  obterAgenda().bloquear(Number(form.get("id")));
  revalidatePath("/painel/assinaturas");
}

export default async function Assinaturas({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await exigirLogin();
  const { erro } = await searchParams;
  const banco = obterAgenda();
  const pendentes = banco.pagamentosPendentes();
  const barbearias = banco.todasBarbearias();

  return (
    <>
      <p><Link href="/painel">Leads</Link> · <strong>Assinaturas</strong> · <a href="/painel/backup">Baixar backup</a></p>
      <h1>Assinaturas</h1>
      {erro && <p className="erro">{erro}</p>}

      <h2>Pagamentos a conferir ({pendentes.filter((p) => p.status === "informado").length})</h2>
      <p><small>Confira no extrato do banco se o Pix com o valor e o identificador caiu antes de confirmar.</small></p>
      {pendentes.length === 0 && <p>Nada pendente.</p>}
      {pendentes.map((p) => (
        <div key={p.id} className="cartao lead">
          <div>
            <span className="etiqueta">{p.status === "informado" ? "disse que pagou" : "QR gerado"}</span>{" "}
            <strong>{p.barbearia}</strong> · {reais(p.valorCentavos)} · {p.dias} dias
            <br />
            <small>Identificador <code>{p.txid}</code> · pagador: {p.pagador ?? "-"} · {p.criadoEm.slice(0, 16).replace("T", " ")}</small>
          </div>
          <div className="acoes">
            <form action={decidir}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="acao" value="confirmar" />
              <button className="botao">Confirmar e liberar</button>
            </form>
            <form action={decidir}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="acao" value="recusar" />
              <button className="botao-sec">Recusar</button>
            </form>
          </div>
        </div>
      ))}

      <h2>Barbearias ({barbearias.length})</h2>
      {barbearias.map((b) => {
        const ativo = banco.acessoAtivo(b);
        return (
          <div key={b.id} className="item-config">
            <span>
              {ativo ? "🟢" : "🔴"} <a href={`/b/${b.slug}`} target="_blank" rel="noopener noreferrer">{b.nome}</a> · {b.email} ·{" "}
              {ativo ? `até ${formatarData(b.acessoAte)}` : `bloqueada desde ${formatarData(b.acessoAte)}`}
            </span>
            {ativo && (
              <form action={bloquear}>
                <input type="hidden" name="id" value={b.id} />
                <button className="botao-sec">Bloquear agora</button>
              </form>
            )}
          </div>
        );
      })}
    </>
  );
}
