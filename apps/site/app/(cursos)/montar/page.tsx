import { redirect } from "next/navigation";

/**
 * Endereço antigo do "Quero meu site" (posts do grupo e cartões já divulgados apontam pra cá).
 * Não se monta mais prévia: a compra vai direto pro cadastro, com a origem do link junto.
 */
export default async function Montar({ searchParams }: { searchParams: Promise<{ origem?: string }> }) {
  const { origem } = await searchParams;
  redirect(`/app/cadastro${origem && /^[a-z0-9-]{2,60}$/.test(origem) ? `?origem=${origem}` : ""}`);
}
