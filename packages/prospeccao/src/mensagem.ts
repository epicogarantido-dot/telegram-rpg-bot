import type { Lead } from "./banco.ts";

/**
 * Mensagens do primeiro contato (ver docs/abordagem.md). Quem manda é uma PESSOA, do WhatsApp
 * dela, uma a uma. Objetivo da 1ª mensagem: ganhar uma resposta, não vender. Por isso: diz
 * quem é, por que ESTA barbearia, faz uma pergunta fácil, não tem link, e explica como sair.
 */
export interface ConfigConvite {
  /** Quem assina: "João, do Aprenda Livre". */
  remetente: string;
  /** Endereço público do site (sem barra no fim), pro presente dos cursos grátis. */
  siteUrl?: string;
  /** Convite do grupo de barbeiros no WhatsApp (COMUNIDADE_LINK). */
  linkGrupo?: string;
}

export type Resposta = "whatsapp" | "chegada";

/** "Barbearia do Zé - Centro" → "Barbearia do Zé". */
export function primeiroNome(nomeNegocio: string): string {
  return nomeNegocio.replace(/\s*[-|–].*$/, "").trim();
}

/** Nome da Receita vem em maiúsculas: "BARBEARIA DO ZE" → "Barbearia do Ze". */
export function nomeParaMensagem(nome: string): string {
  // "BARBEARIA X LTDA" → "Barbearia X": tipo de empresa não vai na conversa.
  const curto = primeiroNome(nome).replace(/[\s.,-]+(LTDA|ME|EPP|EIRELI|MEI|S\/?A)\.?$/i, "").trim();
  if (curto !== curto.toUpperCase()) return curto;
  // Palavra com número ("3XR", "B2") é sigla: fica como está.
  return curto.split(" ").map((p) => /\d/.test(p) ? p : p.toLowerCase().replace(/^\p{L}/u, (l) => l.toUpperCase())).join(" ")
    .replace(/ (De|Da|Do|Das|Dos|E) /g, (m) => m.toLowerCase());
}

const SAIR = "(Se preferir não receber mensagem, responde SAIR que eu não mando mais.)";

/**
 * 1ª mensagem (texto do dono, 01/11/2026): diz quem é, o que fez (site de agendamento e de
 * apresentação que o barbeiro edita como quiser), como ajuda a barbearia a render mais e termina
 * numa pergunta, sem link (o link vai depois que ele responde). `detalhe`/`onde` entram se a pessoa
 * viu algo de verdade no perfil ("Vi a X no Instagram e gostei do degradê").
 */
export function mensagemPrimeiroContato(
  lead: Pick<Lead, "nome" | "abertura">,
  cfg: ConfigConvite,
  extra: { detalhe?: string; onde?: string; agora?: Date } = {},
): string {
  const nome = nomeParaMensagem(lead.nome);
  const onde = extra.onde?.trim() ? ` ${extra.onde.trim()}` : "";
  const visto = extra.detalhe?.trim() ? ` Vi a ${nome}${onde} e gostei ${extra.detalhe.trim()}.` : "";
  return [
    `Olá, ${nome}! Tudo bem? Aqui é ${cfg.remetente}.${visto}`,
    "Vi que você é empresário do ramo das barbearias e por isso estou te chamando: eu fiz um site de agendamento e de apresentação pra barbearia, que você mesmo edita do jeito que quiser (fotos, serviços, preços, equipe e horários).",
    "Ele ajuda a barbearia a render mais: o cliente marca sozinho, a qualquer hora, sem você parar o corte pra responder no WhatsApp. Os horários vagos ficam à vista de quem quer marcar, e você confirma cada cliente com um toque, o que ajuda a diminuir as faltas.",
    `Posso te mostrar como ficaria o da ${nome}?`,
    SAIR,
  ].join("\n\n");
}

/** 2ª mensagem, depende do que a pessoa respondeu. Ainda sem link: pergunta se pode mandar. */
export function mensagemSegunda(lead: Pick<Lead, "nome">, resposta: Resposta): string {
  const nome = nomeParaMensagem(lead.nome);
  return resposta === "whatsapp"
    ? `Entendi! Muita gente perde cliente por não conseguir responder no meio do corte. Montei um exemplo de como ficaria um site com agenda pra ${nome}: o cliente vê os cortes, escolhe o horário e marca sozinho, e você recebe o aviso no celular. Quer que eu te mande o link pra ver?`
    : `Entendi! Tem um jeito de mostrar a fila no celular do cliente, pra ele saber se vale ir agora, e de quem preferir já deixar o horário marcado. Montei um exemplo de como ficaria pra ${nome}. Quer que eu te mande o link pra ver?`;
}

/** Quando a pessoa diz que quer ver: o link da demonstração com o nome dela. */
export function mensagemDemonstracao(lead: Pick<Lead, "nome">, link: string): string {
  const nome = nomeParaMensagem(lead.nome);
  return [
    `Olha como ficaria o site da ${nome}:`,
    link,
    `O cliente vê os cortes, escolhe o horário e marca sozinho. As fotos são de exemplo; com as suas fica ainda melhor. Se gostar, é só tocar em "Quero este site", no alto da página, e em uns 5 minutos ele é seu.`,
  ].join("\n\n");
}

/** Um lembrete só, 3-4 dias depois da 1ª mensagem sem resposta. Depois disso, para. */
export function mensagemLembrete(lead: Pick<Lead, "nome">): string {
  return `Oi! Só pra não sumir: quer ver como ficaria o site da ${nomeParaMensagem(lead.nome)}? Se não for o momento, sem problema.\n\n${SAIR}`;
}

/**
 * Depois que o lead respondeu: o site (conteúdo grátis + o site da barbearia) e o grupo, numa
 * mensagem só. Nunca na 1ª mensagem: link pra quem não conversou com você é o que o WhatsApp
 * mais trata como spam.
 */
export function mensagemSiteEGrupo(lead: Pick<Lead, "nome">, cfg: ConfigConvite, codigo?: string): string | undefined {
  if (!cfg.siteUrl) return undefined;
  // Com o código do lead (?l=), o painel mostra o que ele fez no site.
  const site = `${cfg.siteUrl}/?origem=convite${codigo ? `&l=${codigo}` : ""}`;
  const grupo = cfg.linkGrupo ? `\n\nE tem o grupo de barbeiros, onde eu posto as matérias novas e dicas pra lotar a agenda. Se quiser entrar: ${cfg.linkGrupo}` : "";
  return `Aqui o site: tem cursos e matérias grátis pra quem tem barbearia (preço, cliente que volta, divulgação), sem cadastro. E dá pra ver como ficaria um site com agenda pra ${nomeParaMensagem(lead.nome)}: ${site}${grupo}`;
}

/** O presente: cursos grátis no site, abertos, sem cadastro. */
export function mensagemCursos(cfg: ConfigConvite): string | undefined {
  if (!cfg.siteUrl) return undefined;
  return `Ah, e tem uns cursos grátis pra quem tem barbearia (preço e lucro, cliente que volta, dinheiro em ordem). É aberto, sem cadastro: ${cfg.siteUrl}/cursos?origem=presente`;
}

/** Dias que a 1ª mensagem espera resposta antes do lembrete, e o lembrete antes de desistir. */
export const DIAS_ATE_LEMBRETE = 3;
export const DIAS_ATE_DESISTIR = 4;

/** O que fazer com o lead hoje, pela etapa e pelo tempo desde a última mensagem. */
export function proximoPasso(lead: Pick<Lead, "status" | "atualizadoEm">, agora = new Date()): "lembrete" | "desistir" | undefined {
  if (!lead.atualizadoEm) return undefined;
  const dias = (agora.getTime() - new Date(lead.atualizadoEm).getTime()) / 86_400_000;
  if (lead.status === "contatado" && dias >= DIAS_ATE_LEMBRETE) return "lembrete";
  if (lead.status === "lembrete" && dias >= DIAS_ATE_DESISTIR) return "desistir";
  return undefined;
}
