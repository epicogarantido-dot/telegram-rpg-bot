import Link from "next/link";
import { revalidatePath } from "next/cache";
import { exigirLogin } from "@/lib/painel";
import { mensagemMembro, obterMembros, urlDoSite } from "@/lib/membros";
import { redirect } from "next/navigation";

export const metadata = { title: "Alunos", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Plano B quando o bot está fora do ar: gera o link de entrada aqui e você manda
 * pra pessoa no seu WhatsApp, numa conversa que ela começou.
 */
async function gerarLink(form: FormData) {
  "use server";
  await exigirLogin();
  let link: string;
  try {
    link = `${urlDoSite()}/e/${obterMembros().linkDeEntrada(String(form.get("telefone") ?? "")).token}`;
  } catch (e) {
    redirect(`/painel/alunos?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  revalidatePath("/painel/alunos");
  redirect(`/painel/alunos?link=${encodeURIComponent(link)}`);
}

export default async function Alunos({ searchParams }: { searchParams: Promise<{ link?: string; erro?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const banco = obterMembros();
  const r = banco.resumo();
  const lista = banco.listar();
  return (
    <>
      <p><Link href="/painel">Leads</Link> · <strong>Alunos</strong> · <Link href="/painel/assinaturas">Assinaturas</Link></p>
      <h1>Alunos</h1>
      <p>{r.total} cadastrados · {r.verificados} com WhatsApp confirmado · {r.ultimos7 ?? 0} nos últimos 7 dias</p>
      <p className="suave pequeno">Cada aluno entrou escrevendo pro bot. Quem responder SAIR ao bot sai da lista de contato.</p>
      <details className="bloquear-horario">
        <summary className="botao-sec">Gerar link de entrada (bot fora do ar)</summary>
        <form action={gerarLink} className="formulario">
          <label>WhatsApp da pessoa<input name="telefone" required inputMode="tel" placeholder="(19) 99999-0000" /></label>
          <button type="submit">Gerar link</button>
        </form>
      </details>
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
      {sp.link && (
        <p className="atribuicao" role="status">
          Link pronto (vale uma vez, por 24 h). Mande pra pessoa no seu WhatsApp: <code>{sp.link}</code>
        </p>
      )}
      {lista.map((m) => (
        <div key={m.id} className="item-config">
          <span>
            {m.verificado ? "🟢" : "⚪"} {m.nome} ·{" "}
            <a href={`https://wa.me/${m.telefone}`} target="_blank" rel="noopener noreferrer">{m.telefone}</a> · {m.criadoEm.slice(0, 10)}
          </span>
          <form action={gerarLink}>
            <input type="hidden" name="telefone" value={m.telefone} />
            <button className="botao-sec">Gerar link</button>
          </form>
        </div>
      ))}
    </>
  );
}
