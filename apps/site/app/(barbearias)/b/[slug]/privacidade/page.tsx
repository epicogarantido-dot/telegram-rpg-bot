import Link from "next/link";
import { notFound } from "next/navigation";
import { obterAgenda } from "@/lib/agenda";
import { contatoResponsavel } from "@/lib/contato";
import { mapaEmbutido } from "@/lib/barbearias";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  return { title: b ? `Privacidade · ${b.nome}` : "Barbearia não encontrada" };
}

/**
 * Privacidade do site da barbearia, no visual dela e sem a nossa marca: só o que vale pra quem
 * marca horário (a parte "Se você marcou horário numa barbearia" da /privacidade geral). Se mudar
 * o que o agendamento guarda, atualize aqui e lá.
 */
export default async function PrivacidadeBarbearia({ params }: { params: Promise<{ slug: string }> }) {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  if (!b) notFound();
  const whats = b.telefone ? `https://wa.me/${b.telefone}?text=${encodeURIComponent(`Olá, ${b.nome}! Quero falar sobre os meus dados do agendamento.`)}` : undefined;
  const responsavel = contatoResponsavel();

  return (
    <section className="b-secao b-texto">
      <h1>Privacidade</h1>
      <p>
        Quando você marca um horário pelo site da {b.nome}, ficam guardados o seu nome, o seu WhatsApp, o serviço e o
        horário, e o endereço se o atendimento for na sua casa. A {b.nome} usa esses dados só pra confirmar, lembrar,
        remarcar e atender você.
      </p>
      <p>
        Pra evitar trote, o sistema conta quantos horários cada número e cada aparelho marcam. O aparelho e o IP são
        guardados só como código embaralhado, que não dá pra transformar de volta. Ninguém vende nem passa os seus dados
        pra outras empresas.
      </p>
      {mapaEmbutido(b) && (
        <p>
          O mapa da página vem do Google Maps e é carregado do Google quando você chega nessa parte do site; o Google
          trata essa visita pela política de privacidade dele. O site não manda nenhum dado seu pro mapa.
        </p>
      )}
      <h2>Ver, corrigir ou apagar seus dados</h2>
      <p>
        É só pedir pra barbearia
        {whats ? <>: <a href={whats} target="_blank" rel="noopener noreferrer">falar com a {b.nome} no WhatsApp</a>.</> : "."}
        {" "}Pelo link que você recebeu ao marcar, também dá pra remarcar ou cancelar o horário sozinho.
      </p>
      {responsavel && (
        <p>
          Se a barbearia não resolver, fale com o responsável pelo sistema de agenda:{" "}
          <a href={responsavel.link} target="_blank" rel="noopener noreferrer">{responsavel.texto}</a>.
        </p>
      )}
      <p><Link href={`/b/${b.slug}`}>Voltar pro site da {b.nome}</Link></p>
    </section>
  );
}
