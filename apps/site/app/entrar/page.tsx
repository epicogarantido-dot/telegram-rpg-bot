import { redirect } from "next/navigation";
import { gravarSessao, senhaConfere } from "../../lib/painel";

export const metadata = { title: "Entrar", robots: { index: false } };

async function entrar(form: FormData) {
  "use server";
  if (!senhaConfere(String(form.get("senha") ?? ""))) redirect("/entrar?erro=1");
  await gravarSessao();
  redirect("/painel");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <h1>Painel</h1>
      {!process.env.PAINEL_SENHA && <p>Defina PAINEL_SENHA no ambiente para ativar o painel.</p>}
      {erro && <p style={{ color: "crimson" }}>Senha incorreta.</p>}
      <form action={entrar} className="busca">
        <input type="password" name="senha" placeholder="Senha" aria-label="Senha" required />
        <button type="submit">Entrar</button>
      </form>
    </>
  );
}
