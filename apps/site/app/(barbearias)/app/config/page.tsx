import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErroAgenda, INTERVALOS, nomeDia } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { exigirAcessoAtivo, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";

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
    precoCentavos: lerPreco(String(form.get("preco") ?? "")),
  }));
}

/** "45", "45,5", "45,50" ou "R$ 45,00" → centavos. */
function lerPreco(texto: string): number {
  const limpo = texto.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return Math.round(Number(limpo) * 100);
}

async function editarServico(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().atualizarServico(id, Number(form.get("id")), {
    nome: String(form.get("nome") ?? ""),
    duracaoMin: Number(form.get("duracao")),
    precoCentavos: lerPreco(String(form.get("preco") ?? "")),
  }));
}

async function salvarFuncionamento(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().atualizarFuncionamento(id, {
    mostrarPrecos: form.get("mostrarPrecos") === "on",
    intervaloMin: Number(form.get("intervalo")),
    atendimento: String(form.get("atendimento")),
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

async function editarProfissional(form: FormData) {
  "use server";
  const foto = String(form.get("foto") ?? "");
  await executar((id) => obterAgenda().atualizarProfissional(id, Number(form.get("id")), {
    nome: String(form.get("nome") ?? ""),
    especialidade: String(form.get("especialidade") ?? ""),
    fotoArquivo: foto || null,
  }));
}

async function desbloquear(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().desbloquearTelefone(id, String(form.get("telefone"))));
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
  const fotosEquipe = banco.fotos(barbearia.id, "equipe");
  const bloqueados = banco.telefonesBloqueados(barbearia.id);

  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Configurações</h1>
      {erro && <p className="erro">{erro}</p>}

      <h2>Barbearia</h2>
      <form action={salvarDados} className="formulario">
        <label htmlFor="cfg-nome">Nome da barbearia</label>
        <input id="cfg-nome" name="nome" defaultValue={barbearia.nome} required maxLength={60} />
        <label htmlFor="cfg-telefone">WhatsApp da barbearia</label>
        <input id="cfg-telefone" name="telefone" defaultValue={barbearia.telefone} required inputMode="tel" />
        <label htmlFor="cfg-endereco">Endereço</label>
        <input id="cfg-endereco" name="endereco" defaultValue={barbearia.endereco ?? ""} placeholder="Rua, número, bairro" />
        <button>Salvar</button>
      </form>

      <h2>Como você atende</h2>
      <form action={salvarFuncionamento} className="formulario">
        <fieldset className="escolhas">
          <legend>Forma de atendimento</legend>
          {([
            ["agenda", "Só com horário marcado", "O cliente escolhe o horário pelo site."],
            ["chegada", "Só por ordem de chegada", "O site mostra se está aberto e o tamanho da fila. Sem agendamento."],
            ["ambos", "Os dois", "Agenda pelo site e também atende quem chega, mostrando a fila."],
          ] as const).map(([valor, titulo, dica]) => (
            <label key={valor} className="escolha">
              <input type="radio" name="atendimento" value={valor} defaultChecked={barbearia.atendimento === valor} />
              <span><strong>{titulo}</strong><small>{dica}</small></span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="cfg-intervalo">Horários a cada</label>
        <select id="cfg-intervalo" name="intervalo" defaultValue={barbearia.intervaloMin}>
          {INTERVALOS.map((m) => <option key={m} value={m}>{m < 60 ? `${m} minutos` : m === 60 ? "1 hora" : m === 90 ? "1 hora e meia" : "2 horas"}</option>)}
        </select>
        <label className="marcar">
          <input type="checkbox" name="mostrarPrecos" defaultChecked={barbearia.mostrarPrecos} /> Mostrar os preços dos serviços no site
        </label>
        <button>Salvar</button>
      </form>

      <h2>Serviços</h2>
      <p className="suave pequeno">Mude nome, tempo e preço e toque em Salvar. Desativar tira o serviço do site sem apagar os horários já marcados.</p>
      {servicos.map((s) => (
        <form key={s.id} action={editarServico} className={`config-servico ${s.ativo ? "" : "desativado"}`}>
          <input type="hidden" name="id" value={s.id} />
          <label>Serviço<input name="nome" defaultValue={s.nome} required maxLength={40} /></label>
          <label>Minutos<input name="duracao" type="number" min={5} max={480} step={5} defaultValue={s.duracaoMin} required /></label>
          <label>Preço (R$)<input name="preco" defaultValue={(s.precoCentavos / 100).toFixed(2).replace(".", ",")} required inputMode="decimal" /></label>
          <div className="acoes">
            <button className="botao-sec">Salvar</button>
            <button className="botao-sec" formAction={alternarServico} formNoValidate>{s.ativo ? "Desativar" : "Ativar"}</button>
          </div>
        </form>
      ))}
      <h3>Novo serviço</h3>
      <form action={novoServico} className="formulario linha">
        <input name="nome" placeholder="Novo serviço" required maxLength={40} />
        <input name="duracao" type="number" min={5} max={480} step={5} placeholder="Minutos" required />
        <input name="preco" placeholder="Preço (ex.: 45,00)" required inputMode="decimal" />
        <button>Adicionar</button>
      </form>

      <h2>Profissionais <small className="suave">({profissionais.filter((p) => p.ativo).length} atendendo)</small></h2>
      <p className="suave pequeno">A foto de cada profissional sai das fotos do tipo "Equipe" (envie em <Link href="/app/fotos">Fotos</Link>). No site, cada um ganha o botão "Agendar com…".</p>
      {profissionais.map((p) => (
        <div key={p.id} className={`equipe-item ${p.ativo ? "" : "desativado"}`}>
          <form action={editarProfissional}>
            <input type="hidden" name="id" value={p.id} />
            <input name="nome" defaultValue={p.nome} required maxLength={40} aria-label="Nome do profissional" />
            <input name="especialidade" defaultValue={p.especialidade ?? ""} placeholder="Especialidade (ex.: degradê)" maxLength={60} aria-label={`Especialidade de ${p.nome}`} />
            <select name="foto" defaultValue={p.fotoArquivo ?? ""} aria-label={`Foto de ${p.nome}`}>
              <option value="">Sem foto</option>
              {fotosEquipe.map((f, i) => <option key={f.arquivo} value={f.arquivo}>{f.legenda || `Foto da equipe ${i + 1}`}</option>)}
            </select>
            <button className="botao-sec">Salvar</button>
            <button className="botao-sec" formAction={alternarProfissional} formNoValidate>{p.ativo ? "Desativar" : "Ativar"}</button>
          </form>
        </div>
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

      <h2 id="bloqueados">Números bloqueados</h2>
      {bloqueados.length === 0
        ? <p className="suave pequeno">Nenhum. Pra bloquear um trote, abra o horário na agenda, toque em Cancelar e depois em &quot;Bloquear este número&quot;.</p>
        : bloqueados.map((t) => (
          <form key={t.telefone} action={desbloquear} className="item-config">
            <input type="hidden" name="telefone" value={t.telefone} />
            <span>+{t.telefone}</span>
            <button className="botao-sec">Desbloquear</button>
          </form>
        ))}
    </>
  );
}
