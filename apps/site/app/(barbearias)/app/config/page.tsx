import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErroAgenda, FOLGAS, formatarData, INTERVALOS, nomeDia } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { exigirDono, gravarSessaoAgenda, mensagemDeErro, obterAgenda, reais } from "@/lib/agenda";
import { soEntrega } from "@/lib/modo";

export const metadata = { title: "Configurações", robots: { index: false } };
export const dynamic = "force-dynamic";

async function executar<T>(acao: (barbeariaId: number) => T): Promise<T> {
  const { barbearia } = await exigirDono();
  let r: T;
  try {
    r = acao(barbearia.id);
  } catch (e) {
    redirect(`/app/config?erro=${encodeURIComponent(mensagemDeErro(e))}`);
  }
  revalidatePath("/app/config");
  return r;
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
    descricao: String(form.get("descricao") ?? ""),
    emDomicilio: form.get("domicilio") === "on",
    adicional: form.get("adicional") === "on",
  }));
}

/** "45", "45,5", "45,50" ou "R$ 45,00" → centavos. */
function lerPreco(texto: string): number {
  const limpo = texto.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return Math.round(Number(limpo) * 100);
}

async function editarServico(form: FormData) {
  "use server";
  const { ajustados, conflitos } = await executar((id) => obterAgenda().atualizarServico(id, Number(form.get("id")), {
    nome: String(form.get("nome") ?? ""),
    duracaoMin: Number(form.get("duracao")),
    precoCentavos: lerPreco(String(form.get("preco") ?? "")),
    descricao: String(form.get("descricao") ?? ""),
    emDomicilio: form.get("domicilio") === "on",
    adicional: form.get("adicional") === "on",
  }));
  const nome = String(form.get("nome") ?? "").trim();
  if (!ajustados) redirect(`/app/config?aviso=${encodeURIComponent(`${nome} salvo.`)}#servicos`);
  let aviso = `${nome} salvo. Tempo novo aplicado ${ajustados === 1 ? "no horário já marcado" : `nos ${ajustados} horários já marcados`} desse serviço.`;
  if (conflitos.length) {
    aviso += ` Com o tempo novo, ${conflitos.length === 1 ? "este encosta" : "estes encostam"} no cliente seguinte: ` +
      conflitos.slice(0, 5).map((a) => `${a.clienteNome}, ${formatarData(a.inicio.slice(0, 10))} às ${a.inicio.slice(11, 16)}`).join("; ") +
      ". Veja na agenda se dá pra atender ou remarque.";
  }
  redirect(`/app/config?aviso=${encodeURIComponent(aviso)}#servicos`);
}

async function salvarFuncionamento(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().atualizarFuncionamento(id, {
    mostrarPrecos: form.get("mostrarPrecos") === "on",
    intervaloMin: Number(form.get("intervalo")),
    folgaMin: Number(form.get("folga")),
    atendimento: String(form.get("atendimento")),
  }));
  redirect(`/app/config?aviso=${encodeURIComponent("Como você atende: salvo.")}#atende`);
}

async function salvarSinal(form: FormData) {
  "use server";
  const texto = String(form.get("sinal") ?? "").trim();
  await executar((id) => obterAgenda().atualizarSinal(id, {
    sinalCentavos: texto ? lerPreco(texto) : 0,
    pixChave: String(form.get("pixChave") ?? ""),
    pixNome: String(form.get("pixNome") ?? ""),
    pixCidade: String(form.get("pixCidade") ?? ""),
  }));
  redirect(`/app/config?aviso=${encodeURIComponent(texto && lerPreco(texto) > 0 ? "Sinal ligado: quem marcar pelo site vê o Pix." : "Sinal desligado.")}#sinal`);
}

async function salvarPosAtendimento(form: FormData) {
  "use server";
  await executar((id) => obterAgenda().atualizarPosAtendimento(id, {
    linkAvaliacao: String(form.get("linkAvaliacao") ?? ""),
    retornoDias: Number(form.get("retornoDias")),
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

async function salvarHorarioProfissional(form: FormData) {
  "use server";
  const dias = [0, 1, 2, 3, 4, 5, 6].filter((d) => form.get(`dia-${d}`) === "on");
  await executar((id) => obterAgenda().definirHorarioDoProfissional(id, Number(form.get("id")), {
    dias, entrada: String(form.get("entrada") ?? ""), saida: String(form.get("saida") ?? ""),
  }));
  redirect(`/app/config?aviso=${encodeURIComponent("Horário do profissional salvo.")}#equipe`);
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
    partePct: String(form.get("parte") ?? "").trim() === "" ? null : Number(form.get("parte")),
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
  redirect(`/app/config?aviso=${encodeURIComponent("Horário de funcionamento salvo.")}#horario`);
}

/** Troca a senha sabendo a atual. Os outros aparelhos saem; este continua entrado. */
async function trocarSenha(form: FormData) {
  "use server";
  const { usuario } = await exigirDono();
  const nova = String(form.get("nova") ?? "");
  let sessao: string;
  try {
    if (nova !== String(form.get("confirmar") ?? "")) throw new ErroAgenda("As duas senhas novas não são iguais.");
    sessao = obterAgenda().trocarSenha(usuario.id, String(form.get("atual") ?? ""), nova);
  } catch (e) {
    redirect(`/app/config?erro=${encodeURIComponent(mensagemDeErro(e))}#senha`);
  }
  await gravarSessaoAgenda(sessao);
  redirect(`/app/config?aviso=${encodeURIComponent("Senha trocada. Os outros aparelhos saíram da conta.")}#senha`);
}

export default async function Config({ searchParams }: { searchParams: Promise<{ erro?: string; aviso?: string }> }) {
  const { barbearia } = await exigirDono();
  const { erro, aviso } = await searchParams;
  const banco = obterAgenda();
  // Desativados vão pro fim: conta nova tem os genéricos (Corte, Barba...) desligados pelo cardápio.
  const servicos = banco.servicos(barbearia.id).sort((a, b) => Number(b.ativo) - Number(a.ativo));
  const profissionais = banco.profissionais(barbearia.id);
  const expedientes = banco.expedientes(barbearia.id);
  const fotosEquipe = banco.fotos(barbearia.id, "equipe");
  const bloqueados = banco.telefonesBloqueados(barbearia.id);

  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Configurações</h1>
      {erro && <p className="erro">{erro}</p>}
      {aviso && <p className="aviso-novo" role="status">{aviso}</p>}

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

      <h2 id="atende">Como você atende</h2>
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
        <label htmlFor="cfg-folga">Folga entre um cliente e outro</label>
        <select id="cfg-folga" name="folga" defaultValue={barbearia.folgaMin} aria-describedby="cfg-folga-dica">
          {FOLGAS.map((m) => <option key={m} value={m}>{m === 0 ? "Sem folga" : `${m} minutos`}</option>)}
        </select>
        <small id="cfg-folga-dica" className="suave">
          Tempo livre depois de cada cliente, pra um atraso não empurrar o dia todo. O site só oferece horários com essa folga,
          e o próximo horário começa logo depois dela (um corte de 40 min às 9h com 10 de folga libera 9h50).
        </small>
        <label className="marcar">
          <input type="checkbox" name="mostrarPrecos" defaultChecked={barbearia.mostrarPrecos} /> Mostrar os preços dos serviços no site
        </label>
        <button>Salvar</button>
      </form>

      <h2 id="sinal">Sinal pra garantir o horário</h2>
      <p className="suave pequeno">
        Opcional. Quem marcar pelo site vê o Pix do sinal (na sua chave, sem taxa) e você confere no seu banco e toca em
        &quot;Recebi o sinal&quot; no horário. Os horários que você mesmo marca ficam sem sinal. Deixe o valor em branco ou 0 pra não cobrar.
      </p>
      <form action={salvarSinal} className="formulario">
        <label>Valor do sinal (R$)<input name="sinal" inputMode="decimal" placeholder="Ex.: 20,00" defaultValue={barbearia.sinalCentavos ? (barbearia.sinalCentavos / 100).toFixed(2).replace(".", ",") : ""} /></label>
        <label>Sua chave Pix<input name="pixChave" maxLength={77} defaultValue={barbearia.pixChave ?? ""} placeholder="CPF, CNPJ, celular, e-mail ou chave aleatória" autoComplete="off" /></label>
        <label>Nome do recebedor (como aparece no Pix)<input name="pixNome" maxLength={25} defaultValue={barbearia.pixNome ?? ""} /></label>
        <label>Cidade da conta<input name="pixCidade" maxLength={15} defaultValue={barbearia.pixCidade ?? ""} /></label>
        <button>Salvar sinal</button>
      </form>

      <h2 id="depois">Depois do atendimento</h2>
      <form action={salvarPosAtendimento} className="formulario">
        <label htmlFor="cfg-avaliacao">Link da sua página de avaliação no Google</label>
        <input id="cfg-avaliacao" name="linkAvaliacao" type="url" defaultValue={barbearia.linkAvaliacao ?? ""} placeholder="https://g.page/r/..." aria-describedby="cfg-avaliacao-dica" />
        <small id="cfg-avaliacao-dica" className="suave">
          No seu Perfil da Empresa no Google, toque em &quot;Pedir avaliações&quot; e copie o link. Com ele, cada atendimento ganha o botão
          &quot;Pedir avaliação&quot;. Não ofereça desconto nem brinde em troca: o Google proíbe e apaga essas avaliações.
          {barbearia.linkAvaliacao && <> <Link href="/app/avaliacao">Imprimir o cartão com QR pro balcão</Link>.</>}
        </small>
        <label htmlFor="cfg-retorno">Retorno padrão (cliente sem histórico)</label>
        <select id="cfg-retorno" name="retornoDias" defaultValue={barbearia.retornoDias} aria-describedby="cfg-retorno-dica">
          {[7, 10, 14, 15, 21, 28, 30, 45, 60].map((d) => <option key={d} value={d}>{d} dias</option>)}
        </select>
        <small id="cfg-retorno-dica" className="suave">&quot;Marcar o próximo&quot; sugere essa data. Quem já veio mais vezes ganha a sugestão pelo próprio ritmo.</small>
        <button>Salvar</button>
      </form>

      <h2 id="servicos">Serviços</h2>
      <p className="suave pequeno">Cada serviço tem o seu tempo: ponha quanto você leva de verdade no corte, na barba e no combo. Mudou o tempo? Os horários já marcados desse serviço passam a terminar no tempo novo na sua agenda e no calendário. Marque &quot;Oferecer como adicional&quot; na barba, na sobrancelha ou no que quiser: o cliente escolhe o corte e soma esses junto, com tempo e preço juntos. Toque no serviço pra mudar nome, tempo, preço e o que inclui, e depois em Salvar. Dizer as etapas (&quot;toalha quente, navalha, massagem&quot;) ajuda o cliente a entender o preço. Desativar tira o serviço do site sem apagar os horários já marcados.</p>
      {/* Lista curta: uma linha por serviço (nome, tempo, preço); toca pra editar. Desativados ficam
          recolhidos no fim, pra não confundir com os ativos de mesmo nome. */}
      {[servicos.filter((s) => s.ativo), servicos.filter((s) => !s.ativo)].map((lista, desativados) => lista.length > 0 && (
        <div key={desativados} className={desativados ? "config-servicos-off" : "config-servicos"}>
          {desativados ? <p className="suave pequeno">Desativados ({lista.length}): não aparecem no site.</p> : null}
          {lista.map((s) => (
            <details key={s.id} id={`servico-${s.id}`} className={`config-servico-item ${s.ativo ? "" : "desativado"}`}>
              <summary>
                <span>{s.nome}{s.adicional && <small className="config-servico-selo">adicional</small>}</span>
                <span className="suave">{s.duracaoMin} min</span>
                <strong>{reais(s.precoCentavos)}</strong>
              </summary>
              <form action={editarServico} className="config-servico">
                <input type="hidden" name="id" value={s.id} />
                <label>Serviço<input name="nome" defaultValue={s.nome} required maxLength={40} /></label>
                <label>Tempo (minutos)<input name="duracao" type="number" min={5} max={480} step={5} defaultValue={s.duracaoMin} required inputMode="numeric" /></label>
                <label>Preço (R$)<input name="preco" defaultValue={(s.precoCentavos / 100).toFixed(2).replace(".", ",")} required inputMode="decimal" /></label>
                <label className="config-servico-desc">O que inclui (aparece no site)<input name="descricao" defaultValue={s.descricao ?? ""} maxLength={140} placeholder="Ex.: toalha quente, navalha e massagem no fim" /></label>
                <label className="marcar config-servico-domicilio"><input type="checkbox" name="domicilio" defaultChecked={s.emDomicilio} /> Vou até o cliente (pede o endereço)</label>
                <label className="marcar config-servico-domicilio config-servico-adicional"><input type="checkbox" name="adicional" defaultChecked={s.adicional} /> Oferecer como adicional (&quot;+ {s.nome}&quot; junto com outro serviço)</label>
                <div className="acoes">
                  <button className="botao-sec">Salvar</button>
                  <button className="botao-sec" formAction={alternarServico} formNoValidate>{s.ativo ? "Desativar" : "Ativar"}</button>
                </div>
              </form>
            </details>
          ))}
        </div>
      ))}
      <h3>Novo serviço</h3>
      <form action={novoServico} className="formulario linha">
        <input name="nome" placeholder="Novo serviço" required maxLength={40} />
        <input name="duracao" type="number" min={5} max={480} step={5} placeholder="Tempo em minutos" aria-label="Tempo em minutos" required inputMode="numeric" />
        <input name="preco" placeholder="Preço (ex.: 45,00)" required inputMode="decimal" />
        <input name="descricao" placeholder="O que inclui (opcional)" maxLength={140} />
        <label className="marcar"><input type="checkbox" name="domicilio" /> Vou até o cliente</label>
        <label className="marcar"><input type="checkbox" name="adicional" /> Oferecer como adicional</label>
        <button>Adicionar</button>
      </form>

      <h2 id="equipe">Profissionais <small className="suave">({profissionais.filter((p) => p.ativo).length} atendendo)</small></h2>
      <p className="suave pequeno">A foto de cada profissional sai das fotos do tipo "Equipe" (envie em <Link href="/app/fotos">Fotos</Link>). No site, cada um ganha o botão "Agendar com…". Em &quot;Fica com&quot;, a porcentagem de cada serviço que é do profissional (comissão ou {soEntrega() ? "barbeiro parceiro" : <a href="/revista/barbeiro-parceiro-lei-do-salao-parceiro">barbeiro parceiro</a>}); deixe vazio se não divide. A conta do mês sai em <Link href="/app/numeros">Números do mês</Link>.</p>
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
            <label className="parte-pct">Fica com
              <input name="parte" type="number" min={0} max={100} step={1} defaultValue={p.partePct ?? ""} placeholder="—" aria-label={`Porcentagem que fica com ${p.nome}`} />%
            </label>
            <button className="botao-sec">Salvar</button>
            <button className="botao-sec" formAction={alternarProfissional} formNoValidate>{p.ativo ? "Desativar" : "Ativar"}</button>
          </form>
          {/* Horário próprio: o site só oferece a este profissional os dias e horas dele (sempre dentro do da barbearia). */}
          <details className="horario-prof">
            <summary>
              Horário de {p.nome.split(" ")[0]}:{" "}
              {p.dias || p.entrada || p.saida
                ? `${p.dias ? p.dias.map((d) => nomeDia(d).slice(0, 3)).join(", ") : "todos os dias"}${p.entrada || p.saida ? `, ${p.entrada ?? "abertura"}–${p.saida ?? "fechamento"}` : ""}`
                : "o mesmo da barbearia"}
            </summary>
            <form action={salvarHorarioProfissional} className="formulario">
              <input type="hidden" name="id" value={p.id} />
              <fieldset className="dias-prof">
                <legend>Dias que atende</legend>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <label key={d} className="marcar"><input type="checkbox" name={`dia-${d}`} defaultChecked={!p.dias || p.dias.includes(d)} /> {nomeDia(d)}</label>
                ))}
              </fieldset>
              <div className="linha-horas">
                <label>Entra às<input type="time" name="entrada" defaultValue={p.entrada ?? ""} /></label>
                <label>Sai às<input type="time" name="saida" defaultValue={p.saida ?? ""} /></label>
              </div>
              <small className="suave">Deixe as horas em branco pra seguir o horário da barbearia. Folga de um dia só é em &quot;Bloquear um horário&quot;, na agenda.</small>
              <button className="botao-sec">Salvar horário</button>
            </form>
          </details>
        </div>
      ))}
      <form action={novoProfissional} className="formulario linha">
        <input name="nome" placeholder="Nome do profissional" required maxLength={40} />
        <button>Adicionar</button>
      </form>

      <h2 id="horario">Horário de funcionamento</h2>
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

      <h2 id="senha">{soEntrega() ? "Senha do painel" : "Trocar senha"}</h2>
      {soEntrega() ? (
        // App de um barbeiro só: a senha do painel é a do .env, quem troca é a gente.
        <p className="suave">A senha do painel é a que a gente te mandou. Pra trocar, fale com a gente no WhatsApp.</p>
      ) : (
        <form action={trocarSenha} className="formulario">
          <label>Senha atual<input name="atual" type="password" required autoComplete="current-password" /></label>
          <label>Nova senha<input name="nova" type="password" required minLength={8} autoComplete="new-password" /></label>
          <label>Repita a nova senha<input name="confirmar" type="password" required minLength={8} autoComplete="new-password" /></label>
          <button>Trocar senha</button>
        </form>
      )}
    </>
  );
}
