import { writeFileSync } from "node:fs";
import type { BancoProspeccao } from "./banco.ts";

/** Planilha (CSV com ";", abre direto no Excel/Google Planilhas em português). */
export function exportarCsv(banco: BancoProspeccao, arquivo: string, filtro: { uf?: string; soConfirmados?: boolean } = {}): number {
  const where: string[] = ["status != 'nao_contatar'"];
  const args: string[] = [];
  if (filtro.uf) { where.push("uf = ?"); args.push(filtro.uf.toUpperCase()); }
  if (filtro.soConfirmados) where.push("(avisos IS NULL OR avisos NOT LIKE '%pode ser salão%')");
  const linhas = banco.db.prepare(`SELECT uf, cidade, nome, telefone, email, instagram, endereco, cnpj, abertura, avisos, status, fonte
    FROM leads WHERE ${where.join(" AND ")} ORDER BY uf, cidade, nome`).all(...args) as Record<string, string | null>[];
  const colunas = ["uf", "cidade", "nome", "telefone", "email", "instagram", "endereco", "cnpj", "abertura", "avisos", "status", "fonte"];
  const campo = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const csv = [colunas.join(";"), ...linhas.map((l) => colunas.map((c) => campo(l[c])).join(";"))].join("\r\n");
  // BOM: o Excel reconhece os acentos.
  writeFileSync(arquivo, "﻿" + csv, "utf8");
  return linhas.length;
}
