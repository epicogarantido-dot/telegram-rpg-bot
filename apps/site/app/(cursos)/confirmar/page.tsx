import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { AguardarConfirmacao } from "@/componentes/AguardarConfirmacao";
import { CopiarCodigo } from "@/componentes/CopiarCodigo";
import {
  apagarDesafio, gravarSessaoMembro, lerDesafio, mensagemMembro, obterMembros, tirarVolta, whatsappBot,
} from "@/lib/membros";

export const metadata = { title: "Confirmar WhatsApp", robots: { index: false } };
export const dynamic = "force-dynamic";

async function concluir() {
  "use server";
  const desafio = await lerDesafio();
  const s = obterMembros().statusDoDesafio(desafio);
  if (s?.finalidade === "senha") redirect("/esqueci/nova-senha");
  let token: string;
  try {
    token = obterMembros().concluirCadastro(desafio);
  } catch (e) {
    redirect(`/confirmar?erro=${encodeURIComponent(mensagemMembro(e))}`);
  }
  await apagarDesafio();
  await gravarSessaoMembro(token);
  redirect((await tirarVolta()) ?? "/minha-area?bemvindo=1");
}

export default async function Confirmar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const s = obterMembros().statusDoDesafio(await lerDesafio());
  if (!s) {
    return (
      <div className="caixa-auth">
        <h1>Código expirado</h1>
        <p>Os códigos valem 15 minutos. <Link href="/entrar">Entre de novo</Link> pra gerar outro.</p>
      </div>
    );
  }
  const texto = `Meu código: ${s.codigo}`;
  const final = s.telefone.slice(-4);
  return (
    <div className="caixa-auth confirmar">
      <h1>Falta um toque</h1>
      <p className="suave">
        Toque no botão: o WhatsApp abre com a mensagem pronta. É só apertar <strong>enviar</strong>, do
        seu número terminado em {final}.
      </p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      {whatsappBot ? (
        <a className="botao botao-whats" href={`https://wa.me/${whatsappBot}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={22} aria-hidden /> Confirmar pelo WhatsApp
        </a>
      ) : (
        <p className="erro">WhatsApp de confirmação não configurado (BOT_WHATSAPP). Avise o suporte.</p>
      )}
      <AguardarConfirmacao formId="concluir" />
      <form id="concluir" action={concluir} hidden>
        <button type="submit">Continuar</button>
      </form>
      <details className="confirmar-ajuda">
        <summary>O WhatsApp não abriu?</summary>
        <p>Mande este código {whatsappBot && <>pro número <strong>+{whatsappBot}</strong></>}, do seu WhatsApp terminado em {final}:</p>
        <CopiarCodigo codigo={s.codigo} />
        <button type="submit" form="concluir" className="botao-sec">Já enviei, continuar</button>
      </details>
      <p className="suave pequeno">O código vale 15 minutos. <Link href="/entrar">Gerar outro</Link>.</p>
    </div>
  );
}
