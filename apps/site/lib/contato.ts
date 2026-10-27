/** WhatsApp do responsável (ADMIN_WHATSAPP), pra privacidade e termos. */
export function contatoResponsavel(): { link: string; texto: string } | undefined {
  const numero = process.env.ADMIN_WHATSAPP?.replace(/\D/g, "");
  if (!numero || numero.length < 12) return undefined;
  const local = numero.slice(2);
  const texto = `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}`;
  return { link: `https://wa.me/${numero}`, texto };
}
