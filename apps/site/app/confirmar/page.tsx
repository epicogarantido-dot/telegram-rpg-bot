import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { AguardarConfirmacao } from "../../componentes/AguardarConfirmacao";
import { CopiarCodigo } from "../../componentes/CopiarCodigo";
import {
  apagarDesafio, gravarSessaoMembro, lerDesafio, mensagemMembro, obterMembros, whatsappBot,
} from "../../lib/membros";

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
  redirect("/minha-area?bemvindo=1");
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
    <div className="caixa-auth">
      <h1>Confirme seu WhatsApp</h1>
      <p className="suave">
        Mande o código abaixo pro nosso WhatsApp <strong>a partir do número terminado em {final}</strong>.
        Assim temos certeza de que o número é seu.
      </p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <CopiarCodigo codigo={s.codigo} />
      {whatsappBot ? (
        <a className="botao botao-whats" href={`https://wa.me/${whatsappBot}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={20} aria-hidden /> Abrir WhatsApp e enviar
        </a>
      ) : (
        <p className="erro">WhatsApp de confirmação não configurado (BOT_WHATSAPP). Avise o suporte.</p>
      )}
      <AguardarConfirmacao formId="concluir" />
      <form id="concluir" action={concluir}>
        <button type="submit" className="botao-sec">Já enviei, continuar</button>
      </form>
      <p className="suave pequeno">Não recebeu resposta? O código vale 15 minutos. <Link href="/entrar">Gerar outro</Link>.</p>
    </div>
  );
}
