/**
 * Bot de WhatsApp via Baileys (protocolo do WhatsApp Web, NÃO é a API oficial).
 *
 * ⚠️ Isso viola os Termos do WhatsApp e o número pode ser banido a qualquer
 * momento. Use um chip dedicado, nunca o seu número pessoal, e mantenha o
 * bot só RESPONDENDO — nada de disparo em massa. Ver docs/whatsapp.md.
 * Convites de prospecção são enviados por uma PESSOA, um a um, pelo painel
 * (/painel); o bot só cuida das respostas, inclusive do "SAIR".
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Boom } from "@hapi/boom";
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, isPnUser, useMultiFileAuthState } from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { carregarCursos } from "@aprenda/catalogo";
import { ehPedidoDeEntrada, ehPedidoDeSaida, RESPOSTA_SAIDA, responder, type Contexto } from "./responder.ts";
import { Limitador } from "./limitador.ts";

// BOT_SESSAO: onde fica a sessão do WhatsApp (no pacote da Square Cloud, ./auth ao lado do bot).
const PASTA_SESSAO = process.env.BOT_SESSAO ?? new URL("../auth/", import.meta.url).pathname;
const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const numeroPareamento = process.env.BOT_NUMERO?.replace(/\D/g, "");

const ctx: Contexto = { cursos: await carregarCursos(), siteUrl };
const limitador = new Limitador({ porMinuto: 6 });
const segredoSite = process.env.BOT_SEGREDO ?? "";

/** Chama uma rota do site em nome do bot (segredo compartilhado). */
async function chamarSite(caminho: string, corpo: object): Promise<Response> {
  return fetch(`${siteUrl.replace(/\/$/, "")}${caminho}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${segredoSite}` },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(10_000),
  });
}

/**
 * SAIR é permanente e fica no banco de leads do site (o bot pode rodar em outro servidor).
 * Se o site não responder, o número fica numa lista em disco e o bot tenta de novo.
 */
const ARQUIVO_SAIR = join(PASTA_SESSAO, "..", "sair-pendentes.json");
function saidasPendentes(): string[] {
  try {
    return existsSync(ARQUIVO_SAIR) ? (JSON.parse(readFileSync(ARQUIVO_SAIR, "utf8")) as string[]) : [];
  } catch {
    return [];
  }
}
function guardarPendentes(lista: string[]): void {
  mkdirSync(join(ARQUIVO_SAIR, ".."), { recursive: true });
  writeFileSync(ARQUIVO_SAIR, JSON.stringify([...new Set(lista)]));
}
async function avisarSaida(telefone: string): Promise<boolean> {
  try {
    return segredoSite.length >= 24 && (await chamarSite("/api/whatsapp/sair", { telefone })).ok;
  } catch {
    return false;
  }
}
async function registrarSaida(telefone: string): Promise<void> {
  if (await avisarSaida(telefone)) return;
  console.warn(`SAIR de ${telefone} não chegou ao site; vou tentar de novo.`);
  guardarPendentes([...saidasPendentes(), telefone]);
}
async function reenviarSaidas(): Promise<void> {
  const pendentes = saidasPendentes();
  if (!pendentes.length) return;
  const falharam: string[] = [];
  for (const t of pendentes) if (!(await avisarSaida(t))) falharam.push(t);
  guardarPendentes(falharam);
}
setInterval(() => void reenviarSaidas(), 10 * 60_000).unref();
void reenviarSaidas();

/**
 * Pedido de entrada: quem manda a mensagem prova que é dono do número. O bot não
 * decide nada, só repassa (número real + nome do perfil) e devolve a resposta do
 * site, que já vem com o link pessoal de entrada.
 */
async function pedirLinkDeEntrada(telefone: string, nome: string | undefined): Promise<string> {
  if (segredoSite.length < 24) return "A entrada pelo WhatsApp está indisponível no momento. Tente mais tarde.";
  try {
    const r = await chamarSite("/api/whatsapp/entrada", { telefone, nome });
    const d = (await r.json()) as { ok?: boolean; mensagem?: string };
    return d.mensagem ?? "Não consegui gerar seu link agora. Mande *entrar* de novo em instantes.";
  } catch (e) {
    console.error("Falha ao falar com o site:", e);
    return "Não consegui gerar seu link agora. Mande *entrar* de novo em instantes.";
  }
}
console.log(`📚 ${ctx.cursos.length} cursos carregados`);

let tentativas = 0;
async function conectar(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(PASTA_SESSAO);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "warn" }),
    markOnlineOnConnect: false,
  });

  sock.ev.on("creds.update", saveCreds);

  if (numeroPareamento && !state.creds.registered) {
    // Alternativa ao QR: código de 8 dígitos digitado no celular (Aparelhos conectados).
    setTimeout(async () => {
      const codigo = await sock.requestPairingCode(numeroPareamento);
      console.log(`🔑 Código de pareamento: ${codigo}`);
    }, 3000);
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr && !numeroPareamento) {
      console.log("📱 Escaneie no WhatsApp > Aparelhos conectados:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      tentativas = 0;
      console.log("✅ Conectado ao WhatsApp");
    }
    if (connection === "close") {
      const status = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        console.error(`🚪 Sessão encerrada no celular. Apague ${PASTA_SESSAO} e pareie de novo.`);
        process.exit(1);
      }
      // Espera cada vez mais (até 1 min) pra não martelar o WhatsApp quando a rede cai.
      const espera = Math.min(60_000, 2_000 * 2 ** Math.min(tentativas++, 5));
      console.log(`🔌 Conexão caiu (${status ?? "?"}); reconectando em ${espera / 1000} s...`);
      setTimeout(() => void conectar(), espera);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      const chat = msg.key.remoteJid;
      if (!chat || msg.key.fromMe) continue;
      // Só conversa privada: em grupo o bot ficaria respondendo todo mundo.
      if (chat.endsWith("@g.us") || chat === "status@broadcast") continue;

      const texto = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text;
      if (!texto) continue;
      if (!limitador.permitir(chat)) continue;

      // No WhatsApp novo o chat pode vir como LID (@lid); o número real vem em remoteJidAlt.
      const jidTelefone = isPnUser(chat) ? chat : msg.key.remoteJidAlt;
      const telefone = jidTelefone?.split("@")[0]?.split(":")[0];

      let resposta: string | null;
      if (ehPedidoDeSaida(texto)) {
        if (telefone) await registrarSaida(telefone);
        else console.warn(`Pedido de SAIR sem número identificável (${chat}); bloqueie manualmente.`);
        resposta = RESPOSTA_SAIDA;
      } else if (ehPedidoDeEntrada(texto)) {
        resposta = telefone
          ? await pedirLinkDeEntrada(telefone, msg.pushName ?? undefined)
          : "Não consegui identificar seu número. Tente mandar de novo daqui a pouco.";
      } else {
        resposta = responder(texto, ctx);
      }
      if (!resposta) continue;
      try {
        await sock.readMessages([msg.key]);
        await sock.sendPresenceUpdate("composing", chat);
        await new Promise((r) => setTimeout(r, 800 + Math.min(resposta.length * 10, 2500)));
        await sock.sendMessage(chat, { text: resposta }, { quoted: msg });
      } catch (e) {
        console.error(`Falha ao responder ${chat}:`, e);
      }
    }
  });
}

await conectar();
