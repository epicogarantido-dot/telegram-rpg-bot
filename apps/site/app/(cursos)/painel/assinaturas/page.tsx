import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatarData } from "@aprenda/agenda";
import { mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { exigirLogin } from "@/lib/painel";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { urlDoSite } from "@/lib/membros";
import { criarSitesDeExemplo, sitesDeExemplo } from "@/lib/exemplos";
import { avisarPagamento } from "@/lib/avisos";
import { TEMAS } from "@aprenda/agenda";

export const metadata = { title: "Assinaturas", robots: { index: false } };
export const dynamic = "force-dynamic";

async function decidir(form: FormData) {
  "use server";
  await exigirLogin();
  const id = Number(form.get("id"));
  const banco = obterAgenda();
  const confirmado = form.get("acao") === "confirmar";
  const p = banco.pagamento(id);
  const antes = p && banco.barbeariaPorId(p.barbeariaId);
  try {
    if (confirmado) banco.confirmarPagamento(id);
    else banco.recusarPagamento(id);
  } catch (e) {
    redirect(`/painel/assinaturas?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  // Avisa no celular do barbeiro (se ele ligou os avisos): site no ar, renovação ou Pix não achado.
  if (p && antes) {
    const depois = banco.barbeariaPorId(p.barbeariaId);
    await avisarPagamento(p.barbeariaId, { confirmado, publicou: antes.emMontagem, ate: depois?.acessoAte, nome: antes.nome });
  }
  revalidatePath("/painel/assinaturas");
}

async function bloquear(form: FormData) {
  "use server";
  await exigirLogin();
  obterAgenda().bloquear(Number(form.get("id")));
  revalidatePath("/painel/assinaturas");
}

/**
 * Barbeiro esqueceu a senha: gera um link de troca (24 h, uso único) e abre o SEU WhatsApp
 * com a mensagem pronta pro número da barbearia. Quem envia é você.
 */
async function linkDeSenha(form: FormData) {
  "use server";
  await exigirLogin();
  const banco = obterAgenda();
  const b = banco.barbeariaPorId(Number(form.get("id")));
  const usuario = b && banco.usuariosDaBarbearia(b.id)[0];
  if (!b || !usuario) redirect(`/painel/assinaturas?erro=${encodeURIComponent("Barbearia sem conta de acesso.")}`);
  const link = `${urlDoSite()}/app/senha/${banco.criarLinkDeSenha(usuario.id)}`;
  const texto = `Oi, ${usuario.nome.split(" ")[0]}! Aqui está o link pra criar uma senha nova na agenda da ${b.nome}. Ele vale por 24 horas e funciona uma vez:\n\n${link}`;
  redirect(linkWhatsapp(b.telefone, texto));
}

/** Cria os 6 sites de exemplo (um por estilo) que faltarem. */
async function criarExemplos() {
  "use server";
  await exigirLogin();
  await criarSitesDeExemplo();
  revalidatePath("/painel/assinaturas");
  revalidatePath("/");
}

export default async function Assinaturas({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await exigirLogin();
  const { erro } = await searchParams;
  const banco = obterAgenda();
  const pendentes = banco.pagamentosPendentes();
  const barbearias = banco.todasBarbearias();

  return (
    <>
      <p><Link href="/painel">Leads</Link> · <a href="/painel/divulgacao">Divulgação</a> · <strong>Assinaturas</strong> · <a href="/painel/backup">Baixar backup</a></p>
      <h1>Assinaturas</h1>
      {erro && <p className="erro">{erro}</p>}

      <h2>Pagamentos a conferir ({pendentes.filter((p) => p.status === "informado").length})</h2>
      <p><small>Confira no extrato do banco se o Pix com o valor e o identificador caiu antes de confirmar.</small></p>
      {pendentes.length === 0 && <p>Nada pendente.</p>}
      {pendentes.map((p) => (
        <div key={p.id} className="cartao lead">
          <div>
            <span className="etiqueta">{p.comprovante ? "mandou comprovante" : p.status === "informado" ? "disse que pagou" : "QR gerado"}</span>{" "}
            <strong>{p.barbearia}</strong> · {reais(p.valorCentavos)} · {p.dias} dias
            <br />
            <small>Identificador <code>{p.txid}</code> · pagador: {p.pagador ?? "-"} · {p.criadoEm.slice(0, 16).replace("T", " ")}</small>
            {p.comprovante ? (
              <div className="comprovante">
                <a href={`/painel/comprovante/${p.comprovante}`} target="_blank" rel="noopener noreferrer">
                  {p.comprovante.endsWith(".pdf")
                    ? "Abrir o comprovante (PDF)"
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={`/painel/comprovante/${p.comprovante}`} alt={`Comprovante de ${p.barbearia}`} loading="lazy" />}
                </a>
              </div>
            ) : p.status === "informado" && <p><small>Sem comprovante: confira só pelo extrato.</small></p>}
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

      <h2>Sites de exemplo</h2>
      <p><small>Um por estilo, pra mostrar um site de verdade na conversa. Sem login (ninguém mexe), a marcação não grava e o topo avisa que é exemplo. Aparecem nos carrosséis de estilos.</small></p>
      {(() => {
        const exemplos = sitesDeExemplo();
        const faltam = TEMAS.filter((t) => !exemplos[t.id]).length;
        return (
          <>
            <ul>
              {TEMAS.filter((t) => exemplos[t.id]).map((t) => (
                <li key={t.id}>{t.nome}: <a href={`/b/${exemplos[t.id]}`} target="_blank" rel="noopener noreferrer">/b/{exemplos[t.id]}</a></li>
              ))}
            </ul>
            {faltam > 0 && (
              <form action={criarExemplos}>
                <button className="botao">Criar {faltam === TEMAS.length ? "os" : "os que faltam:"} {faltam} sites de exemplo</button>
              </form>
            )}
          </>
        );
      })()}

      <h2>Barbearias ({barbearias.length})</h2>
      {barbearias.map((b) => {
        const ativo = banco.acessoAtivo(b);
        return (
          <div key={b.id} className="item-config">
            <span>
              {ativo ? "🟢" : "🔴"} <a href={`/b/${b.slug}`} target="_blank" rel="noopener noreferrer">{b.nome}</a> · {b.email} ·{" "}
              {b.emMontagem ? (ativo ? `montando o site até ${formatarData(b.acessoAte)} (ainda não publicado)` : `não pagou; prazo de montagem acabou em ${formatarData(b.acessoAte)}`) : ativo ? `até ${formatarData(b.acessoAte)}` : `bloqueada desde ${formatarData(b.acessoAte)}`}
            </span>
            <span className="acoes">
              <form action={linkDeSenha}>
                <input type="hidden" name="id" value={b.id} />
                <button className="botao-sec">Link de nova senha</button>
              </form>
              {ativo && (
                <form action={bloquear}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="botao-sec">Bloquear agora</button>
                </form>
              )}
            </span>
          </div>
        );
      })}
    </>
  );
}
