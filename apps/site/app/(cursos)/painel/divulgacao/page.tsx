import { carregarArtigos, carregarCursos } from "@aprenda/catalogo";
import { BotaoCopiar } from "@/componentes/BotaoCopiar";
import { exigirLogin, obterBanco } from "@/lib/painel";
import { urlDoSite } from "@/lib/membros";

export const metadata = { title: "Divulgação", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Origem marcada no link, pra contagem saber qual post trouxe a visita. */
function origemDo(slug: string): string {
  return `grupo-${slug}`.slice(0, 60).replace(/-+$/, "");
}

/** Texto curto pro grupo: o que é, por que abrir, link. Sem exagero, sem "clique aqui". */
function post(titulo: string, resumo: string, link: string, rotulo: string): string {
  return `*${titulo}*\n\n${resumo}\n\n${rotulo}: ${link}`;
}

/**
 * Posts prontos pro grupo de barbeiros (cada link com ?origem=, pra saber qual post trouxe
 * gente) e a contagem de visitas e cadastros por origem. Quem posta é você, no grupo.
 */
export default async function Divulgacao() {
  await exigirLogin();
  const site = urlDoSite();
  const artigos = await carregarArtigos();
  const cursos = (await carregarCursos()).filter((c) => c.tags.includes("barbearia"));
  const resumo = obterBanco().resumoOrigens(30);
  const totais = resumo.reduce((t, r) => ({ visitas: t.visitas + r.visitas, cadastros: t.cadastros + r.cadastros }), { visitas: 0, cadastros: 0 });
  const itens = [
    ...artigos.map((a) => ({ chave: a.slug, tipo: "Revista", texto: post(a.titulo, a.resumo, `${site}/revista/${a.slug}?origem=${origemDo(a.slug)}`, "Leia aqui") })),
    ...cursos.map((c) => ({ chave: c.slug, tipo: "Curso grátis", texto: post(c.titulo, c.resumo, `${site}/cursos/${c.slug}?origem=${origemDo(c.slug)}`, "Curso grátis, sem cadastro") })),
  ];

  return (
    <>
      <p><a href="/painel">Leads</a> · <a href="/painel/buscar">Buscar</a> · <strong>Divulgação</strong> · <a href="/painel/cartao">Cartão pra visitas</a> · <a href="/painel/assinaturas">Assinaturas</a></p>
      <h1>Divulgação</h1>

      <h2>De onde veio gente (últimos 30 dias)</h2>
      <p><small>Conta quem abriu o site por um link com origem (posts abaixo, cartão, &quot;Site + grupo&quot;, presente dos cursos) e quem criou conta de barbearia depois. Só números, sem guardar quem é.</small></p>
      {resumo.length === 0 ? (
        <p>Nada ainda. Poste um link daqui no grupo e volte amanhã.</p>
      ) : (
        <table className="tabela-divisao">
          <thead><tr><th scope="col">Origem</th><th scope="col">Visitas</th><th scope="col">Cadastros</th></tr></thead>
          <tbody>
            {resumo.map((r) => <tr key={r.origem}><td>{r.origem}</td><td>{r.visitas}</td><td>{r.cadastros}</td></tr>)}
            <tr><th scope="row">Total</th><td>{totais.visitas}</td><td>{totais.cadastros}</td></tr>
          </tbody>
        </table>
      )}

      <h2>Posts prontos pro grupo</h2>
      <p><small>Copie e cole no grupo, ou toque em &quot;Abrir no WhatsApp&quot; e escolha o grupo. Um por dia é melhor que todos de uma vez.</small></p>
      {itens.map((i) => (
        <div key={i.tipo + i.chave} className="cartao" style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 6px" }}><span className="etiqueta">{i.tipo}</span></p>
          <p style={{ whiteSpace: "pre-wrap", margin: "0 0 10px" }}>{i.texto}</p>
          <div className="acoes">
            <BotaoCopiar texto={i.texto} rotulo="Copiar post" />
            <a className="botao-sec" href={`https://wa.me/?text=${encodeURIComponent(i.texto)}`} target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a>
          </div>
        </div>
      ))}
    </>
  );
}
