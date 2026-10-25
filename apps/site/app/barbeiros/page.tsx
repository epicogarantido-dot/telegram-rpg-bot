import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck, GraduationCap, MessagesSquare, Scissors } from "lucide-react";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { obterBanco } from "../../lib/painel";

export const metadata = {
  title: "Comunidade para barbeiros",
  description: "Comunidade gratuita para barbeiros: dicas para lotar a agenda, cursos gratuitos e app de agendamento.",
};

async function inscrever(form: FormData) {
  "use server";
  const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
  const nome = String(form.get("nome") ?? "").trim();
  if (!telefone || !nome || form.get("consentimento") !== "sim") redirect("/barbeiros?erro=1#inscricao");
  obterBanco().inscrever({
    nome: nome.slice(0, 100),
    telefone,
    negocio: String(form.get("negocio") ?? "").slice(0, 100) || undefined,
    cidade: String(form.get("cidade") ?? "").slice(0, 100) || undefined,
    interesse: String(form.get("interesse") ?? "comunidade"),
  });
  redirect("/barbeiros/obrigado");
}

export default async function Barbeiros({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <section className="heroi">
        <span className="selo"><Scissors className="icone" aria-hidden /> Grátis para barbeiros</span>
        <h1>Agenda cheia, <em>cadeira girando.</em></h1>
        <p>
          Uma comunidade no WhatsApp só de barbeiros: dicas para atrair e fidelizar clientes, cursos gratuitos
          de gestão e marketing, e acesso antecipado ao nosso app de agendamento online.
        </p>
      </section>

      <div className="grade">
        <div className="cartao">
          <span className="chip-icone"><MessagesSquare size={20} aria-hidden /></span>
          <h3>Comunidade</h3><p>Troque experiência com barbeiros do Brasil todo. Sem spam, sem corrente.</p>
        </div>
        <div className="cartao">
          <span className="chip-icone acento"><GraduationCap size={20} aria-hidden /></span>
          <h3>Cursos gratuitos</h3><p>Gestão, redes sociais, atendimento e precificação, em português.</p>
        </div>
        <a href="/app/cadastro" className="cartao">
          <span className="chip-icone"><CalendarCheck size={20} aria-hidden /></span>
          <h3>Agendamento online</h3>
          <p>Seu cliente marca horário pelo link, você vê a agenda no celular. Teste grátis.</p>
          <div className="rodape-cartao"><span style={{ color: "var(--destaque)", fontWeight: 600 }}>Criar minha agenda <ArrowRight className="icone" aria-hidden /></span></div>
        </a>
      </div>

      <h2 id="inscricao">Quero participar</h2>
      {erro && <p style={{ color: "crimson" }}>Preencha nome, WhatsApp e marque a autorização.</p>}
      <form action={inscrever} className="formulario">
        <input name="nome" placeholder="Seu nome" required maxLength={100} />
        <input name="telefone" placeholder="WhatsApp com DDD" required inputMode="tel" />
        <input name="negocio" placeholder="Nome da barbearia (opcional)" maxLength={100} />
        <input name="cidade" placeholder="Cidade (opcional)" maxLength={100} />
        <select name="interesse" defaultValue="ambos">
          <option value="ambos">Comunidade + app de agendamento</option>
          <option value="comunidade">Só a comunidade</option>
          <option value="agendamento">Só o app de agendamento</option>
        </select>
        <label>
          <input type="checkbox" name="consentimento" value="sim" required /> Autorizo receber mensagens pelo
          WhatsApp sobre a comunidade e o app. Posso sair quando quiser respondendo SAIR.
        </label>
        <button type="submit">Quero entrar</button>
      </form>
    </>
  );
}
