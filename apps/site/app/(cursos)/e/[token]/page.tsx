import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { EnviarSozinho } from "@/componentes/EnviarSozinho";
import { gravarSessaoMembro, ipDaRequisicao, mensagemMembro, obterMembros, tirarVolta } from "@/lib/membros";

/** Link pessoal que o bot manda no WhatsApp: abre o site já logado. */
export const metadata = { title: "Entrando", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export const dynamic = "force-dynamic";

async function entrar(form: FormData) {
  "use server";
  let sessao: string;
  try {
    obterMembros().checarIp(await ipDaRequisicao());
    sessao = obterMembros().entrarComLink(String(form.get("token") ?? ""));
  } catch (e) {
    // Mensagem fixa na tela; o motivo real vai pro log se não for o esperado (usado/vencido).
    mensagemMembro(e);
    redirect("/entrar?expirado=1");
  }
  await gravarSessaoMembro(sessao);
  redirect((await tirarVolta()) ?? "/minha-area?bemvindo=1");
}

export default async function LinkDeEntrada({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="caixa-auth">
      <h1>Entrando…</h1>
      {/* Sem JavaScript, a pessoa toca no botão; com JavaScript, entra sozinha. */}
      <form id="entrar-link" action={entrar}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="botao"><LogIn size={18} aria-hidden /> Entrar no Aprenda Livre</button>
      </form>
      <EnviarSozinho formId="entrar-link" />
    </div>
  );
}
