import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { apagarFoto, CATEGORIAS_FOTO, ErroAgenda, gravarFoto, MAX_FOTOS, processarFoto, type Foto } from "@aprenda/agenda";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { CampoFoto } from "@/componentes/CampoFoto";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda } from "@/lib/agenda";
import { urlFoto } from "@/lib/barbearias";
import { acervo } from "@/lib/exemplos";

export const metadata = { title: "Fotos do site", robots: { index: false } };
export const dynamic = "force-dynamic";

/** O que cada espaço do site mostra, dito do jeito que o barbeiro enxerga o site. */
const ESPACOS: Record<string, string> = {
  ambiente: "A barbearia por dentro: cadeira, bancada, fachada.",
  degrade: "Seus degradês. Viram o filtro Degradê em Trabalhos.",
  corte: "Cortes na tesoura e na máquina.",
  barba: "Barba feita, desenhada, na toalha quente.",
  navalhado: "Navalhados e desenhos.",
  sobrancelha: "Sobrancelha feita na navalha ou na pinça.",
  infantil: "Corte das crianças.",
  produtos: "O que você usa ou vende: pomadas, óleos, perfumes.",
  equipe: "Fotos da equipe. Pra pôr no perfil de cada um, escolha em Configurações → Profissionais.",
};

/** A mesma foto do acervo pode estar em arquivos diferentes (um por site de exemplo): compara pelo jeito dela. */
const assinatura = (f: Pick<Foto, "legenda" | "largura" | "altura" | "categoria">) => `${f.categoria}|${f.legenda ?? ""}|${f.largura}x${f.altura}`;

function voltar(ancora: string, extra = ""): never {
  revalidatePath("/app/fotos");
  redirect(`/app/fotos${extra}#${ancora}`);
}

async function enviar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const categoria = String(form.get("categoria") ?? "corte");
  const paraCapa = form.get("capa") === "1";
  const arquivos = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 12);
  if (arquivos.length === 0) redirect("/app/fotos?erro=Escolha%20pelo%20menos%20uma%20foto.");
  let enviadas = 0;
  let erro: string | undefined;
  for (const arq of arquivos) {
    try {
      const foto = await processarFoto(Buffer.from(await arq.arrayBuffer()));
      const nome = banco.registrarFoto(barbearia.id, {
        categoria, legenda: String(form.get("legenda") ?? ""), largura: foto.largura, altura: foto.altura,
      });
      gravarFoto(nome, foto);
      if (paraCapa) banco.definirCapa(barbearia.id, banco.fotoDaBarbearia(barbearia.id, nome)!.id);
      enviadas++;
    } catch (e) {
      erro = `${arq.name}: ${mensagemDeErro(e)}`;
      break;
    }
  }
  revalidatePath(`/b/${barbearia.slug}`);
  voltar(paraCapa ? "capa" : categoria, `?enviadas=${enviadas}${erro ? `&erro=${encodeURIComponent(erro)}` : ""}`);
}

/**
 * Antes e depois de uma vez: grava as duas fotos e já liga uma à outra. Vira o comparador de
 * arrastar na página inicial do site (no lugar do mosaico de fotos).
 */
async function enviarPar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const antes = form.get("antes");
  const depois = form.get("depois");
  const categoria = String(form.get("categoria") ?? "degrade");
  const legenda = String(form.get("legenda") ?? "");
  if (!(antes instanceof File) || antes.size === 0 || !(depois instanceof File) || depois.size === 0) {
    redirect("/app/fotos?erro=Escolha%20a%20foto%20de%20antes%20e%20a%20de%20depois.#antes-depois");
  }
  try {
    // Processa as duas antes de gravar qualquer uma: se uma falhar, não sobra foto sozinha.
    const [fa, fd] = await Promise.all([processarFoto(Buffer.from(await antes.arrayBuffer())), processarFoto(Buffer.from(await depois.arrayBuffer()))]);
    const nomeDepois = banco.registrarFoto(barbearia.id, { categoria, legenda, largura: fd.largura, altura: fd.altura });
    gravarFoto(nomeDepois, fd);
    const nomeAntes = banco.registrarFoto(barbearia.id, { categoria, legenda: legenda ? `Antes: ${legenda}` : "Antes", largura: fa.largura, altura: fa.altura });
    gravarFoto(nomeAntes, fa);
    banco.definirAntes(barbearia.id, banco.fotoDaBarbearia(barbearia.id, nomeAntes)!.id, nomeDepois);
  } catch (e) {
    redirect(`/app/fotos?erro=${encodeURIComponent(mensagemDeErro(e))}#antes-depois`);
  }
  revalidatePath(`/b/${barbearia.slug}`);
  voltar("antes-depois", "?enviadas=2");
}

/** Desfaz um par: a foto de "antes" volta a ser uma foto comum (ou sai do site, se pedir). */
async function desfazerPar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const id = Number(form.get("id"));
  try {
    if (form.get("acao") === "apagar") {
      const arquivo = banco.removerFoto(barbearia.id, id);
      if (arquivo) apagarFoto(arquivo);
    } else banco.definirAntes(barbearia.id, id, null);
  } catch (e) {
    redirect(`/app/fotos?erro=${encodeURIComponent(mensagemDeErro(e))}#antes-depois`);
  }
  revalidatePath(`/b/${barbearia.slug}`);
  voltar("antes-depois");
}

/** Põe no site uma foto do acervo (sem reprocessar: divide o arquivo). Se `capa`, vira a capa. */
async function doAcervo(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const origem = acervo(barbearia.tema);
  const paraCapa = form.get("capa") === "1";
  let ancora = paraCapa ? "capa" : String(form.get("categoria") ?? "");
  try {
    if (!origem) throw new ErroAgenda("As fotos padrão não estão disponíveis agora.");
    const id = banco.usarFotoDoAcervo(barbearia.id, origem.id, Number(form.get("foto")));
    if (paraCapa) banco.definirCapa(barbearia.id, id);
    ancora ||= banco.fotos(barbearia.id).find((f) => f.id === id)?.categoria ?? "";
  } catch (e) {
    redirect(`/app/fotos?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath(`/b/${barbearia.slug}`);
  voltar(ancora);
}

async function editar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const id = Number(form.get("id"));
  const banco = obterAgenda();
  const acao = String(form.get("acao"));
  let ancora = String(form.get("categoria") ?? "");
  try {
    if (acao === "capa") {
      banco.definirCapa(barbearia.id, id);
      ancora = "capa";
    } else if (acao === "apagar") {
      const arquivo = banco.removerFoto(barbearia.id, id);
      if (arquivo) apagarFoto(arquivo);
    } else {
      banco.editarFoto(barbearia.id, id, { categoria: String(form.get("categoria")), legenda: String(form.get("legenda") ?? "") });
      banco.definirAntes(barbearia.id, id, String(form.get("antesDe") ?? "") || null);
    }
  } catch (e) {
    redirect(`/app/fotos?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath(`/b/${barbearia.slug}`);
  voltar(ancora);
}

/** Miniatura que é um botão: escolher do acervo ou das próprias fotos. */
function Escolha({ foto, acao, campos, rotulo }: { foto: Foto; acao: (f: FormData) => Promise<void>; campos: Record<string, string | number>; rotulo: string }) {
  return (
    <form action={acao} className="escolha">
      {Object.entries(campos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" aria-label={`${rotulo}: ${foto.legenda ?? "foto"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlFoto(foto.arquivo, "p")} alt="" loading="lazy" />
        <span>{rotulo}</span>
      </button>
    </form>
  );
}

export default async function Fotos({ searchParams }: { searchParams: Promise<{ erro?: string; enviadas?: string }> }) {
  const { barbearia } = await exigirAcessoAtivo();
  const sp = await searchParams;
  const banco = obterAgenda();
  const fotos = banco.fotos(barbearia.id);
  const capa = fotos.find((f) => f.capa) ?? fotos.find((f) => f.categoria === "ambiente") ?? fotos[0];
  const pares = banco.paresAntesDepois(barbearia.id);
  // Acervo: fotos padrão que ainda não estão no site dele.
  const origem = acervo(barbearia.tema);
  const usadas = new Set(fotos.map(assinatura));
  const doAcervoLivres = origem && origem.id !== barbearia.id ? banco.fotos(origem.id).filter((f) => !usadas.has(assinatura(f))) : [];

  return (
    <>
      <h1>Fotos do site</h1>
      <p className="suave">
        Cada espaço do seu site e as fotos que estão nele agora. Troque pelas suas ou escolha uma das nossas.
        Mudou aqui, mudou no site. {fotos.length}/{MAX_FOTOS} fotos.
      </p>
      {sp.enviadas && Number(sp.enviadas) > 0 && <p className="atribuicao" role="status">{sp.enviadas} foto(s) enviada(s).</p>}
      {sp.erro && <p className="erro" role="alert">{sp.erro}</p>}

      <nav className="espacos-atalhos" aria-label="Espaços do site">
        <a href="#antes-depois">Antes e depois</a>
        <a href="#capa">Capa</a>
        {CATEGORIAS_FOTO.map((c) => <a key={c.id} href={`#${c.id}`}>{c.nome}</a>)}
      </nav>

      <section className="espaco espaco-destaque" id="antes-depois" aria-labelledby="ad-titulo">
        <h2 id="ad-titulo">Antes e depois <small>{pares.length > 0 ? `${pares.length} no site` : "vazio"}</small></h2>
        <p className="suave pequeno">
          O que mais convence quem visita o seu site. Tire a foto do cliente antes de começar e outra no
          fim, do mesmo ângulo. No site vira uma foto só, que o cliente arrasta pra ver a diferença.
        </p>
        {pares.length > 0 && (
          <div className="pares">
            {pares.map((p) => (
              <figure key={p.antes.id} className="par">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlFoto(p.antes.arquivo, "p")} alt="Antes" loading="lazy" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlFoto(p.depois.arquivo, "p")} alt={p.depois.legenda ?? "Depois"} loading="lazy" />
                <figcaption>{p.depois.legenda || "Sem legenda"}</figcaption>
                <form action={desfazerPar} className="acoes">
                  <input type="hidden" name="id" value={p.antes.id} />
                  <button className="botao-sec" name="acao" value="separar">Separar</button>
                  <button className="botao-sec perigo" name="acao" value="apagar"><Trash2 size={16} aria-hidden /> Tirar o antes do site</button>
                </form>
              </figure>
            ))}
          </div>
        )}
        <details className="espaco-mais" open={pares.length === 0}>
          <summary><ImagePlus size={18} aria-hidden /> Adicionar antes e depois</summary>
          <form action={enviarPar} className="formulario">
            <label>Foto de antes
              <CampoFoto name="antes" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" required />
            </label>
            <label>Foto de depois
              <CampoFoto name="depois" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" required />
            </label>
            <label>Que corte é
              <select name="categoria" defaultValue="degrade">
                {CATEGORIAS_FOTO.filter((c) => !["ambiente", "produtos", "equipe"].includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <input name="legenda" maxLength={80} placeholder="Legenda (opcional), ex.: Mid fade com risco" aria-label="Legenda" />
            <BotaoEnviar carregando="Enviando…"><Upload size={18} aria-hidden /> Pôr no site</BotaoEnviar>
          </form>
        </details>
      </section>

      <section className="espaco" id="capa" aria-labelledby="capa-titulo">
        <h2 id="capa-titulo">Capa <small>a foto grande do topo do site</small></h2>
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="espaco-capa" src={urlFoto(capa.arquivo)} alt={capa.legenda ?? "Capa atual"} />
        ) : <p className="espaco-vazio">Sem capa ainda. O site abre só com o nome.</p>}
        <details className="espaco-mais">
          <summary><ImagePlus size={18} aria-hidden /> Trocar a capa</summary>
          <form action={enviar} className="formulario">
            <input type="hidden" name="categoria" value="ambiente" />
            <input type="hidden" name="capa" value="1" />
            <label>Enviar uma foto minha
              <CampoFoto name="fotos" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" required />
            </label>
            <BotaoEnviar carregando="Enviando…"><Upload size={18} aria-hidden /> Usar de capa</BotaoEnviar>
          </form>
          {(fotos.length > 1 || doAcervoLivres.length > 0) && <p className="espaco-ou">Ou escolha uma:</p>}
          <div className="escolha-grade">
            {fotos.filter((f) => f.id !== capa?.id && f.categoria !== "equipe").map((f) => (
              <Escolha key={f.id} foto={f} acao={editar} campos={{ id: f.id, acao: "capa" }} rotulo="Sua" />
            ))}
            {doAcervoLivres.filter((f) => f.categoria === "ambiente" || f.largura > f.altura).map((f) => (
              <Escolha key={f.id} foto={f} acao={doAcervo} campos={{ foto: f.id, capa: "1" }} rotulo="Nossa" />
            ))}
          </div>
        </details>
      </section>

      {CATEGORIAS_FOTO.map((c) => {
        const daqui = fotos.filter((f) => f.categoria === c.id);
        const livres = doAcervoLivres.filter((f) => f.categoria === c.id);
        return (
          <section key={c.id} className="espaco" id={c.id} aria-labelledby={`${c.id}-titulo`}>
            <h2 id={`${c.id}-titulo`}>{c.nome} <small>{daqui.length > 0 ? `${daqui.length} no site` : "vazio"}</small></h2>
            <p className="suave pequeno">{ESPACOS[c.id]}</p>
            <div className="espaco-fotos">
              {daqui.length === 0 && <p className="espaco-vazio">Nada aqui ainda: este filtro só aparece no site quando tiver foto.</p>}
              {daqui.map((f) => (
                <figure key={f.id} className={`espaco-foto ${f.id === capa?.id ? "capa" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlFoto(f.arquivo, "p")} alt={f.legenda ?? c.nome} loading="lazy" />
                  <figcaption>{f.id === capa?.id ? "Capa · " : ""}{f.legenda || c.nome}</figcaption>
                  <details>
                    <summary>Editar</summary>
                    <form action={editar} className="foto-campos">
                      <input type="hidden" name="id" value={f.id} />
                      <select name="categoria" defaultValue={f.categoria} aria-label="Espaço">
                        {CATEGORIAS_FOTO.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                      </select>
                      <input name="legenda" defaultValue={f.legenda ?? ""} maxLength={80} placeholder="Legenda" aria-label="Legenda" />
                      <select name="antesDe" defaultValue={f.antesDe ?? ""} aria-label="Esta foto é o antes de qual foto?">
                        <option value="">Não é foto de &quot;antes&quot;</option>
                        {fotos.filter((o) => o.id !== f.id && o.categoria !== "equipe").map((o, i) => (
                          <option key={o.arquivo} value={o.arquivo}>Antes de: {o.legenda || `foto ${fotos.length - i}`}</option>
                        ))}
                      </select>
                      <div className="acoes">
                        <button className="botao-sec" name="acao" value="salvar">Salvar</button>
                        <button className="botao-sec" name="acao" value="capa" disabled={f.id === capa?.id}><Star size={16} aria-hidden /> Capa</button>
                        <button className="botao-sec perigo" name="acao" value="apagar"><Trash2 size={16} aria-hidden /> Tirar do site</button>
                      </div>
                    </form>
                  </details>
                </figure>
              ))}
              <details className="espaco-mais espaco-adicionar">
                <summary><ImagePlus size={18} aria-hidden /> Adicionar foto</summary>
                <form action={enviar} className="formulario">
                  <input type="hidden" name="categoria" value={c.id} />
                  <label>Enviar fotos minhas <small>(até 12 de uma vez)</small>
                    <CampoFoto name="fotos" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple required />
                  </label>
                  <input name="legenda" maxLength={80} placeholder={`Legenda (opcional), ex.: ${c.nome}`} aria-label="Legenda" />
                  <BotaoEnviar carregando="Enviando…"><Upload size={18} aria-hidden /> Enviar</BotaoEnviar>
                </form>
                {livres.length > 0 && (
                  <>
                    <p className="espaco-ou">Ou escolha uma das nossas:</p>
                    <div className="escolha-grade">
                      {livres.map((f) => <Escolha key={f.id} foto={f} acao={doAcervo} campos={{ foto: f.id, categoria: c.id }} rotulo="Pôr no site" />)}
                    </div>
                  </>
                )}
              </details>
            </div>
          </section>
        );
      })}
      <p className="suave pequeno">As fotos são otimizadas e a localização gravada pelo celular é removida antes de publicar.</p>
    </>
  );
}
