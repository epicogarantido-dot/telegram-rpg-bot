import { revalidatePath } from "next/cache";
import { STATUS, ehCelularBR, linkWhatsapp, mensagemConvite, type Status } from "@aprenda/prospeccao";
import { config, exigirLogin, obterBanco } from "../../lib/painel";

export const metadata = { title: "Painel de leads", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROTULO: Record<Status, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  entrou: "Entrou no grupo",
  cliente: "Cliente",
  nao_contatar: "Não contatar",
};

async function marcar(form: FormData) {
  "use server";
  await exigirLogin();
  const status = String(form.get("status")) as Status;
  if (!STATUS.includes(status)) return;
  obterBanco().marcar(String(form.get("id")), status);
  revalidatePath("/painel");
}

export default async function Painel({ searchParams }: { searchParams: Promise<{ status?: string; nicho?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const banco = obterBanco();
  const status = STATUS.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const leads = banco.listar({ status, nicho: sp.nicho || undefined, limite: 200 });
  const resumo = banco.resumo();
  const hoje = banco.contatadosHoje();
  const podeContatar = hoje < config.limiteDiario;
  const inscricoes = banco.inscricoes();

  return (
    <>
      <p><strong>Leads</strong> · <a href="/painel/alunos">Alunos</a> · <a href="/painel/assinaturas">Assinaturas</a> · <a href="/painel/backup">Baixar backup</a></p>
      <h1>Painel de leads</h1>
      <p>
        Contatos hoje: <strong>{hoje}/{config.limiteDiario}</strong>
        {!podeContatar && " — limite do dia atingido. Volte amanhã: número novo que manda muito é banido."}
      </p>
      <p>
        {STATUS.map((s) => (
          <a key={s} href={`/painel?status=${s}`} className="etiqueta" style={{ marginRight: 8 }}>
            {ROTULO[s]}: {resumo[s]}
          </a>
        ))}
        <a href="/painel">todos</a>
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
          const mostrarConvite = l.status === "novo" && celular && podeContatar;
          return (
            <div key={l.placeId} className="cartao lead">
              <div>
                <span className="etiqueta">{ROTULO[l.status]}</span>{" "}
                <strong>{l.nome}</strong> · ⭐ {l.nota ?? "-"} ({l.avaliacoes ?? 0})
                <br />
                <small>
                  {l.endereco} · {l.telefone ?? "sem telefone"}
                  {l.telefone && !celular && " (fixo — provavelmente sem WhatsApp)"} ·{" "}
                  {l.mapsUrl && <a href={l.mapsUrl} target="_blank" rel="noopener noreferrer">Maps</a>}
                </small>
              </div>
              <div className="acoes">
                {mostrarConvite && (
                  <a className="botao" target="_blank" rel="noopener noreferrer"
                    href={linkWhatsapp(l.telefone!, mensagemConvite(l, config))}>
                    Abrir convite no WhatsApp
                  </a>
                )}
                {(["contatado", "respondeu", "entrou", "cliente", "nao_contatar"] as const)
                  .filter((s) => s !== l.status)
                  .map((s) => (
                    <form key={s} action={marcar}>
                      <input type="hidden" name="id" value={l.placeId} />
                      <input type="hidden" name="status" value={s} />
                      <button type="submit" className="botao-sec">{ROTULO[s]}</button>
                    </form>
                  ))}
              </div>
            </div>
          );
        })}
        {leads.length === 0 && <p>Nenhum lead. Rode <code>npm run prospectar -- buscar barbearia &quot;Sua Cidade UF&quot;</code>.</p>}
      </div>
    </>
  );
}
