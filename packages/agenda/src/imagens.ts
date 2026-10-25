import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { ErroAgenda } from "./banco.ts";

/**
 * Fotos enviadas pelos barbeiros. Toda imagem é reprocessada aqui:
 * - vira WebP (leve) em dois tamanhos: grande (1600px) e miniatura (640px);
 * - perde os metadados (EXIF), inclusive a localização GPS que o celular grava;
 * - qualquer coisa que não seja imagem de verdade é recusada.
 * Nunca servimos o arquivo original que a pessoa mandou.
 */
export const MAX_BYTES = 10 * 1024 * 1024;
const FORMATOS = new Set(["jpeg", "png", "webp", "heif", "avif"]);
const NOME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-p)?\.webp$/;

export interface FotoProcessada {
  grande: Buffer;
  pequena: Buffer;
  largura: number;
  altura: number;
}

export async function processarFoto(entrada: Buffer): Promise<FotoProcessada> {
  if (entrada.length > MAX_BYTES) throw new ErroAgenda("Foto grande demais (máximo 10 MB).");
  let meta;
  try {
    meta = await sharp(entrada, { limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new ErroAgenda("Esse arquivo não é uma imagem válida.");
  }
  if (!meta.format || !FORMATOS.has(meta.format)) throw new ErroAgenda("Envie foto em JPG, PNG, WebP ou HEIC.");
  // rotate() sem argumento endireita a foto conforme o EXIF; depois o EXIF é descartado.
  const base = sharp(entrada, { limitInputPixels: 50_000_000 }).rotate();
  const { data: grande, info } = await base.clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const pequena = await base.clone()
    .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 }).toBuffer();
  return { grande, pequena, largura: info.width, altura: info.height };
}

export function pastaFotos(): string {
  if (process.env.FOTOS_DIR) return process.env.FOTOS_DIR;
  let dir = process.cwd();
  while (!existsSync(join(dir, "data"))) {
    const pai = dirname(dir);
    if (pai === dir) throw new Error("Pasta data/ não encontrada; defina FOTOS_DIR.");
    dir = pai;
  }
  return join(dir, "data", "privado", "fotos");
}

export function gravarFoto(arquivo: string, f: FotoProcessada, pasta = pastaFotos()): void {
  mkdirSync(/*turbopackIgnore: true*/ pasta, { recursive: true });
  writeFileSync(/*turbopackIgnore: true*/ join(pasta, `${arquivo}.webp`), f.grande);
  writeFileSync(/*turbopackIgnore: true*/ join(pasta, `${arquivo}-p.webp`), f.pequena);
}

export function apagarFoto(arquivo: string, pasta = pastaFotos()): void {
  for (const n of [`${arquivo}.webp`, `${arquivo}-p.webp`]) rmSync(/*turbopackIgnore: true*/ join(pasta, n), { force: true });
}

/** Lê pelo nome público ("<uuid>.webp" ou "<uuid>-p.webp"); nome fora do padrão nem toca no disco. */
export function lerFoto(nome: string, pasta = pastaFotos()): Buffer | undefined {
  if (!NOME.test(nome)) return undefined;
  const caminho = join(pasta, nome);
  return existsSync(/*turbopackIgnore: true*/ caminho) ? readFileSync(/*turbopackIgnore: true*/ caminho) : undefined;
}

export function nomeValido(nome: string): boolean {
  return NOME.test(nome);
}
