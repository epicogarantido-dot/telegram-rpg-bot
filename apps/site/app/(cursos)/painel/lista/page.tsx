import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PASTA_CURSOS } from "@aprenda/catalogo";
import type { ItemLista } from "@aprenda/prospeccao";
import { config, exigirLogin, obterBanco } from "@/lib/painel";
import { AcoesDoLead, ROTULO } from "@/componentes/painel/Leads";

export const metadata = { title: "Pra mandar mensagem", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Listas prontas de barbearias pra contatar (data/listas/<nome>.json, que vem só no zip do site de
 * leads e fica fora do git). Abrir a página grava no banco quem falta; o trabalho feito não se perde.
 */
const PASTA_LISTAS = join(dirname(PASTA_CURSOS), "listas");

function lerListas(): { nome: string; titulo: string; itens: ItemLista[]; soEmail?: boolean }[] {
  let arquivos: string[] = [];
  try { arquivos = readdirSync(PASTA_LISTAS).filter((a) => a.endsWith(".json")).sort(); } catch { return []; }
  return arquivos.map((a) => {
    const dados = JSON.parse(readFileSync(join(PASTA_LISTAS, a), "utf8")) as { titulo?: string; itens: ItemLista[]; soEmail?: boolean };
    return { nome: a.replace(/\.json$/, ""), titulo: dados.titulo ?? a, itens: dados.itens, soEmail: dados.soEmail };
  }).filter((l) => !l.soEmail); // a de e-mail (emails.json) entra pelo /painel/emails
}

const FILTROS = { falta: "Falta mandar", mandadas: "Já mandei", todas: "Todas" } as const;
type Filtro = keyof typeof FILTROS;

export default async function ListaDeContato({ searchParams }: { searchParams: Promise<{ lista?: string; ver?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const banco = obterBanco();
  const listas = lerListas();
  for (const l of listas) banco.importarLista(l.nome, l.itens);
  const atual = listas.find((l) => l.nome === sp.lista) ?? listas[0];
  const ver: Filtro = sp.ver === "mandadas" || sp.ver === "todas" ? sp.ver : "falta";
  const todos = atual ? banco.listaDeContato(atual.nome) : [];
  const mandadas = todos.filter((l) => l.status !== "novo").length;
  const leads = todos.filter((l) => ver === "todas" || (ver === "falta" ? l.status === "novo" : l.status !== "novo"));
  const hoje = banco.contatadosHoje();
  const url = (extra: Record<string, string>) => `/painel/lista?${new URLSearchParams({ ...(atual ? { lista: atual.nome } : {}), ...extra })}`;

  return (
    <>
      <p><a href="/painel">Leads</a> · <strong>Pra mandar</strong> · <a href="/painel/emails">E-mail</a> · <a href="/painel/buscar">Buscar</a> · <a href="/painel/assinaturas">Vendas</a></p>
      <h1>Pra mandar mensagem</h1>
      {!atual ? (
        <p>Nenhuma lista pronta. As listas vêm no pacote do site (pasta data/listas).</p>
      ) : (
        <>
          {listas.length > 1 && (
            <p>{listas.map((l) => <a key={l.nome} href={`/painel/lista?lista=${l.nome}`} className="etiqueta" style={{ marginRight: 8 }} aria-current={l === atual ? "page" : undefined}>{l.titulo}</a>)}</p>
          )}
          <p><strong>{atual.titulo}</strong>: {mandadas} de {todos.length} já receberam a 1ª mensagem.</p>
          <p>
            Hoje: <strong>{hoje}</strong> primeiras mensagens.
            {hoje >= 30 && " Muita mensagem pra quem ainda não te conhece pode limitar o seu número: vá com calma."}
          </p>
          <p><small>Toque em "Abrir 1ª mensagem no WhatsApp": abre a conversa com o texto pronto e você só envia. Uma por vez, com calma. Quem responder segue pelos botões do cartão.</small></p>
          <p>
            {(Object.keys(FILTROS) as Filtro[]).map((f) => (
              <a key={f} href={url({ ver: f })} className="etiqueta" style={{ marginRight: 8 }} aria-current={f === ver ? "page" : undefined}>
                {FILTROS[f]} ({f === "todas" ? todos.length : f === "falta" ? todos.length - mandadas : mandadas})
              </a>
            ))}
          </p>
          <div className="tabela-leads">
            {leads.map((l) => (
              <div key={l.placeId} id={`lead-${l.placeId}`} className="cartao lead">
                <div>
                  <span className="etiqueta">{ROTULO[l.status]}</span> <strong>{l.nome}</strong>
                  <br />
                  <small>
                    {l.cidade} · <a href={`https://wa.me/${l.telefone}`} target="_blank" rel="noopener noreferrer">{l.telefone ? `(${l.telefone.slice(2, 4)}) ${l.telefone.slice(4, -4)}-${l.telefone.slice(-4)}` : ""}</a>
                    {l.abertura && <> · aberta em {l.abertura.slice(0, 4)}</>}
                    {l.endereco && <> · {l.endereco}</>}
                  </small>
                </div>
                <AcoesDoLead lead={l} agora={new Date()} />
              </div>
            ))}
            {leads.length === 0 && <p>{ver === "falta" ? "Todas já receberam a 1ª mensagem." : "Nada aqui ainda."}</p>}
          </div>
        </>
      )}
    </>
  );
}
