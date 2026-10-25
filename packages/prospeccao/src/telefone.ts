/** "+55 11 98765-4321" -> "5511987654321". Sem DDI, assume Brasil. */
export function normalizarTelefone(bruto: string | undefined): string | undefined {
  if (!bruto) return undefined;
  let d = bruto.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d.length >= 12 ? d : undefined;
}

/** Celular brasileiro: 55 + DDD + 9 dígitos começando com 9. Fixo quase nunca tem WhatsApp. */
export function ehCelularBR(tel: string): boolean {
  return /^55\d{2}9\d{8}$/.test(tel);
}

export function linkWhatsapp(tel: string, mensagem: string): string {
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`;
}
