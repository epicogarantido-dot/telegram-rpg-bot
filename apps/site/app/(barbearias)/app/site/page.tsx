import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ExternalLink } from "lucide-react";
import { TEMAS } from "@aprenda/agenda";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda } from "@/lib/agenda";

export const metadata = { title: "Meu site", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Cores de amostra de cada tema, só pra escolher (o tema completo está em temas.css). */
const AMOSTRAS: Record<string, string[]> = {
  silencioso: ["#ffffff", "#111111", "#e7e5e0"],
  atemporal: ["#000000", "#ffffff", "#ececec"],
  cerimonia: ["#120b14", "#3b2342", "#f5f0f6"],
  tecnico: ["#f7f8fa", "#0f1d3a", "#9aa9c4"],
  potencia: ["#0a0a0a", "#d7ff1e", "#2a2a2a"],
  extravagancia: ["#0c0b09", "#c9a54b", "#f3e6c4"],
};

async function salvar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const campo = (n: string) => String(form.get(n) ?? "");
  try {
    obterAgenda().atualizarSite(barbearia.id, {
      tema: campo("tema"), bio: campo("bio"), cidade: campo("cidade"), instagram: campo("instagram"), oferta: campo("oferta"),
    });
  } catch (e) {
    redirect(`/app/site?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/app/site");
  revalidatePath(`/b/${barbearia.slug}`);
  redirect("/app/site?salvo=1");
}

export default async function MeuSite({ searchParams }: { searchParams: Promise<{ erro?: string; salvo?: string }> }) {
  const { barbearia: b } = await exigirAcessoAtivo();
  const { erro, salvo } = await searchParams;
  return (
    <>
      <div className="linha-topo">
        <h1>Meu site</h1>
        <a href={`/b/${b.slug}`} className="botao-sec" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden /> Ver meu site</a>
      </div>
      {salvo && <p className="atribuicao" role="status">Salvo. Seu site já está atualizado.</p>}
      {erro && <p className="erro" role="alert">{erro}</p>}

      <form action={salvar} className="formulario formulario-largo">
        <fieldset className="temas-escolha">
          <legend>Estilo do site</legend>
          {TEMAS.map((t) => (
            <label key={t.id} className="tema-opcao">
              <input type="radio" name="tema" value={t.id} defaultChecked={b.tema === t.id} />
              <span className="tema-amostra" aria-hidden="true">
                {AMOSTRAS[t.id]!.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <strong>{t.nome}</strong>
              <span className="tema-resumo">{t.resumo}</span>
              <span className="tema-efeitos" aria-label={`Efeitos: ${t.efeitos} de 5`}>
                {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= t.efeitos ? "on" : ""} />)}
              </span>
            </label>
          ))}
        </fieldset>

        <label>Frase de apresentação
          <textarea name="bio" rows={3} maxLength={400} defaultValue={b.bio ?? ""} placeholder="Ex.: Degradê na régua e barba com toalha quente desde 2015." />
        </label>
        <label>Cidade<input name="cidade" maxLength={60} defaultValue={b.cidade ?? ""} placeholder="Ex.: Campinas" /></label>
        <label>Instagram<input name="instagram" maxLength={60} defaultValue={b.instagram ?? ""} placeholder="@suabarbearia" /></label>
        <label>Oferta em destaque (opcional)
          <input name="oferta" maxLength={80} defaultValue={b.oferta ?? ""} placeholder="Ex.: 10% de desconto na primeira visita" />
        </label>
        <BotaoEnviar carregando="Salvando…">Salvar</BotaoEnviar>
      </form>
      <p className="suave pequeno">Endereço, WhatsApp, serviços, equipe e horários ficam em <Link href="/app/config">Configurações</Link>. Fotos em <Link href="/app/fotos">Fotos</Link>.</p>
    </>
  );
}
