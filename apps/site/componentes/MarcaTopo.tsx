"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Marca do topo no site de leads: quem chega pra comprar vê "Site da Barbearia" (o produto);
 * quem está lendo curso ou matéria vê "Aprenda Livre" (o conteúdo).
 */
export function MarcaTopo() {
  const conteudo = /^\/(cursos|revista|licencas)(\/|$)/.test(usePathname() ?? "");
  return conteudo
    ? <Link href="/cursos" className="marca">Aprenda Livre</Link>
    : <Link href="/" className="marca">Site da Barbearia</Link>;
}
