import Link from "next/link";
import { Lock, MessageCircle } from "lucide-react";

/**
 * O que aparece no lugar da lição pra quem não entrou. A primeira lição de cada curso é aberta;
 * as outras pedem conta (grátis, confirmada pelo WhatsApp). Depois de entrar, volta pra cá.
 */
export function LicaoTrancada({ caminho, primeira, totalLicoes }: { caminho: string; primeira: string; totalLicoes: number }) {
  const voltar = encodeURIComponent(caminho);
  return (
    <section className="licao-trancada" aria-labelledby="trancada-titulo">
      <p className="licao-trancada-icone" aria-hidden><Lock size={22} /></p>
      <h2 id="trancada-titulo">Essa lição é pra quem tem conta</h2>
      <p className="suave">
        A conta é grátis e leva um minuto: seu login é o seu WhatsApp. Com ela você libera as {totalLicoes} lições
        do curso e o site guarda onde você parou.
      </p>
      <div className="acoes">
        <Link href={`/cadastro?voltar=${voltar}`} className="botao"><MessageCircle size={18} aria-hidden /> Criar conta grátis</Link>
        <Link href={`/entrar?voltar=${voltar}`} className="botao-sec">Já tenho conta</Link>
      </div>
      <p className="suave pequeno">Ainda não sabe se o curso é pra você? <Link href={primeira}>Leia a primeira lição</Link>, ela é aberta.</p>
    </section>
  );
}
