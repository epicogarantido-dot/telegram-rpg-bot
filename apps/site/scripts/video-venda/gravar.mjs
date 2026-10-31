// Grava o vídeo de venda (Reels, Status, TikTok): 1080×1920, 30 quadros por segundo, ~31 s.
// O video.html tem todas as animações paradas; aqui cada quadro anda o relógio delas e tira um print,
// e o ffmpeg junta os quadros num MP4 (H.264, áudio mudo pra todo app aceitar).
//   node apps/site/scripts/video-venda/gravar.mjs [saida.mp4]
// Telas usadas: public/funcionalidades/*.webp e public/barbeiros/*.webp (prints do sistema de verdade).
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const html = fileURLToPath(new URL("video.html", import.meta.url));
const saida = process.argv[2] ?? fileURLToPath(new URL("../../../../dist/video-venda.mp4", import.meta.url));
const QPS = 30;
const DURACAO = 31;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
await pagina.goto(pathToFileURL(html).href);
await pagina.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });

const ffmpeg = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(QPS), "-c:v", "mjpeg", "-i", "-",
  "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
  "-shortest", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", saida,
], { stdio: ["pipe", "inherit", "inherit"] });

const total = QPS * DURACAO;
for (let q = 0; q < total; q++) {
  await pagina.evaluate((ms) => { for (const a of document.getAnimations()) a.currentTime = ms; }, (q * 1000) / QPS);
  const quadro = await pagina.screenshot({ type: "jpeg", quality: 92 });
  if (!ffmpeg.stdin.write(quadro)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  if (q % QPS === 0) process.stdout.write(`\r${q / QPS}s de ${DURACAO}s`);
}
ffmpeg.stdin.end();
await new Promise((ok, erro) => ffmpeg.on("close", (c) => (c === 0 ? ok() : erro(new Error(`ffmpeg saiu com ${c}`)))));
await navegador.close();
console.log(`\n${saida}`);
