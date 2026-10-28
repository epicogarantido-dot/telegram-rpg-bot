import { redirect } from "next/navigation";
import { gravarSessao, senhaConfere } from "@/lib/painel";
import { soEntrega } from "@/lib/modo";
import { ipDaRequisicao, mensagemMembro, obterMembros } from "@/lib/membros";

// O SaaS e o site de leads mostram coisas diferentes (MODO_SITE só existe no servidor rodando).
export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar", robots: { index: false } };

async function entrar(form: FormData) {
  "use server";
  try {
    // Mesmo limite por IP das telas públicas: sem isso dava pra chutar a senha do admin à vontade.
    obterMembros().checarIp(`admin:${await ipDaRequisicao()}`);
  } catch (e) {
    redirect(`/painel/entrar?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  if (!senhaConfere(String(form.get("senha") ?? ""))) redirect("/painel/entrar?erro=1");
  await gravarSessao();
  // No SaaS o painel do admin é só o das assinaturas.
  redirect(soEntrega() ? "/painel/assinaturas" : "/painel");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <h1>Painel</h1>
      {!process.env.PAINEL_SENHA && <p>Defina PAINEL_SENHA no ambiente para ativar o painel.</p>}
      {erro && <p className="erro">{erro === "1" ? "Senha incorreta." : erro}</p>}
      <form action={entrar} className="busca">
        <input type="password" name="senha" placeholder="Senha" aria-label="Senha" required />
        <button type="submit">Entrar</button>
      </form>
    </>
  );
}
