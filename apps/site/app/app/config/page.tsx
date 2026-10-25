import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErroAgenda, nomeDia } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda, reais } from "../../../lib/agenda";

export const metadata = { title: "Configurações", robots: { index: false } };
export const dynamic = "force-dynamic";

async function executar(acao: (barbeariaId: number) => void) {
  const { barbearia } = await exigirAcessoAtivo();
  try {
    acao(barbearia.id);
  } catch (e) {
    redirect(`/app/config?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/app/config");
}

async function salvarDados(form: FormData) {
  "use server";
  const telefone = normalizarTelefone(String(form.get("telefone")));
  await executar((id) => {
    if (!telefone) throw new ErroAgenda("WhatsApp inválido.");
    obterAgenda().atualizarBarbearia(id, {
      nome: String(form.get("nome")), telefone, endereco: String(form.get("endereco") ?? ""),
    });
  });
}

async function novoServico(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().adicionarServico(id, {
    nome: String(form.get("nome")),
    duracaoMin: Number(form.get("duracao")),
    precoCentavos: Math.round(Number(String(form.get("preco")).replace(",", ".")) * 100),
  }));
}

async function alternarServico(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().alternarServico(id, Number(form.get("id"))));
}

async function novoProfissional(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().adicionarProfissional(id, String(form.get("nome"))));
}

async function alternarProfissional(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().alternarProfissional(id, Number(form.get("id"))));
}

async function salvarExpediente(form: FormData) {
  "use server";
  await executar((id) => {
    for (let dia = 0; dia < 7; dia++) {
      const aberto = form.get(`aberto-${dia}`) === "on";
      const v = (c: string) => String(form.get(`${c}-${dia}`) ?? "") || undefined;
      obterAgenda().definirExpediente(id, dia, aberto
        ? { abre: v("abre") ?? "09:00", fecha: v("fecha") ?? "19:00", pausaInicio: v("pausaInicio"), pausaFim: v("pausaFim") }
        : undefined);
    }
  });
}

export default async function Config({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { barbearia } = await exigirAcessoAtivo();
  const { erro } = await searchParams;
  const banco = obterAgenda();
  const servicos = banco.servicos(barbearia.id);
  const profissionais = banco.profissionais(barbearia.id);
  const expedientes = banco.expedientes(barbearia.id);

  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Configurações</h1>
      {erro && <p className="erro">{erro}</p>}

      <h2>Barbearia</h2>
      <form action={salvarDados} className="formulario">
        <input name="nome" defaultValue={barbearia.nome} required maxLength={60} aria-label="Nome" />
        <input name="telefone" defaultValue={barbearia.telefone} required aria-label="WhatsApp" />
        <input name="endereco" defaultValue={barbearia.endereco ?? ""} placeholder="Endereço" aria-label="Endereço" />
        <button>Salvar</button>
      </form>

      <h2>Serviços</h2>
      {servicos.map((s) => (
        <form key={s.id} action={alternarServico} className="item-config">
          <input type="hidden" name="id" value={s.id} />
          <span className={s.ativo ? "" : "inativo"}>{s.nome} · {s.duracaoMin} min · {reais(s.precoCentavos)}</span>
          <button className="botao-sec">{s.ativo ? "Desativar" : "Ativar"}</button>
        </form>
      ))}
      <form action={novoServico} className="formulario linha">
        <input name="nome" placeholder="Novo serviço" required maxLength={40} />
        <input name="duracao" type="number" min={5} max={480} step={5} placeholder="Minutos" required />
        <input name="preco" placeholder="Preço (ex.: 45,00)" required inputMode="decimal" />
        <button>Adicionar</button>
      </form>

      <h2>Profissionais</h2>
      {profissionais.map((p) => (
        <form key={p.id} action={alternarProfissional} className="item-config">
          <input type="hidden" name="id" value={p.id} />
          <span className={p.ativo ? "" : "inativo"}>{p.nome}</span>
          <button className="botao-sec">{p.ativo ? "Desativar" : "Ativar"}</button>
        </form>
      ))}
      <form action={novoProfissional} className="formulario linha">
        <input name="nome" placeholder="Nome do profissional" required maxLength={40} />
        <button>Adicionar</button>
      </form>

      <h2>Horário de funcionamento</h2>
      <form action={salvarExpediente} className="expediente">
        {Array.from({ length: 7 }, (_, dia) => {
          const e = expedientes.get(dia);
          return (
            <fieldset key={dia}>
              <label><input type="checkbox" name={`aberto-${dia}`} defaultChecked={!!e} /> {nomeDia(dia)}</label>
              <input type="time" name={`abre-${dia}`} defaultValue={e?.abre ?? "09:00"} aria-label="Abre" />
              <input type="time" name={`fecha-${dia}`} defaultValue={e?.fecha ?? "19:00"} aria-label="Fecha" />
              <small>pausa</small>
              <input type="time" name={`pausaInicio-${dia}`} defaultValue={e?.pausaInicio ?? ""} aria-label="Início da pausa" />
              <input type="time" name={`pausaFim-${dia}`} defaultValue={e?.pausaFim ?? ""} aria-label="Fim da pausa" />
            </fieldset>
          );
        })}
        <button className="botao">Salvar horários</button>
      </form>
    </>
  );
}
