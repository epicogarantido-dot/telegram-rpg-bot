import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { encerrarSessaoAgenda, exigirBarbeiro, gravarSessaoAgenda, obterAgenda } from "@/lib/agenda";
import { urlFoto } from "@/lib/barbearias";

export const metadata = { title: "Escolha o acesso", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Depois de entrar com a senha do site, cada um escolhe quem é: o dono (tudo) ou um profissional
 * (só a agenda dele). Sem senha por pessoa: trocar de acesso é voltar aqui.
 */
async function escolher(form: FormData) {
  "use server";
  const { barbearia } = await exigirBarbeiro();
  const banco = obterAgenda();
  const quem = String(form.get("quem") ?? "");
  const token = quem === "dono" ? banco.sessaoDoDono(barbearia.id) : banco.sessaoDoProfissional(barbearia.id, Number(quem));
  // Troca a sessão: a anterior sai, a nova entra.
  await encerrarSessaoAgenda();
  await gravarSessaoAgenda(token);
  redirect("/app");
}

export default async function Acesso() {
  const { barbearia, usuario } = await exigirBarbeiro();
  const banco = obterAgenda();
  const profissionais = banco.profissionais(barbearia.id, true);
  if (profissionais.length < 2 && !usuario.profissionalId) redirect("/app");
  const fotos = new Map(banco.fotos(barbearia.id, "equipe").map((f) => [f.arquivo, f]));

  return (
    <section className="acesso">
      <h1>Quem vai usar agora?</h1>
      <p className="suave">O dono vê tudo. Cada barbeiro vê só a agenda dele: os horários, confirmar no WhatsApp e marcar os clientes dele.</p>
      <ul className="acesso-lista">
        <li>
          <form action={escolher}>
            <input type="hidden" name="quem" value="dono" />
            <button className={`acesso-opcao ${!usuario.profissionalId ? "atual" : ""}`}>
              <span className="acesso-foto"><Crown size={26} aria-hidden /></span>
              <span><strong>Dono</strong><small>Tudo: agenda de todos, configurações, fotos e preços</small></span>
            </button>
          </form>
        </li>
        {profissionais.map((p) => {
          const foto = p.fotoArquivo && fotos.get(p.fotoArquivo);
          return (
            <li key={p.id}>
              <form action={escolher}>
                <input type="hidden" name="quem" value={p.id} />
                <button className={`acesso-opcao ${usuario.profissionalId === p.id ? "atual" : ""}`}>
                  <span className="acesso-foto">
                    {foto
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={urlFoto(foto.arquivo, "p")} alt="" width={56} height={56} />
                      : p.nome[0]}
                  </span>
                  <span><strong>{p.nome}</strong><small>Só a agenda {p.nome.split(" ")[0] === p.nome ? `de ${p.nome}` : `de ${p.nome.split(" ")[0]}`}</small></span>
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      <p><a href="/app/sair">Sair do painel</a></p>
    </section>
  );
}
