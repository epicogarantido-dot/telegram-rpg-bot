/**
 * Pix "copia e cola" estático (BR Code, padrão EMV do Banco Central).
 * Gerado aqui mesmo, sem PSP nem taxa: qualquer app de banco lê. Como é
 * estático, o banco não avisa ninguém quando o pagamento cai — por isso
 * a confirmação é manual, pelo admin, conferindo o extrato.
 */
export interface DadosPix {
  chave: string;
  nome: string; // recebedor, até 25 caracteres
  cidade: string; // até 15 caracteres
  valorCentavos: number;
  txid: string; // identificador que aparece no extrato, até 25 alfanuméricos
  descricao?: string;
}

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

/** Sem acento e só caracteres que todo banco aceita. */
function limpar(texto: string, max: number): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^A-Za-z0-9 .\-]/g, "").trim().slice(0, max);
}

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(payload, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPixCopiaECola(d: DadosPix): string {
  const txid = d.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", d.chave.trim()) +
    (d.descricao ? campo("02", limpar(d.descricao, 40)) : "");
  const semCrc =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    (d.valorCentavos > 0 ? campo("54", (d.valorCentavos / 100).toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", limpar(d.nome, 25)) +
    campo("60", limpar(d.cidade, 15)) +
    campo("62", campo("05", txid)) +
    "6304";
  return semCrc + crc16(semCrc);
}
