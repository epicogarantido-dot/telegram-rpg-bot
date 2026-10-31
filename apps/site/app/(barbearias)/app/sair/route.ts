import { redirect } from "next/navigation";
import { encerrarSessaoAgenda } from "@/lib/agenda";

/** Sair (usado pelo menu da equipe, que não tem a página Minha conta). */
export async function GET() {
  await encerrarSessaoAgenda();
  redirect("/app/entrar");
}
