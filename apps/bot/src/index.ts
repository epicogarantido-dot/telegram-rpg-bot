/**
 * Bot de WhatsApp via Baileys (protocolo do WhatsApp Web, NÃO é a API oficial).
 *
 * ⚠️ Isso viola os Termos do WhatsApp e o número pode ser banido a qualquer
 * momento. Use um chip dedicado, nunca o seu número pessoal, e mantenha o
 * bot só RESPONDENDO — nada de disparo em massa. Ver docs/whatsapp.md.
 * Convites de prospecção são enviados por uma PESSOA, um a um, pelo painel
 * (/painel); o bot só cuida das respostas, inclusive do "SAIR".
 */
import { Boom } from "@hapi/boom";
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, isPnUser, useMultiFileAuthState } from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { carregarCursos } from "@aprenda/catalogo";
import { BancoProspeccao } from "@aprenda/prospeccao";
import { ehPedidoDeSaida, RESPOSTA_SAIDA, responder, type Contexto } from "./responder.ts";
import { Limitador } from "./limitador.ts";

const PASTA_SESSAO = new URL("../auth/", import.meta.url).pathname;
const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const numeroPareamento = process.env.BOT_NUMERO?.replace(/\D/g, "");

const ctx: Contexto = { cursos: await carregarCursos(), siteUrl };
const limitador = new Limitador({ porMinuto: 6 });
const banco = new BancoProspeccao();
console.log(`📚 ${ctx.cursos.length} cursos carregados`);

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
    if (connection === "open") console.log("✅ Conectado ao WhatsApp");
    if (connection === "close") {
      const status = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        console.error("🚪 Sessão encerrada no celular. Apague apps/bot/auth/ e pareie de novo.");
        process.exit(1);
      }
      console.log(`🔌 Conexão caiu (${status ?? "?"}); reconectando...`);
      void conectar();
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
        if (telefone) banco.bloquear(telefone);
        else console.warn(`Pedido de SAIR sem número identificável (${chat}); bloqueie manualmente.`);
        resposta = RESPOSTA_SAIDA;
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
