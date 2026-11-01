import { STATUS, ehCelularBR, proximoPasso, type Status } from "@aprenda/prospeccao";
import { config, exigirLogin, obterBanco } from "@/lib/painel";
import { AcoesDoLead, NoSite, ROTULO } from "@/componentes/painel/Leads";

export const metadata = { title: "Painel de leads", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Painel({ searchParams }: { searchParams: Promise<{ status?: string; nicho?: string; cidade?: string; uf?: string; hoje?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const banco = obterBanco();
  const agora = new Date();
  const status = STATUS.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const cidade = sp.cidade?.trim() || undefined;
  const uf = sp.uf?.trim().toUpperCase() || undefined;
  const pendentes = [...banco.listar({ status: "contatado", cidade, uf, limite: 2000 }), ...banco.listar({ status: "lembrete", cidade, uf, limite: 2000 })]
    .filter((l) => proximoPasso(l, agora));
  const leads = sp.hoje ? pendentes : banco.listar({ status, nicho: sp.nicho || undefined, cidade, uf, limite: 200 });
  const resumo = banco.resumo({ cidade, uf });
  const filtro = (extra: Record<string, string>) => `/painel?${new URLSearchParams({ ...extra, ...(cidade ? { cidade } : {}), ...(uf ? { uf } : {}) })}`;
  const hoje = banco.contatadosHoje();
  const inscricoes = banco.inscricoes();

  return (
    <>
      <p><strong>Leads</strong> · <a href="/painel/lista">Pra mandar</a> · <a href="/painel/buscar">Buscar</a> · <a href="/painel/cartao">Cartão pra visitas</a> · <a href="/painel/assinaturas">Vendas</a> · <a href="/painel/backup">Baixar backup</a></p>
      <h1>Painel de leads</h1>
      <p>
        Primeiras mensagens hoje: <strong>{hoje}</strong>
        {hoje >= 30 && " — muita mensagem pra quem ainda não te conhece pode limitar o seu número. Vá com calma."}
      </p>
      {pendentes.length > 0 && !sp.hoje && (
        <p className="cartao"><strong>{pendentes.length} lembrete(s) ou encerramento(s) pra hoje.</strong> <a href={filtro({ hoje: "1" })}>Ver só esses</a></p>
      )}
      <p><small>Como abordar: 1ª mensagem sem link, link só depois que ele responder, um lembrete só. Roteiro em docs/abordagem.md.</small></p>
      <form className="formulario linha" method="get">
        <input name="cidade" defaultValue={cidade} placeholder="Cidade" aria-label="Cidade" />
        <input name="uf" defaultValue={uf} placeholder="UF" aria-label="UF" maxLength={2} />
        {status && <input type="hidden" name="status" value={status} />}
        <button type="submit">Filtrar</button>
      </form>
      <p>
        {STATUS.map((s) => (
          <a key={s} href={filtro({ status: s })} className="etiqueta" style={{ marginRight: 8 }}>
            {ROTULO[s]}: {resumo[s]}
          </a>
        ))}
        <a href={filtro({})}>todos</a>
      </p>

      {inscricoes.length > 0 && (
        <details open>
          <summary><strong>{inscricoes.length} inscrições pelo site</strong> (pediram contato — prioridade!)</summary>
          <ul>
            {inscricoes.map((i) => (
              <li key={i.id}>
                {i.nome} · {i.negocio ?? "-"} · {i.cidade ?? "-"} · quer: {i.interesse} ·{" "}
                <a href={`https://wa.me/${i.telefone}`} target="_blank" rel="noopener noreferrer">{i.telefone}</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="tabela-leads">
        {leads.map((l) => {
          const celular = l.telefone && ehCelularBR(l.telefone);
          return (
            <div key={l.placeId} id={`lead-${l.placeId}`} className="cartao lead">
              <div>
                <span className="etiqueta">{ROTULO[l.status]}</span>{" "}
                <strong>{l.nome}</strong>
                {l.avaliacoes ? <> · ⭐ {l.nota ?? "-"} ({l.avaliacoes})</> : null}
                <br />
                <small>
                  {l.endereco ?? l.cidade} · {l.telefone ?? "sem telefone"}
                  {l.telefone && !celular && " (fixo, provavelmente sem WhatsApp)"}
                  {l.instagram && <> · <a href={`https://instagram.com/${l.instagram}`} target="_blank" rel="noopener noreferrer">@{l.instagram}</a></>}
                  {l.mapsUrl && <> · <a href={l.mapsUrl} target="_blank" rel="noopener noreferrer">Maps</a></>}
                  {l.abertura && <> · aberta em {l.abertura.slice(0, 4)}</>}
                  {l.fonte && <> · fonte: {l.fonte}</>}
                </small>
                {l.avisos && <><br /><small className="aviso-lead">⚠️ {l.avisos}</small></>}
                {l.observacao && <><br /><small>📝 {l.observacao}</small></>}
                <NoSite lead={l} agora={agora} />
              </div>
              <AcoesDoLead lead={l} agora={agora} />
            </div>
          );
        })}
        {leads.length === 0 && <p>Nenhum lead aqui. <a href="/painel/buscar">Buscar barbearias</a> pela base da Receita ou pelo Google e Instagram.</p>}
      </div>
    </>
  );
}
