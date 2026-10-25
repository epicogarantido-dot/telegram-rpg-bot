import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogOut, Trophy } from "lucide-react";
import { carregarCursos } from "@aprenda/catalogo";
import { exigirMembro, obterMembros, sairMembro } from "../../lib/membros";

export const metadata = { title: "Minha área", robots: { index: false } };
export const dynamic = "force-dynamic";

async function sair() {
  "use server";
  await sairMembro();
  redirect("/");
}

async function excluir(form: FormData) {
  "use server";
  const m = await exigirMembro();
  if (form.get("confirmo") !== "EXCLUIR") redirect("/minha-area?erro=1#excluir");
  obterMembros().excluirConta(m.id);
  await sairMembro();
  redirect("/?excluida=1");
}

export default async function MinhaArea({ searchParams }: { searchParams: Promise<{ bemvindo?: string; senha?: string; erro?: string }> }) {
  const m = await exigirMembro();
  const sp = await searchParams;
  const cursos = await carregarCursos();
  const feitas = obterMembros().licoesConcluidas(m.id);
  const primeiroNome = m.nome.split(" ")[0];

  return (
    <>
      <div className="linha-topo">
        <h1>{sp.bemvindo ? `Bem-vindo, ${primeiroNome}!` : `Olá, ${primeiroNome}!`}</h1>
        <form action={sair}><button className="botao-sec"><LogOut size={16} aria-hidden /> Sair</button></form>
      </div>
      {sp.senha && <p className="atribuicao">Senha trocada. Os outros aparelhos foram desconectados.</p>}
      <p className="suave">Seu progresso fica salvo aqui. Continue de onde parou:</p>

      <div className="grade">
        {cursos.map((c) => {
          const licoes = c.modulos.flatMap((mod) => mod.licoes.map((l) => ({ mod, l })));
          const n = licoes.filter(({ l }) => feitas.has(`${c.slug}/${l.id}`)).length;
          const pct = Math.round((n / licoes.length) * 100);
          const proxima = licoes.find(({ l }) => !feitas.has(`${c.slug}/${l.id}`)) ?? licoes[0]!;
          return (
            <div key={c.slug} className="cartao">
              <span className="etiqueta">{c.area}</span>
              <h3>{c.titulo}</h3>
              <div className="barra-progresso" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso em ${c.titulo}`}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <p className="pequeno">{pct === 100 ? <><Trophy className="icone" aria-hidden /> Concluído!</> : `${n} de ${licoes.length} lições`}</p>
              <p style={{ marginTop: 12 }}>
                <Link className="botao" href={`/cursos/${c.slug}/${proxima.mod.id}/${proxima.l.id}`}>
                  {n === 0 ? "Começar" : pct === 100 ? "Rever" : "Continuar"} <ArrowRight size={16} aria-hidden />
                </Link>
              </p>
            </div>
          );
        })}
      </div>

      <details className="zona-perigo" id="excluir">
        <summary>Excluir minha conta</summary>
        <p>Apaga sua conta, seu número e seu progresso de forma permanente (LGPD).</p>
        {sp.erro && <p className="erro">Digite EXCLUIR pra confirmar.</p>}
        <form action={excluir} className="formulario">
          <input name="confirmo" placeholder="Digite EXCLUIR" autoComplete="off" aria-label="Digite EXCLUIR pra confirmar" />
          <button className="botao-perigo">Excluir definitivamente</button>
        </form>
      </details>
    </>
  );
}
