import Link from "next/link";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { CalendarDays } from "lucide-react";
import { BotaoCopiar } from "@/componentes/BotaoCopiar";
import { exigirAcessoAtivo, obterAgenda } from "@/lib/agenda";

export const metadata = { title: "Agenda no celular", robots: { index: false } };
export const dynamic = "force-dynamic";

async function trocarLink(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const p = String(form.get("profissional") ?? "");
  obterAgenda().tokenAgenda(barbearia.id, p ? Number(p) : undefined, true);
  revalidatePath("/app/calendario");
}

/** Endereço público do site: SITE_URL ou o host da própria requisição. */
async function enderecoDoSite(): Promise<string> {
  if (process.env.SITE_URL?.startsWith("http")) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export default async function Calendario() {
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const site = await enderecoDoSite();
  const host = site.replace(/^https?:\/\//, "");
  const agendas = [
    { titulo: "Agenda da barbearia", dica: "Todos os horários, de todos os profissionais.", profissional: undefined as number | undefined },
    ...banco.profissionais(barbearia.id, true).map((p) => ({ titulo: `Agenda de ${p.nome.split(" ")[0]}`, dica: `Só os horários com ${p.nome}. Mande este link pra ${p.nome.split(" ")[0]} assinar no próprio celular.`, profissional: p.id })),
  ].map((a) => {
    const token = banco.tokenAgenda(barbearia.id, a.profissional);
    const https = `${site}/agenda/${token}.ics`;
    const webcal = `webcal://${host}/agenda/${token}.ics`;
    return { ...a, https, webcal, google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}` };
  });

  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Agenda no celular</h1>
      <p className="suave">
        Seus horários aparecem no calendário do celular, junto com o resto da sua vida, com lembrete 15 minutos antes de cada cliente.
        Cada horário traz o nome do cliente e um link pra confirmar com ele no WhatsApp. Assine uma vez; horário novo aparece e cancelado some sozinho.
      </p>

      {agendas.map((a) => (
        <section key={a.titulo} className="cartao calendario-item">
          <h2><CalendarDays size={20} aria-hidden /> {a.titulo}</h2>
          <p>{a.dica}</p>
          <div className="acoes">
            <a className="botao" href={a.webcal}>Adicionar no iPhone</a>
            <a className="botao-sec" href={a.google} target="_blank" rel="noopener noreferrer">Adicionar no Google Agenda</a>
            <BotaoCopiar texto={a.https} />
          </div>
          <details>
            <summary>O link vazou?</summary>
            <form action={trocarLink}>
              <input type="hidden" name="profissional" value={a.profissional ?? ""} />
              <p className="suave pequeno">Gera um link novo e o antigo para de funcionar. Quem já assinou vai precisar assinar de novo.</p>
              <button className="botao-sec">Trocar este link</button>
            </form>
          </details>
        </section>
      ))}

      <h2>Pra receber os lembretes</h2>
      <ul className="lista-dicas">
        <li><strong>iPhone:</strong> na tela de assinar, deixe <em>Remover Alertas</em> desligado. Assim o iPhone avisa 15 minutos antes.</li>
        <li><strong>Google Agenda:</strong> o Google não usa o lembrete do link. Abra a agenda nova nas configurações do Google Agenda, em <em>Notificações</em>, e adicione &quot;15 minutos antes&quot;.</li>
        <li><strong>Horário novo na hora:</strong> o calendário do celular atualiza de tempos em tempos (o Google pode levar algumas horas). Pra saber no mesmo minuto, ligue os <Link href="/app">avisos do painel</Link>.</li>
      </ul>
      <p className="suave pequeno">Não publique esses links: eles mostram o nome e o WhatsApp dos seus clientes.</p>
    </>
  );
}
