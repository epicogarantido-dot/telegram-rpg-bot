import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TEMAS } from "@aprenda/agenda";
import {
  STATUS, ehCelularBR, linkWhatsapp, mensagemCursos, mensagemDemonstracao, mensagemLembrete, mensagemPrimeiroContato,
  mensagemSegunda, mensagemSiteEGrupo, proximoPasso, DIAS_ATE_LEMBRETE, type Lead, type Status,
} from "@aprenda/prospeccao";
import { config, exigirLogin, obterBanco } from "@/lib/painel";
import { criarDemonstracaoParaLead, linkDaDemonstracao } from "@/lib/demonstracao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";

export const metadata = { title: "Painel de leads", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROTULO: Record<Status, string> = {
  novo: "Novo",
  contatado: "1ª mensagem enviada",
  lembrete: "Lembrete enviado",
  respondeu: "Respondeu",
  demo_enviada: "Demonstração enviada",
  cliente: "Cliente",
  sem_resposta: "Sem resposta",
  entrou: "Entrou no grupo",
  nao_contatar: "Não contatar",
};

/** Etapas em que a conversa está viva e cabe montar ou mandar a demonstração. */
const EM_CONVERSA: Status[] = ["contatado", "lembrete", "respondeu", "demo_enviada"];

type Envio = "primeira" | "lembrete" | "segunda-whatsapp" | "segunda-chegada" | "demo" | "cursos" | "site-grupo";

/**
 * Abre o WhatsApp com a mensagem da etapa e já avança o lead. Quem envia é a pessoa, no
 * WhatsApp dela; o painel só monta o texto e anota (ver docs/abordagem.md).
 */
async function enviar(form: FormData) {
  "use server";
  await exigirLogin();
  const banco = obterBanco();
  const lead = banco.lead(String(form.get("id")));
  const tipo = String(form.get("tipo")) as Envio;
  if (!lead?.telefone || lead.status === "nao_contatar") return;
  let texto: string | undefined;
  let status: Status | undefined;
  switch (tipo) {
    case "primeira":
      if (lead.status !== "novo" || banco.contatadosHoje() >= config.limiteDiario) return;
      texto = mensagemPrimeiroContato(lead, config, { detalhe: String(form.get("detalhe") ?? ""), onde: String(form.get("onde") ?? "") });
      status = "contatado";
      break;
    case "lembrete":
      if (lead.status !== "contatado") return;
      texto = mensagemLembrete(lead);
      status = "lembrete";
      break;
    case "segunda-whatsapp":
    case "segunda-chegada":
      texto = mensagemSegunda(lead, tipo === "segunda-whatsapp" ? "whatsapp" : "chegada");
      status = "respondeu";
      break;
    case "demo":
      if (!lead.demoSlug || !lead.demoConvite) return;
      texto = mensagemDemonstracao(lead, linkDaDemonstracao(lead.demoSlug, lead.demoConvite));
      status = "demo_enviada";
      break;
    case "cursos":
      texto = mensagemCursos(config);
      break;
    case "site-grupo":
      texto = mensagemSiteEGrupo(lead, config);
      break;
  }
  if (!texto) return;
  if (status && status !== lead.status) banco.marcar(lead.placeId, status);
  redirect(linkWhatsapp(lead.telefone, texto));
}

async function marcar(form: FormData) {
  "use server";
  await exigirLogin();
  const status = String(form.get("status")) as Status;
  if (!STATUS.includes(status)) return;
  obterBanco().marcar(String(form.get("id")), status);
  revalidatePath("/painel");
}

async function demonstrar(form: FormData) {
  "use server";
  await exigirLogin();
  const lead = obterBanco().lead(String(form.get("id")));
  if (!lead || lead.status === "nao_contatar") return;
  await criarDemonstracaoParaLead(lead, String(form.get("tema")));
  revalidatePath("/painel");
}

function Botao({ lead, status, children, perigo }: { lead: Lead; status: Status; children: React.ReactNode; perigo?: boolean }) {
  return (
    <form action={marcar}>
      <input type="hidden" name="id" value={lead.placeId} />
      <input type="hidden" name="status" value={status} />
      <BotaoEnviar className={perigo ? "botao-sec perigo" : "botao-sec"}>{children}</BotaoEnviar>
    </form>
  );
}

function Enviar({ lead, tipo, children, principal }: { lead: Lead; tipo: Envio; children: React.ReactNode; principal?: boolean }) {
  return (
    <form action={enviar}>
      <input type="hidden" name="id" value={lead.placeId} />
      <input type="hidden" name="tipo" value={tipo} />
      <BotaoEnviar className={principal ? "botao" : "botao-sec"}>{children}</BotaoEnviar>
    </form>
  );
}

/** Quantos dias faltam pro lembrete, pra mostrar no cartão. */
function diasParaLembrete(lead: Lead, agora: Date): number {
  const desde = (agora.getTime() - new Date(lead.atualizadoEm ?? lead.contatadoEm ?? agora).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(DIAS_ATE_LEMBRETE - desde));
}

function AcoesDoLead({ lead, podeContatar, agora }: { lead: Lead; podeContatar: boolean; agora: Date }) {
  const celular = !!lead.telefone && ehCelularBR(lead.telefone);
  const passo = proximoPasso(lead, agora);
  const demo = lead.demoSlug && lead.demoConvite ? linkDaDemonstracao(lead.demoSlug, lead.demoConvite) : undefined;
  if (lead.status === "nao_contatar") return null;
  if (!celular) {
    return <div className="acoes"><small>Sem celular: ache o WhatsApp em <a href="/painel/buscar">Buscar</a> · <a href="/painel/divulgacao">Divulgação</a> e use "Completar".</small><Botao lead={lead} status="nao_contatar" perigo>Não contatar</Botao></div>;
  }
  return (
    <div className="etapas-lead">
      {lead.status === "novo" && (podeContatar ? (
        <form action={enviar} className="primeira-mensagem">
          <input type="hidden" name="id" value={lead.placeId} />
          <input type="hidden" name="tipo" value="primeira" />
          <label>
            Onde você viu
            <select name="onde" defaultValue={lead.instagram ? "no Instagram" : ""}>
              <option value="">(não dizer)</option>
              <option>no Instagram</option>
              <option>no Google</option>
              <option>no Facebook</option>
            </select>
          </label>
          <label>
            Um detalhe real que você viu <small>(opcional)</small>
            <input name="detalhe" placeholder="do degradê do último post" maxLength={80} />
          </label>
          <BotaoEnviar className="botao">Abrir 1ª mensagem no WhatsApp</BotaoEnviar>
        </form>
      ) : <small>Limite de hoje atingido. Este fica pra amanhã.</small>)}

      {(lead.status === "contatado" || lead.status === "lembrete") && (
        <p className="situacao">
          {passo === "lembrete" && <strong>Hoje é dia do lembrete. </strong>}
          {passo === "desistir" && <strong>Sem resposta depois do lembrete: hora de parar. </strong>}
          {!passo && lead.status === "contatado" && <>Esperando resposta. Lembrete em {diasParaLembrete(lead, agora)} dia(s). </>}
          {!passo && lead.status === "lembrete" && <>Lembrete enviado. Se não responder, para por aqui. </>}
        </p>
      )}

      <div className="acoes">
        {passo === "lembrete" && <Enviar lead={lead} tipo="lembrete" principal>Mandar lembrete</Enviar>}
        {passo === "desistir" && <Botao lead={lead} status="sem_resposta">Encerrar: sem resposta</Botao>}
        {["contatado", "lembrete", "sem_resposta"].includes(lead.status) && (
          <>
            <Enviar lead={lead} tipo="segunda-whatsapp">Respondeu: marca pelo WhatsApp</Enviar>
            <Enviar lead={lead} tipo="segunda-chegada">Respondeu: ordem de chegada</Enviar>
          </>
        )}
        {demo && EM_CONVERSA.includes(lead.status) && (
          <>
            <Enviar lead={lead} tipo="demo" principal={lead.status === "respondeu"}>
              {lead.status === "demo_enviada" ? "Mandar o link de novo" : "Mandar demonstração"}
            </Enviar>
            <a className="botao-sec" href={`/b/${lead.demoSlug}`} target="_blank" rel="noopener noreferrer">Ver demonstração</a>
          </>
        )}
        {lead.status === "demo_enviada" && <Botao lead={lead} status="cliente">Virou cliente</Botao>}
        {config.siteUrl && EM_CONVERSA.includes(lead.status) && <Enviar lead={lead} tipo="site-grupo">Site + grupo</Enviar>}
        {config.siteUrl && EM_CONVERSA.includes(lead.status) && <Enviar lead={lead} tipo="cursos">Presente: cursos grátis</Enviar>}
        <Botao lead={lead} status="nao_contatar" perigo>Pediu SAIR</Botao>
      </div>

      {!demo && EM_CONVERSA.includes(lead.status) && (
        <form action={demonstrar} className="acoes">
          <input type="hidden" name="id" value={lead.placeId} />
          <label>
            Estilo
            <select name="tema" defaultValue="atemporal">
              {TEMAS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </label>
          <BotaoEnviar className="botao-sec" carregando="Montando o site…">Criar demonstração</BotaoEnviar>
        </form>
      )}
    </div>
  );
}

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
  const podeContatar = hoje < config.limiteDiario;
  const inscricoes = banco.inscricoes();

  return (
    <>
      <p><strong>Leads</strong> · <a href="/painel/buscar">Buscar</a> · <a href="/painel/cartao">Cartão pra visitas</a> · <a href="/painel/assinaturas">Vendas</a> · <a href="/painel/backup">Baixar backup</a></p>
      <h1>Painel de leads</h1>
      <p>
        Primeiras mensagens hoje: <strong>{hoje}/{config.limiteDiario}</strong>
        {!podeContatar && " — limite do dia atingido. Volte amanhã: número que manda muito pra quem não responde é limitado ou banido."}
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
              </div>
              <AcoesDoLead lead={l} podeContatar={podeContatar} agora={agora} />
            </div>
          );
        })}
        {leads.length === 0 && <p>Nenhum lead aqui. <a href="/painel/buscar">Buscar barbearias</a> pela base da Receita ou pelo Google e Instagram.</p>}
      </div>
    </>
  );
}
