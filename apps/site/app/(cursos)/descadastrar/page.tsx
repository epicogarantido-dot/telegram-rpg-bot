import { redirect } from "next/navigation";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { assinaturaConfere } from "@/lib/emails";
import { obterBanco } from "@/lib/painel";

export const metadata = { title: "Não quero mais receber", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Link "Não quero mais receber" dos convites por e-mail. Pede um toque (leitor de e-mail que abre links sozinho não descadastra ninguém). */
async function sair(formData: FormData) {
  "use server";
  const e = String(formData.get("e") ?? ""), t = String(formData.get("t") ?? "");
  if (!assinaturaConfere(e, t)) redirect("/descadastrar?erro=1");
  obterBanco().sairDoEmail(e);
  redirect("/descadastrar?pronto=1");
}

export default async function Descadastrar({ searchParams }: { searchParams: Promise<{ e?: string; t?: string; pronto?: string; erro?: string }> }) {
  const sp = await searchParams;
  const valido = !!sp.e && !!sp.t && assinaturaConfere(sp.e, sp.t);
  return (
    <section className="heroi">
      <h1>Não quero mais receber</h1>
      {sp.pronto ? (
        <p>Pronto. Esse e-mail saiu da lista e não recebe mais convites nossos.</p>
      ) : valido ? (
        <form action={sair}>
          <p>Tirar <strong>{sp.e}</strong> da lista? Depois disso não mandamos mais nenhum e-mail pra ele.</p>
          <input type="hidden" name="e" value={sp.e} />
          <input type="hidden" name="t" value={sp.t} />
          <BotaoEnviar carregando="Tirando…">Sim, não quero mais receber</BotaoEnviar>
        </form>
      ) : (
        <p>Esse link não está completo. Responda o e-mail com a palavra SAIR que a gente tira você da lista.</p>
      )}
    </section>
  );
}
