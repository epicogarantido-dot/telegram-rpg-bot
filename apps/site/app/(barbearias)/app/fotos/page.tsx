import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Star, Trash2, Upload } from "lucide-react";
import { apagarFoto, CATEGORIAS_FOTO, gravarFoto, MAX_FOTOS, processarFoto } from "@aprenda/agenda";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { CampoFoto } from "@/componentes/CampoFoto";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { urlFoto } from "@/lib/barbearias";

export const metadata = { title: "Fotos", robots: { index: false } };
export const dynamic = "force-dynamic";

async function enviar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const arquivos = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 12);
  if (arquivos.length === 0) redirect("/app/fotos?erro=Escolha%20pelo%20menos%20uma%20foto.");
  let enviadas = 0;
  let erro: string | undefined;
  for (const arq of arquivos) {
    try {
      const foto = await processarFoto(Buffer.from(await arq.arrayBuffer()));
      const nome = banco.registrarFoto(barbearia.id, {
        categoria: String(form.get("categoria") ?? "corte"), legenda: String(form.get("legenda") ?? ""),
        largura: foto.largura, altura: foto.altura,
      });
      gravarFoto(nome, foto);
      enviadas++;
    } catch (e) {
      erro = `${arq.name}: ${mensagemDeErro(e)}`;
      break;
    }
  }
  revalidatePath("/app/fotos");
  revalidatePath(`/b/${barbearia.slug}`);
  redirect(`/app/fotos?enviadas=${enviadas}${erro ? `&erro=${encodeURIComponent(erro)}` : ""}`);
}

async function editar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const id = Number(form.get("id"));
  const banco = obterAgenda();
  const acao = String(form.get("acao"));
  try {
    if (acao === "capa") banco.definirCapa(barbearia.id, id);
    else if (acao === "apagar") {
      const arquivo = banco.removerFoto(barbearia.id, id);
      if (arquivo) apagarFoto(arquivo);
    } else {
      banco.editarFoto(barbearia.id, id, { categoria: String(form.get("categoria")), legenda: String(form.get("legenda") ?? "") });
      banco.definirAntes(barbearia.id, id, String(form.get("antesDe") ?? "") || null);
    }
  } catch (e) {
    redirect(`/app/fotos?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/app/fotos");
  revalidatePath(`/b/${barbearia.slug}`);
}

export default async function Fotos({ searchParams }: { searchParams: Promise<{ erro?: string; enviadas?: string }> }) {
  const { barbearia } = await exigirAcessoAtivo();
  const sp = await searchParams;
  const fotos = obterAgenda().fotos(barbearia.id);

  return (
    <>
      <h1>Fotos</h1>
      <p className="suave">Fotos dos seus cortes, da barba, do ambiente e da equipe. A marcada com estrela vira a capa do site. Pra mostrar um antes e depois, escolha na foto do "antes" qual é a do "depois". {fotos.length}/{MAX_FOTOS}</p>
      {sp.enviadas && Number(sp.enviadas) > 0 && <p className="atribuicao" role="status">{sp.enviadas} foto(s) enviada(s).</p>}
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}

      <form action={enviar} className="formulario formulario-largo envio-fotos">
        <label>Fotos (até 12 por vez)
          <CampoFoto name="fotos" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple required />
        </label>
        <label>Tipo
          <select name="categoria" defaultValue="degrade">
            {CATEGORIAS_FOTO.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label>Legenda (opcional)<input name="legenda" maxLength={80} placeholder="Ex.: Degradê navalhado" /></label>
        <BotaoEnviar carregando="Enviando…"><Upload size={18} aria-hidden /> Enviar fotos</BotaoEnviar>
        <small className="suave">As fotos são otimizadas e a localização gravada pelo celular é removida antes de publicar.</small>
      </form>

      <div className="grade-fotos">
        {fotos.map((f) => (
          <div key={f.id} className={`cartao foto-item ${f.capa ? "capa" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlFoto(f.arquivo, "p")} alt={f.legenda ?? ""} loading="lazy" />
            <form action={editar} className="foto-campos">
              <input type="hidden" name="id" value={f.id} />
              <select name="categoria" defaultValue={f.categoria} aria-label="Tipo">
                {CATEGORIAS_FOTO.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <input name="legenda" defaultValue={f.legenda ?? ""} maxLength={80} placeholder="Legenda" aria-label="Legenda" />
              <select name="antesDe" defaultValue={f.antesDe ?? ""} aria-label="Esta foto é o antes de qual foto?">
                <option value="">Não é foto de "antes"</option>
                {fotos.filter((o) => o.id !== f.id && o.categoria !== "equipe").map((o, i) => (
                  <option key={o.arquivo} value={o.arquivo}>Antes de: {o.legenda || `foto ${fotos.length - i}`}</option>
                ))}
              </select>
              <div className="acoes">
                <button className="botao-sec" name="acao" value="salvar">Salvar</button>
                <button className="botao-sec" name="acao" value="capa" disabled={!!f.capa}><Star size={16} aria-hidden /> {f.capa ? "É a capa" : "Usar de capa"}</button>
                <button className="botao-sec perigo" name="acao" value="apagar" aria-label="Apagar foto"><Trash2 size={16} aria-hidden /></button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
