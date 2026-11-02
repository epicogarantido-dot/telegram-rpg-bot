import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PASTA_CURSOS } from "@aprenda/catalogo";
import type { ItemLista } from "@aprenda/prospeccao";
import { BotaoEnviar } from "@/componentes/BotaoEnviar";
import { configEmail, emailDeTeste, emailsHoje, emailsLigados, faltaParaEmail, horarioComercial, ligarEmails, rodadaDeEmails } from "@/lib/emails";
import { exigirLogin, obterBanco } from "@/lib/painel";

export const metadata = { title: "Convite por e-mail", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Lista de e-mails que vem no zip do leads (data/listas/emails.json, fora do git): entra no banco sem virar aba em "Pra mandar". */
function importarListaDeEmails(): void {
  try {
    const dados = JSON.parse(readFileSync(join(dirname(PASTA_CURSOS), "listas", "emails.json"), "utf8")) as { itens: ItemLista[] };
    obterBanco().importarLista(null, dados.itens);
  } catch { /* sem a lista: fica só o que já está no banco */ }
}

async function ligar(formData: FormData) {
  "use server";
  await exigirLogin();
  ligarEmails(formData.get("ligar") === "1");
  revalidatePath("/painel/emails");
}

async function teste() {
  "use server";
  await exigirLogin();
  let msg = "teste=ok";
  try { await emailDeTeste(); } catch (e) {
    const texto = String(e instanceof Error ? e.message : e);
    const dica = /Brevo 401/.test(texto) ? "a chave do Brevo (BREVO_API_KEY) não confere." : /Brevo 400/.test(texto) && /sender/i.test(texto) ? "o remetente (EMAIL_REMETENTE) ainda não foi confirmado no Brevo." : texto.slice(0, 180);
    msg = `erro=${encodeURIComponent(dica)}`;
  }
  redirect(`/painel/emails?${msg}`);
}

async function rodadaAgora() {
  "use server";
  await exigirLogin();
  const n = await rodadaDeEmails();
  redirect(`/painel/emails?rodada=${n}`);
}

export default async function Emails({ searchParams }: { searchParams: Promise<{ teste?: string; erro?: string; rodada?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  importarListaDeEmails();
  const banco = obterBanco();
  const falta = faltaParaEmail();
  const ligado = emailsLigados();
  const hoje = emailsHoje();
  const fila = banco.emailsNaFila();
  const recentes = banco.emailsRecentes(30);

  return (
    <>
      <p><a href="/painel">Leads</a> · <a href="/painel/lista">Pra mandar</a> · <strong>E-mail</strong> · <a href="/painel/buscar">Buscar</a> · <a href="/painel/assinaturas">Vendas</a></p>
      <h1>Convite da comunidade por e-mail</h1>
      <p>
        O site manda sozinho o convite da comunidade pro e-mail das barbearias (o e-mail público do CNPJ): até{" "}
        <strong>{configEmail.porDia} por dia</strong>, de segunda a sábado, das 9h às 18h, no máximo 5 a cada 10 minutos.
        Cada barbearia recebe uma vez só, e todo e-mail tem "Não quero mais receber".
      </p>

      {sp.teste && <p className="aviso-novo">E-mail de teste enviado pra {configEmail.remetente}. Confira a caixa de entrada (e o spam).</p>}
      {sp.erro && <p className="aviso-novo erro">Não saiu: {sp.erro}</p>}
      {sp.rodada !== undefined && <p className="aviso-novo">{sp.rodada === "0" ? "Nenhum saiu agora (fora do horário, desligado ou limite do dia)." : `${sp.rodada} convite(s) enviado(s).`}</p>}

      {falta.length > 0 ? (
        <div className="cartao">
          <p><strong>Falta configurar.</strong> Coloque no ambiente do app na Square e reinicie: <strong>{falta.join(", ")}</strong>.</p>
          <ol>
            <li>No Brevo: SMTP &amp; API → API Keys → gere uma chave e cole em <code>BREVO_API_KEY</code>.</li>
            <li>No Brevo: Senders (Remetentes) → confirme o seu e-mail e cole ele em <code>EMAIL_REMETENTE</code>.</li>
            <li><code>SITE_URL</code> é o endereço do site (ex.: https://barbearias777.squareweb.app): é dele que sai o link de "Não quero mais receber".</li>
          </ol>
        </div>
      ) : (
        <div className="cartao">
          <p>
            Envio automático: <strong>{ligado ? "ligado" : "desligado"}</strong>
            {ligado && !horarioComercial() && " (agora está fora do horário: volta seg a sáb às 9h)"}.
          </p>
          <p>Hoje: <strong>{hoje}</strong> de {configEmail.porDia}. Falta mandar: <strong>{fila}</strong>. Pediram pra sair: {banco.emailsSaidos()}.</p>
          <form action={ligar} style={{ display: "inline" }}>
            <input type="hidden" name="ligar" value={ligado ? "0" : "1"} />
            <BotaoEnviar>{ligado ? "Desligar o envio" : "Ligar o envio automático"}</BotaoEnviar>
          </form>{" "}
          <form action={teste} style={{ display: "inline" }}>
            <BotaoEnviar carregando="Enviando…">Mandar um de teste pra mim</BotaoEnviar>
          </form>
          {ligado && horarioComercial() && (
            <> {" "}<form action={rodadaAgora} style={{ display: "inline" }}><BotaoEnviar carregando="Enviando…">Mandar 5 agora</BotaoEnviar></form></>
          )}
          <p><small>Comece pelo teste: veja se chega na caixa de entrada e se o botão abre a comunidade. Remetente: {configEmail.nome} &lt;{configEmail.remetente}&gt;.</small></p>
        </div>
      )}

      <h2>Últimos enviados</h2>
      {recentes.length === 0 ? <p>Nenhum ainda.</p> : (
        <ul>
          {recentes.map((r) => (
            <li key={r.email + r.em}>
              <strong>{r.nome}</strong> ({r.cidade}) · {r.email} ·{" "}
              {new Date(r.em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
