import { Lock } from "lucide-react";
import { EntrarPeloWhatsapp } from "@/componentes/EntrarPeloWhatsapp";

/**
 * O que aparece no lugar da lição pra quem não entrou. Entrar é pelo WhatsApp: um toque
 * abre a conversa com a mensagem pronta, o bot responde com o link e a pessoa volta pra cá.
 */
export function LicaoTrancada({ caminho, totalLicoes }: { caminho: string; totalLicoes: number }) {
  return (
    <section className="licao-trancada" aria-labelledby="trancada-titulo">
      <p className="licao-trancada-icone" aria-hidden><Lock size={22} /></p>
      <h2 id="trancada-titulo">Entre pra ler esta lição</h2>
      <p className="suave">
        É grátis e sem senha: seu WhatsApp é a sua entrada. Você libera as {totalLicoes} lições do curso, todos os
        outros cursos, e o site guarda onde você parou.
      </p>
      <EntrarPeloWhatsapp voltar={caminho} />
      <p className="suave pequeno">O WhatsApp abre com a mensagem pronta. Envie, toque no link que chega e você volta direto pra esta lição.</p>
    </section>
  );
}
