// Gera public/og-venda.jpg: a imagem que aparece quando o link do site é mandado no WhatsApp
// (1200×630, JPEG, que todo app de mensagem mostra). Três estilos no celular, lado a lado.
//   node apps/site/scripts/og-venda.mjs
import sharp from "sharp";
import { join } from "node:path";

const pasta = new URL("../public/", import.meta.url).pathname;
const estilos = ["cerimonia", "potencia", "atemporal"];
const altura = 560;
const largura = Math.round(altura * 390 / 780);
const celulares = await Promise.all(estilos.map(async (e) => sharp(join(pasta, "barbeiros", `${e}.webp`))
  .resize(largura, altura).composite([{
    input: Buffer.from(`<svg width="${largura}" height="${altura}"><rect width="${largura}" height="${altura}" rx="26" ry="26"/></svg>`),
    blend: "dest-in",
  }]).png().toBuffer()));
const espaco = 40;
const inicio = Math.round((1200 - (largura * 3 + espaco * 2)) / 2);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#120b14" } })
  .composite(celulares.map((input, i) => ({ input, left: inicio + i * (largura + espaco), top: 35 })))
  .jpeg({ quality: 82 })
  .toFile(join(pasta, "og-venda.jpg"));
console.log("public/og-venda.jpg");
