import { contatoResponsavel } from "@/lib/contato";

export const dynamic = "force-dynamic";

/**
 * WhatsApp do responsável (ADMIN_WHATSAPP) pro botão fixo: páginas geradas no build (cursos,
 * Revista) não têm o .env, então o botão pergunta aqui na hora.
 */
export function GET() {
  const contato = contatoResponsavel();
  return Response.json(contato ? { numero: contato.link.replace("https://wa.me/", ""), texto: contato.texto } : {}, {
    headers: { "cache-control": "public, max-age=300" },
  });
}
