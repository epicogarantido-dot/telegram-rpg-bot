import Link from "next/link";
import { revalidatePath } from "next/cache";
import { exigirLogin } from "@/lib/painel";
import { obterMembros } from "@/lib/membros";

export const metadata = { title: "Alunos", robots: { index: false } };
export const dynamic = "force-dynamic";

async function verificar(form: FormData) {
  "use server";
  await exigirLogin();
  obterMembros().verificarManualmente(String(form.get("telefone")));
  revalidatePath("/painel/alunos");
}

export default async function Alunos() {
  await exigirLogin();
  const banco = obterMembros();
  const r = banco.resumo();
  const lista = banco.listar();
  return (
    <>
      <p><Link href="/painel">Leads</Link> · <strong>Alunos</strong> · <Link href="/painel/assinaturas">Assinaturas</Link></p>
      <h1>Alunos</h1>
      <p>{r.total} cadastrados · {r.verificados} com WhatsApp confirmado · {r.ultimos7 ?? 0} nos últimos 7 dias</p>
      <p className="suave pequeno">Todos aceitaram receber mensagens no cadastro. Quem responder SAIR ao bot sai da lista de contato.</p>
      {lista.map((m) => (
        <div key={m.id} className="item-config">
          <span>
            {m.verificado ? "🟢" : "⚪"} {m.nome} ·{" "}
            <a href={`https://wa.me/${m.telefone}`} target="_blank" rel="noopener noreferrer">{m.telefone}</a> · {m.criadoEm.slice(0, 10)}
          </span>
          {!m.verificado && (
            <form action={verificar}>
              <input type="hidden" name="telefone" value={m.telefone} />
              <button className="botao-sec">Confirmar na mão</button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}
