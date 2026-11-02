import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TEMAS } from "@aprenda/agenda";
import {
  STATUS, ehCelularBR, linkWhatsapp, mensagemComunidade, mensagemCursos, mensagemDemonstracao, mensagemLembrete, mensagemPrimeiroContato,
  mensagemSegunda, mensagemSiteEGrupo, proximoPasso, DIAS_ATE_LEMBRETE, type Evento, type Lead, type Status,
} from "@aprenda/prospeccao";
import { config, exigirLogin, obterBanco } from "@/lib/painel";
import { criarDemonstracaoParaLead, linkDaDemonstracao } from "@/lib/demonstracao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { FormWhats } from "@/componentes/painel/FormWhats";

/* Cartão de um lead no painel (/painel e /painel/lista): etiqueta, o que fez no site e as ações de cada etapa. */

export const ROTULO: Record<Status, string> = {
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

type Envio = "primeira" | "comunidade" | "lembrete" | "segunda-whatsapp" | "segunda-chegada" | "demo" | "cursos" | "site-grupo";

/**
 * Abre o WhatsApp com a mensagem da etapa e já avança o lead. Quem envia é a pessoa, no
 * WhatsApp dela; o painel só monta o texto e anota (ver docs/abordagem.md).
 */
async function enviar(form: FormData): Promise<string | undefined> {
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
      if (lead.status !== "novo") return;
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
      // Com o código do lead (?l=), o cartão dele mostra o que ele fez no site.
      texto = mensagemDemonstracao(lead, `${linkDaDemonstracao(lead.demoSlug, lead.demoConvite)}&l=${banco.codigoDoLead(lead.placeId)}`);
      status = "demo_enviada";
      break;
    case "comunidade":
      // Convite pra comunidade: vale como 1º contato (quem era novo passa pra "já mandei").
      texto = mensagemComunidade(lead, config);
      if (lead.status === "novo") status = "contatado";
      break;
    case "cursos":
      texto = mensagemCursos(config);
      break;
    case "site-grupo":
      texto = mensagemSiteEGrupo(lead, config, banco.codigoDoLead(lead.placeId));
      break;
  }
  if (!texto) return;
  if (status && status !== lead.status) banco.marcar(lead.placeId, status);
  revalidatePath("/painel", "layout");
  // Devolve o link em vez de redirecionar: o botão não fica preso carregando (ver FormWhats).
  return linkWhatsapp(lead.telefone, texto);
}

async function marcar(form: FormData) {
  "use server";
  await exigirLogin();
  const status = String(form.get("status")) as Status;
  if (!STATUS.includes(status)) return;
  obterBanco().marcar(String(form.get("id")), status);
  revalidatePath("/painel", "layout");
}

async function demonstrar(form: FormData) {
  "use server";
  await exigirLogin();
  const lead = obterBanco().lead(String(form.get("id")));
  if (!lead || lead.status === "nao_contatar") return;
  await criarDemonstracaoParaLead(lead, String(form.get("tema")));
  revalidatePath("/painel", "layout");
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
    <FormWhats acao={enviar}>
      <input type="hidden" name="id" value={lead.placeId} />
      <input type="hidden" name="tipo" value={tipo} />
      <BotaoEnviar className={principal ? "botao" : "botao-sec"} carregando="Abrindo o WhatsApp…">{children}</BotaoEnviar>
    </FormWhats>
  );
}

const PASSO: Record<Evento, string> = {
  abriu: "abriu o site", estilos: "foi ver os estilos", exemplo: "abriu o exemplo", quero: "tocou em Quero",
  whatsapp: "chamou no WhatsApp", cadastro_inicio: "abriu o cadastro", cadastro: "se cadastrou",
};

function haQuanto(em: string, agora: Date): string {
  const min = Math.max(0, Math.round((agora.getTime() - new Date(em).getTime()) / 60_000));
  if (min < 60) return `há ${min} min`;
  if (min < 48 * 60) return `há ${Math.round(min / 60)} h`;
  return `há ${Math.round(min / 1440)} dias`;
}

/** O que o lead fez no site pelo link com o código dele (?l=), do mais recente pro mais antigo. */
export function NoSite({ lead, agora }: { lead: Lead; agora: Date }) {
  const eventos = obterBanco().eventosDoLead(lead.placeId, 6);
  if (eventos.length === 0) return null;
  return (
    <><br /><small className="no-site">🔎 No site: {eventos.map((e, i) => (
      <span key={i}>{i > 0 && " · "}{PASSO[e.evento]}{e.detalhe ? ` ${TEMAS.find((t) => t.id === e.detalhe)?.nome ?? e.detalhe}` : ""} ({haQuanto(e.em, agora)})</span>
    ))}</small></>
  );
}

/** Quantos dias faltam pro lembrete, pra mostrar no cartão. */
function diasParaLembrete(lead: Lead, agora: Date): number {
  const desde = (agora.getTime() - new Date(lead.atualizadoEm ?? lead.contatadoEm ?? agora).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(DIAS_ATE_LEMBRETE - desde));
}

export function AcoesDoLead({ lead, agora }: { lead: Lead; agora: Date }) {
  const celular = !!lead.telefone && ehCelularBR(lead.telefone);
  const passo = proximoPasso(lead, agora);
  const demo = lead.demoSlug && lead.demoConvite ? linkDaDemonstracao(lead.demoSlug, lead.demoConvite) : undefined;
  if (lead.status === "nao_contatar") return null;
  if (!celular) {
    return <div className="acoes"><small>Sem celular: ache o WhatsApp em <a href="/painel/buscar">Buscar</a> · <a href="/painel/divulgacao">Divulgação</a> e use "Completar".</small><Botao lead={lead} status="nao_contatar" perigo>Não contatar</Botao></div>;
  }
  return (
    <div className="etapas-lead">
      {lead.status === "novo" && (
        <FormWhats acao={enviar} className="primeira-mensagem">
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
          <BotaoEnviar className="botao" carregando="Abrindo o WhatsApp…">Abrir 1ª mensagem no WhatsApp</BotaoEnviar>
        </FormWhats>
      )}
      {config.linkGrupo && (
        <div className="acoes"><Enviar lead={lead} tipo="comunidade" principal={lead.status === "novo"}>Convidar pra comunidade</Enviar></div>
      )}

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

