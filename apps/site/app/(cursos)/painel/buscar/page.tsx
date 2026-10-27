import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { exigirLogin, obterBanco } from "@/lib/painel";
import { estadoDaBusca, iniciarBusca } from "@/lib/busca-receita";

export const metadata = { title: "Buscar leads", robots: { index: false } };
export const dynamic = "force-dynamic";

const NICHO = "barbearia";

async function buscarReceita(form: FormData) {
  "use server";
  await exigirLogin();
  const cidade = String(form.get("cidade") ?? "").trim();
  const uf = String(form.get("uf") ?? "").trim().toUpperCase();
  if (cidade && /^[A-Z]{2}$/.test(uf)) iniciarBusca(NICHO, cidade, uf);
  redirect(`/painel/buscar?cidade=${encodeURIComponent(cidade)}&uf=${uf}`);
}

async function adicionar(form: FormData) {
  "use server";
  await exigirLogin();
  const cidade = String(form.get("cidade") ?? "").trim();
  const uf = String(form.get("uf") ?? "");
  const nome = String(form.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
  const instagram = String(form.get("instagram") ?? "").trim() || undefined;
  if (!nome || !cidade || (!telefone && !instagram)) redirect(`/painel/buscar?cidade=${encodeURIComponent(cidade)}&uf=${uf}&erro=1#adicionar`);
  const r = obterBanco().salvarManual({ nome, cidade, uf, nicho: NICHO, telefone, instagram, observacao: String(form.get("observacao") ?? "").trim() || undefined });
  revalidatePath("/painel");
  redirect(`/painel/buscar?cidade=${encodeURIComponent(cidade)}&uf=${uf}&${r.novo ? "novo" : "juntou"}=1#adicionar`);
}

async function completar(form: FormData) {
  "use server";
  await exigirLogin();
  obterBanco().completar(String(form.get("id")), {
    telefone: normalizarTelefone(String(form.get("telefone") ?? "")),
    instagram: String(form.get("instagram") ?? "").trim() || undefined,
  });
  revalidatePath("/painel");
  redirect(`/painel/buscar?cidade=${encodeURIComponent(String(form.get("cidade") ?? ""))}&uf=${String(form.get("uf") ?? "")}#completar`);
}

/** Buscas que VOCÊ abre e lê. Nada é raspado automaticamente (termos de uso e LGPD). */
function buscas(cidade: string, uf: string) {
  const q = (t: string) => encodeURIComponent(t);
  const tag = cidade.normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, "").toLowerCase();
  return [
    { nome: "Google", href: `https://www.google.com/search?q=${q(`barbearia ${cidade} ${uf}`)}` },
    { nome: "Google Maps", href: `https://www.google.com/maps/search/${q(`barbearia ${cidade} ${uf}`)}` },
    { nome: "Instagram pelo Google", href: `https://www.google.com/search?q=${q(`site:instagram.com barbearia ${cidade}`)}` },
    { nome: "Instagram #barbearia" + tag, href: `https://www.instagram.com/explore/tags/barbearia${tag}/` },
    { nome: "Instagram #barber" + tag, href: `https://www.instagram.com/explore/tags/barber${tag}/` },
    { nome: "Facebook (páginas)", href: `https://www.facebook.com/search/pages/?q=${q(`barbearia ${cidade}`)}` },
  ];
}

export default async function Buscar({ searchParams }: { searchParams: Promise<{ cidade?: string; uf?: string; erro?: string; novo?: string; juntou?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const cidade = sp.cidade?.trim() || "Alegrete";
  const uf = (sp.uf?.trim() || "RS").toUpperCase();
  const estado = estadoDaBusca();
  const leads = obterBanco().listar({ nicho: NICHO, cidade, uf, limite: 5000 });
  const paraCompletar = leads.filter((l) => l.status === "novo" && (!l.instagram || l.avisos));

  return (
    <>
      {estado.rodando && <meta httpEquiv="refresh" content="10" />}
      <p><a href="/painel">Leads</a> · <strong>Buscar</strong> · <a href="/painel/divulgacao">Divulgação</a> · <a href="/painel/assinaturas">Assinaturas</a></p>
      <h1>Buscar barbearias</h1>
      <form className="formulario linha" method="get">
        <input name="cidade" defaultValue={cidade} aria-label="Cidade" placeholder="Cidade" required />
        <input name="uf" defaultValue={uf} aria-label="UF" placeholder="UF" maxLength={2} required />
        <button type="submit">Trocar cidade</button>
      </form>
      <p className="suave">
        {leads.length} barbearias em {cidade}/{uf} no banco · {obterBanco().listar({ nicho: "beleza_indefinido", cidade, uf, limite: 100000 }).length} MEI de beleza sem tipo (cruzam pelo WhatsApp)
      </p>

      <section className="busca-etapa" aria-labelledby="t-receita">
        <h2 id="t-receita">1. Base da Receita (todas as barbearias com CNPJ)</h2>
        <p className="suave pequeno">
          Dados abertos do CNPJ, oficiais e grátis. Barbearia, salão e manicure dividem a mesma atividade, então o nome separa.
          A maioria dos MEI tem só o nome da pessoa: esses ficam guardados como &quot;sem tipo&quot; e viram barbearia quando você
          cadastra aqui embaixo o WhatsApp que achou no Instagram ou no Google. Leva uns 15 minutos; pode sair da página.
        </p>
        {estado.rodando ? (
          <p className="atribuicao" role="status">⏳ Buscando {estado.cidade}/{estado.uf}: {estado.etapa} (atualiza sozinho)</p>
        ) : (
          <form action={buscarReceita}>
            <input type="hidden" name="cidade" value={cidade} />
            <input type="hidden" name="uf" value={uf} />
            <button type="submit" className="botao">Buscar {cidade}/{uf} na Receita</button>
          </form>
        )}
        {estado.resultado && <p className="atribuicao" role="status">✅ {estado.resultado}</p>}
        {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
      </section>

      <section className="busca-etapa" aria-labelledby="t-assistida">
        <h2 id="t-assistida">2. Google, Instagram e Facebook (você busca, o painel organiza)</h2>
        <p className="suave pequeno">Abra as buscas, entre nos perfis e cadastre aqui embaixo quem não estiver no banco. Número e @ repetidos se juntam sozinhos; quem pediu SAIR nunca volta pra lista.</p>
        <ul className="buscas-prontas">
          {buscas(cidade, uf).map((b) => <li key={b.nome}><a href={b.href} target="_blank" rel="noopener noreferrer">{b.nome}</a></li>)}
        </ul>
      </section>

      <section id="adicionar" className="busca-etapa" aria-labelledby="t-adicionar">
        <h2 id="t-adicionar">3. Cadastro rápido</h2>
        {sp.erro && <p className="erro" role="alert">Preencha o nome e o WhatsApp ou o Instagram.</p>}
        {sp.novo && <p className="atribuicao" role="status">Lead novo salvo.</p>}
        {sp.juntou && <p className="atribuicao" role="status">Já existia: juntei os dados no lead que estava no banco.</p>}
        <form action={adicionar} className="formulario">
          <input type="hidden" name="cidade" value={cidade} />
          <input type="hidden" name="uf" value={uf} />
          <label>Nome da barbearia<input name="nome" required maxLength={100} /></label>
          <label>WhatsApp<input name="telefone" inputMode="tel" placeholder="(55) 99999-0000" /></label>
          <label>Instagram<input name="instagram" placeholder="@barbearia ou link do perfil" /></label>
          <label>Observação <small>(o que viu no perfil: estilo, tempo de casa, se agenda pelo direct…)</small><input name="observacao" maxLength={300} /></label>
          <button type="submit">Salvar lead</button>
        </form>
      </section>

      <section id="completar" className="busca-etapa" aria-labelledby="t-completar">
        <h2 id="t-completar">4. Completar os da Receita ({paraCompletar.length})</h2>
        <p className="suave pequeno">Sem Instagram, sem celular ou com telefone do contador. Toque em &quot;Procurar&quot;, ache o perfil e cole o @ e o WhatsApp certo.</p>
        {paraCompletar.slice(0, 60).map((l) => (
          <div key={l.placeId} className="cartao lead">
            <div>
              <strong>{l.nome}</strong>
              <br />
              <small>{l.endereco ?? "sem endereço"} · {l.telefone ?? "sem telefone"}</small>
              {l.avisos && <><br /><small className="aviso-lead">⚠️ {l.avisos}</small></>}
            </div>
            <div className="acoes">
              <a className="botao-sec" target="_blank" rel="noopener noreferrer"
                href={`https://www.google.com/search?q=${encodeURIComponent(`${l.nome} ${cidade} instagram`)}`}>Procurar</a>
              <form action={completar} className="completar-lead">
                <input type="hidden" name="id" value={l.placeId} />
                <input type="hidden" name="cidade" value={cidade} />
                <input type="hidden" name="uf" value={uf} />
                <input name="instagram" placeholder="@instagram" aria-label={`Instagram de ${l.nome}`} defaultValue={l.instagram ?? ""} />
                <input name="telefone" placeholder="WhatsApp" aria-label={`WhatsApp de ${l.nome}`} inputMode="tel" />
                <button type="submit" className="botao-sec">Salvar</button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
