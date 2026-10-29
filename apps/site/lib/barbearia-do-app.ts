import { createHash, randomBytes } from "node:crypto";
import { temaValido, type Barbearia } from "@aprenda/agenda";
import { normalizarTelefone } from "@aprenda/prospeccao";
import { obterAgenda } from "./agenda";
import { porCardapio } from "./cardapio";
import { criarSitesDeExemplo, porFotosPadrao, sitesDeExemplo } from "./exemplos";

/**
 * SaaS: cada app na Square é de UMA barbearia. Ela nasce sozinha na primeira vez que o app sobe,
 * com os dados do .env (BARBEARIA_NOME, BARBEARIA_WHATSAPP, BARBEIRO_NOME, BARBEARIA_CIDADE,
 * BARBEARIA_ESTILO), as fotos padrão do estilo e o cardápio; depois o barbeiro muda tudo no
 * painel. O endereço principal abre o site dela; /admin, o painel, que entra só com a PAINEL_SENHA.
 * O prazo pago começa com PLANO_DIAS dias; PAGO_ATE no .env (AAAA-MM-DD) manda nele: pra renovar,
 * o dono muda a data e reinicia o app.
 */
const CHAVE = "barbearia_do_app";
const CHAVE_SENHA = "senha_admin_hash";

export function barbeariaDoApp(): Barbearia | undefined {
  const banco = obterAgenda();
  const id = Number(banco.configuracao(CHAVE) ?? 0);
  return id ? banco.barbeariaPorId(id) : undefined;
}

export async function prepararBarbeariaDoApp(): Promise<Barbearia> {
  const banco = obterAgenda();
  let b = barbeariaDoApp();
  if (!b) {
    // App que já tinha barbearia (de antes de ser de um barbeiro só): fica com a mais nova.
    const existente = banco.todasBarbearias().filter((x) => x.email).sort((x, y) => y.id - x.id)[0];
    if (existente) {
      b = existente;
    } else {
      const env = process.env;
      const tema = env.BARBEARIA_ESTILO && temaValido(env.BARBEARIA_ESTILO) ? env.BARBEARIA_ESTILO : "cerimonia";
      b = banco.criarContaPeloAdmin({
        nomeBarbearia: env.BARBEARIA_NOME?.trim() || "Minha Barbearia",
        telefone: normalizarTelefone(env.BARBEARIA_WHATSAPP) ?? "",
        tema,
        cidade: env.BARBEARIA_CIDADE,
        nome: env.BARBEIRO_NOME?.trim() || "Barbeiro",
        // O admin entra só com a PAINEL_SENHA: e-mail e senha da conta existem mas não são usados.
        email: `dono@${randomBytes(6).toString("hex")}.local`,
        senha: randomBytes(18).toString("base64url"),
        dias: banco.plano.dias,
      });
      porCardapio(b.id);
    }
    banco.definirConfiguracao(CHAVE, String(b.id));
    if (!existente) {
      if (!sitesDeExemplo()[b.tema]) await criarSitesDeExemplo();
      porFotosPadrao(b.id, b.tema);
    }
  }
  const pagoAte = process.env.PAGO_ATE?.trim();
  if (pagoAte && pagoAte !== b.acessoAte) {
    try {
      banco.definirPrazo(b.id, pagoAte);
    } catch {
      console.error(`PAGO_ATE inválido (${pagoAte}): use AAAA-MM-DD, por exemplo 2026-12-31.`);
    }
  }
  // Senha do admin trocada no .env: quem estava logado com a antiga sai.
  const hash = createHash("sha256").update(process.env.PAINEL_SENHA ?? "").digest("hex");
  const antes = banco.configuracao(CHAVE_SENHA);
  if (antes && antes !== hash) banco.encerrarSessoes(b.id);
  if (antes !== hash) banco.definirConfiguracao(CHAVE_SENHA, hash);
  return banco.barbeariaPorId(b.id)!;
}
