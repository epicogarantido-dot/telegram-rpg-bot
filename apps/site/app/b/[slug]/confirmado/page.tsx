import { notFound } from "next/navigation";
import { dataValida, formatarData } from "@aprenda/agenda";
import { linkWhatsapp } from "@aprenda/prospeccao";
import { obterAgenda } from "../../../../lib/agenda";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agendado!" };

export default async function Confirmado({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ servico?: string; profissional?: string; data?: string; hora?: string }>;
}) {
  const b = obterAgenda().barbeariaPorSlug((await params).slug);
  if (!b) notFound();
  const sp = await searchParams;
  // Só mostra o que veio na URL, cruzado com dados públicos da barbearia:
  // nada aqui expõe agendamentos de outras pessoas.
  const servico = obterAgenda().servicos(b.id).find((s) => String(s.id) === sp.servico);
  const prof = obterAgenda().profissionais(b.id).find((p) => String(p.id) === sp.profissional);
  const quando = sp.data && dataValida(sp.data) && sp.hora ? `${formatarData(sp.data)} às ${sp.hora}` : "";

  return (
    <section className="heroi">
      <h1>Agendado! ✂️</h1>
      <p>{servico?.nome} com {prof?.nome} na {b.nome}<br /><strong>{quando}</strong></p>
      {b.endereco && <p>📍 {b.endereco}</p>}
      <p>
        <a className="botao" target="_blank" rel="noopener noreferrer"
          href={linkWhatsapp(b.telefone, `Olá! Acabei de agendar ${servico?.nome ?? ""} para ${quando}.`)}>
          Falar com a barbearia no WhatsApp
        </a>
      </p>
      <p><small>Precisa remarcar ou cancelar? Fale com a barbearia pelo WhatsApp.</small></p>
    </section>
  );
}
