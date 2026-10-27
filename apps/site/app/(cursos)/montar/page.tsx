import { redirect } from "next/navigation";
import { TEMAS, temaValido } from "@aprenda/agenda";
import { mensagemDeErro } from "@/lib/agenda";
import { chaveDoAparelho } from "@/lib/protecao";
import { criarPrevia } from "@/lib/previa";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";

export const metadata = {
  title: "Monte o site da sua barbearia",
  description: "Diga o nome da sua barbearia, escolha o estilo e veja o site pronto na hora, antes de decidir.",
};

async function montar(form: FormData) {
  "use server";
  const campo = (n: string) => String(form.get(n) ?? "").trim();
  const nome = campo("nome");
  const cidade = campo("cidade");
  const tema = campo("tema");
  let slug: string;
  try {
    if (!temaValido(tema)) throw new Error("tema");
    slug = (await criarPrevia({ nome, cidade: cidade || undefined, tema, aparelho: await chaveDoAparelho() })).slug;
  } catch (e) {
    const erro = e instanceof Error && e.message === "tema" ? "Escolha um dos estilos." : mensagemDeErro(e);
    redirect(`/montar?${new URLSearchParams({ erro, nome, cidade, tema })}`);
  }
  redirect(`/b/${slug}`);
}

/**
 * Onde todo "Quero meu site" chega: o barbeiro põe o nome, escolhe o estilo e vê o site dele
 * pronto, no ar, antes de qualquer cadastro. Da prévia, "Quero este site" leva ao cadastro.
 */
export default async function Montar({ searchParams }: { searchParams: Promise<{ erro?: string; nome?: string; cidade?: string; tema?: string }> }) {
  const sp = await searchParams;
  const escolhido = sp.tema && temaValido(sp.tema) ? sp.tema : TEMAS[0].id;
  return (
    <div className="montar">
      <header className="montar-cabeca">
        <h1>Veja o site da sua barbearia pronto</h1>
        <p>Diga o nome e escolha o estilo. Em segundos você abre o site com o seu nome, do jeito que o cliente vai ver. Sem cadastro.</p>
      </header>
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}
      <form action={montar} className="formulario montar-form">
        <div className="montar-campos">
          <label>
            <span>Nome da barbearia</span>
            <input name="nome" required minLength={2} maxLength={60} defaultValue={sp.nome} placeholder="Ex.: Barbearia do Zé" autoComplete="organization" />
          </label>
          <label>
            <span>Cidade <small>(opcional)</small></span>
            <input name="cidade" maxLength={60} defaultValue={sp.cidade} placeholder="Ex.: Alegrete" autoComplete="address-level2" />
          </label>
        </div>
        <fieldset className="montar-estilos">
          <legend>Escolha o estilo <small>(dá pra trocar depois)</small></legend>
          <div className="montar-grade">
            {TEMAS.map((t) => (
              <label key={t.id} className="montar-estilo">
                <input type="radio" name="tema" value={t.id} defaultChecked={t.id === escolhido} required />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/barbeiros/${t.id}.webp`} alt="" width={390} height={780} loading="lazy" />
                <span><strong>{t.nome}</strong>{t.resumo}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <BotaoEnviar className="montar-enviar" carregando="Montando o seu site…">Ver o meu site</BotaoEnviar>
        <p className="suave montar-nota">As fotos são de exemplo. No site de verdade, a nossa equipe põe as suas.</p>
      </form>
    </div>
  );
}
