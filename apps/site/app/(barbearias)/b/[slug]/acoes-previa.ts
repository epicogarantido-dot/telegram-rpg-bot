"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { temaValido } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";
import { conviteDaPrevia } from "@/lib/previa";

/** Troca o estilo da prévia montada neste aparelho (só ela: quem confere é o convite do cookie). */
export async function trocarEstiloDaPrevia(form: FormData) {
  const banco = obterAgenda();
  const b = banco.barbeariaPorId(Number(form.get("id")));
  const tema = String(form.get("tema") ?? "");
  if (!b || !temaValido(tema) || !(await conviteDaPrevia(b.id))) redirect("/montar");
  banco.atualizarSite(b.id, { tema, bio: b.bio, cidade: b.cidade, instagram: b.instagram, oferta: b.oferta, desde: b.desde ?? null });
  // Sem isso o navegador reaproveita a casca (layout) antiga, com o tema anterior.
  revalidatePath(`/b/${b.slug}`, "layout");
  redirect(`/b/${b.slug}`);
}
