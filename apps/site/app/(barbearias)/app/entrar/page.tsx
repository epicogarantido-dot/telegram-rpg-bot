import Link from "next/link";
import { redirect } from "next/navigation";
import { gravarSessaoAgenda, mensagemDeErro, obterAgenda } from "@/lib/agenda";

export const metadata = { title: "Entrar — Agenda" };

async function entrar(form: FormData) {
  "use server";
  let token: string;
  try {
    token = obterAgenda().entrar(String(form.get("email") ?? ""), String(form.get("senha") ?? ""));
  } catch (e) {
    redirect(`/app/entrar?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  await gravarSessaoAgenda(token);
  redirect("/app");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <h1>Entrar na agenda</h1>
      {erro && <p className="erro">{erro}</p>}
      <form action={entrar} className="formulario">
        <input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
        <input name="senha" type="password" placeholder="Senha" required autoComplete="current-password" />
        <button type="submit">Entrar</button>
      </form>
      <p>Ainda não tem? <Link href="/app/cadastro">Criar conta grátis</Link></p>
    </>
  );
}
