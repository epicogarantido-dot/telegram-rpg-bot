import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agoraNoFuso, formatarData, somarDias } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";

export const metadata = { title: "Planos mensais", robots: { index: false } };
export const dynamic = "force-dynamic";

/** "80", "80,00" ou "R$ 80,00" → centavos. */
function lerValor(texto: string): number {
  const limpo = texto.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return Math.round(Number(limpo) * 100);
}

async function salvar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  try {
    const telefone = normalizarTelefone(String(form.get("telefone") ?? ""));
    if (!telefone) throw new Error("WhatsApp inválido.");
    obterAgenda().salvarPlano(barbearia.id, {
      telefone, nome: String(form.get("nome") ?? ""), usosPorMes: Number(form.get("usos")),
      valorCentavos: lerValor(String(form.get("valor") ?? "")), validoAte: String(form.get("ate") ?? ""),
    });
  } catch (e) {
    redirect(`/app/planos?erro=${encodeURIComponent(e instanceof Error && e.message === "WhatsApp inválido." ? e.message : mensagemDeErro(e))}`);
  }
  revalidatePath("/app/planos");
  revalidatePath("/app");
}

async function renovar(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  const banco = obterAgenda();
  const p = banco.planos(barbearia.id).find((x) => x.id === Number(form.get("id")));
  if (!p) return;
  const hoje = agoraNoFuso(barbearia.fuso).slice(0, 10);
  // Mais um mês a partir do vencimento (ou de hoje, se já venceu).
  banco.salvarPlano(barbearia.id, { ...p, validoAte: somarDias(p.validoAte < hoje ? hoje : p.validoAte, 30) });
  revalidatePath("/app/planos");
}

async function remover(form: FormData) {
  "use server";
  const { barbearia } = await exigirAcessoAtivo();
  obterAgenda().removerPlano(barbearia.id, Number(form.get("id")));
  revalidatePath("/app/planos");
}

export default async function Planos({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { barbearia } = await exigirAcessoAtivo();
  const { erro } = await searchParams;
  const planos = obterAgenda().planos(barbearia.id);
  const hoje = agoraNoFuso(barbearia.fuso).slice(0, 10);
  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Planos mensais</h1>
      <p>
        Cliente que paga por mês (ex.: 2 cortes por R$ 80) vira agenda garantida. Cadastre aqui quem tem plano: a agenda mostra
        quantos usos do mês ele já marcou. A cobrança continua com você, no Pix; quando ele pagar, toque em &quot;Renovar 30 dias&quot;.
      </p>
      {erro && <p className="erro" role="alert">{erro}</p>}

      {planos.length === 0 && <p className="suave">Nenhum plano ainda.</p>}
      <ul className="lista-sumidos">
        {planos.map((p) => (
          <li key={p.id} className={`cartao hoje-linha ${p.vencido ? "plano-vencido" : ""}`}>
            <div>
              <strong>{p.nome}</strong> · {p.usosPorMes} por mês · {reais(p.valorCentavos)}
              <p className="suave pequeno">
                {p.usadosNoMes} de {p.usosPorMes} marcados este mês · {p.vencido ? `venceu ${formatarData(p.validoAte)}` : `vale até ${formatarData(p.validoAte)}`}
              </p>
            </div>
            <div className="acoes">
              <form action={renovar}><input type="hidden" name="id" value={p.id} /><button className="botao-sec">Renovar 30 dias</button></form>
              <form action={remover}><input type="hidden" name="id" value={p.id} /><button className="botao-sec perigo">Tirar</button></form>
            </div>
          </li>
        ))}
      </ul>

      <h2>Novo plano</h2>
      <form action={salvar} className="formulario">
        <label htmlFor="pl-nome">Nome do cliente</label>
        <input id="pl-nome" name="nome" required maxLength={80} />
        <label htmlFor="pl-tel">WhatsApp do cliente</label>
        <input id="pl-tel" name="telefone" required inputMode="tel" placeholder="(55) 99999-0000" />
        <label htmlFor="pl-usos">Usos por mês</label>
        <input id="pl-usos" name="usos" type="number" min={1} max={31} defaultValue={2} required />
        <label htmlFor="pl-valor">Valor por mês (R$)</label>
        <input id="pl-valor" name="valor" inputMode="decimal" placeholder="80,00" required />
        <label htmlFor="pl-ate">Vale até</label>
        <input id="pl-ate" name="ate" type="date" defaultValue={somarDias(hoje, 30)} required />
        <button>Salvar plano</button>
      </form>
      <p className="suave pequeno">O cliente é reconhecido pelo WhatsApp que ele usa ao marcar. O plano não muda o preço no site: combine com ele como prefere cobrar.</p>
    </>
  );
}
