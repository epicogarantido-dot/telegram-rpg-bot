import { redirect } from "next/navigation";

/** Endereço do login antigo (com senha). Hoje se entra só pelo WhatsApp. */
export default async function Antigo({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams;
  redirect(voltar ? `/entrar?voltar=${encodeURIComponent(voltar)}` : "/entrar");
}
