import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { ErroAgenda } from "./banco.ts";
import { pastaFotos } from "./imagens.ts";

/**
 * Comprovante do Pix que o barbeiro manda pelo painel (/app/assinatura). Só o admin vê.
 * - Foto vira WebP (sai o EXIF, inclusive GPS); PDF entra porque muito banco só exporta
 *   o recibo assim, e é conferido pelo começo do arquivo, não pelo que o navegador diz.
 * - O nome é sempre nosso (`<pagamento>-<aleatório>.<ext>`), nunca o que veio do celular.
 * - Fica em data/privado/comprovantes: fora do git e fora do zip da Square.
 */
export const MAX_BYTES_COMPROVANTE = 8 * 1024 * 1024;
const NOME = /^\d+-[0-9a-f]{16}\.(webp|pdf)$/;

export function pastaComprovantes(): string {
  return process.env.COMPROVANTES_DIR ?? join(dirname(pastaFotos()), "comprovantes");
}

export async function prepararComprovante(entrada: Buffer): Promise<{ dados: Buffer; ext: "webp" | "pdf" }> {
  if (entrada.length === 0) throw new ErroAgenda("O arquivo chegou vazio. Tente enviar de novo.");
  if (entrada.length > MAX_BYTES_COMPROVANTE) throw new ErroAgenda("Arquivo grande demais (máximo 8 MB).");
  if (entrada.subarray(0, 5).toString("latin1") === "%PDF-") return { dados: entrada, ext: "pdf" };
  try {
    // Print de comprovante é comprido: limita a largura e deixa a altura ir longe.
    const dados = await sharp(entrada, { limitInputPixels: 50_000_000 }).rotate()
      .resize({ width: 1200, height: 4000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
    return { dados, ext: "webp" };
  } catch {
    throw new ErroAgenda("Mande o comprovante como foto (print da tela) ou PDF.");
  }
}

export function gravarComprovante(pagamentoId: number, c: { dados: Buffer; ext: string }, pasta = pastaComprovantes()): string {
  const nome = `${pagamentoId}-${randomBytes(8).toString("hex")}.${c.ext}`;
  mkdirSync(/*turbopackIgnore: true*/ pasta, { recursive: true });
  const caminho = join(pasta, nome);
  // Grava num temporário e troca: queda no meio não deixa arquivo pela metade.
  writeFileSync(/*turbopackIgnore: true*/ `${caminho}.tmp`, c.dados);
  renameSync(/*turbopackIgnore: true*/ `${caminho}.tmp`, caminho);
  return nome;
}

/** Lê pelo nome; nome fora do padrão nem toca no disco. */
export function lerComprovante(nome: string, pasta = pastaComprovantes()): Buffer | undefined {
  if (!NOME.test(nome)) return undefined;
  const caminho = join(pasta, nome);
  return existsSync(/*turbopackIgnore: true*/ caminho) ? readFileSync(/*turbopackIgnore: true*/ caminho) : undefined;
}

export function apagarComprovante(nome: string, pasta = pastaComprovantes()): void {
  if (NOME.test(nome)) rmSync(/*turbopackIgnore: true*/ join(pasta, nome), { force: true });
}
