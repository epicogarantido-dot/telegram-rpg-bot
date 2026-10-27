import Link from "next/link";
import { config } from "@/lib/painel";

export const metadata = { title: "Bem-vindo!" };
// O link do grupo vem do ambiente em tempo de execução, não do build.
export const dynamic = "force-dynamic";

export default function Obrigado() {
  return (
    <section className="heroi">
      <h1>Tudo certo! 🎉</h1>
      <p>Entre agora na comunidade pelo botão abaixo.</p>
      <p><a className="botao" href={config.linkComunidade} target="_blank" rel="noopener noreferrer">Entrar no grupo do WhatsApp</a></p>
      <p className="suave">Enquanto isso: <a href="/montar">veja o site da sua barbearia pronto</a> ou comece um dos <Link href="/barbeiros#cursos-titulo">cursos pra barbeiros</Link>.</p>
    </section>
  );
}
