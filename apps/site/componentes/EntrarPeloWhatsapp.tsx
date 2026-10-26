import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { guardarVolta, linkWhatsappEntrar } from "@/lib/membros";

/**
 * Guarda a lição que a pessoa queria (pra voltar direto pra ela) e abre o WhatsApp
 * com "Quero entrar no Aprenda Livre" já escrito. O bot responde com o link de entrada.
 */
async function abrirWhatsapp(form: FormData) {
  "use server";
  const destino = linkWhatsappEntrar();
  if (!destino) redirect("/entrar?semBot=1");
  await guardarVolta(form.get("voltar"));
  redirect(destino);
}

export function EntrarPeloWhatsapp({ voltar, texto = "Entrar pelo WhatsApp" }: { voltar?: string; texto?: string }) {
  if (!linkWhatsappEntrar()) {
    return <p className="erro">Entrada pelo WhatsApp não configurada (BOT_WHATSAPP). Avise o suporte.</p>;
  }
  return (
    <form action={abrirWhatsapp} className="entrar-whats">
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <button type="submit" className="botao botao-whats"><MessageCircle size={20} aria-hidden /> {texto}</button>
    </form>
  );
}
