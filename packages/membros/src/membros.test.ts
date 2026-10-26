import { describe, expect, it } from "vitest";
import { BancoMembros, ErroMembro, LIMITES, LINK_HORAS, limparNome, SESSAO_DIAS, telefoneValido } from "./banco.ts";

const TEL = "5511987654321";
const novo = () => new BancoMembros(":memory:");
/** Entra pelo fluxo real: pede o link (como o bot) e troca por sessão (como o site). */
function entrar(b: BancoMembros, nome = "Ana Souza") {
  const { token } = b.linkDeEntrada(TEL, nome);
  return b.entrarComLink(token);
}

describe("validações", () => {
  it("aceita só celular brasileiro", () => {
    expect(telefoneValido("11 98765-4321")).toBe(TEL);
    expect(() => telefoneValido("(11) 3232-1010")).toThrow(ErroMembro);
    expect(() => telefoneValido("+1 415 555 0100")).toThrow(ErroMembro);
  });
  it("limpa o nome do perfil do WhatsApp", () => {
    expect(limparNome("  João 💈 Barber\n ")).toBe("João Barber");
    expect(limparNome("Zé")).toBe("Zé");
    expect(limparNome("🔥🔥")).toBeUndefined();
    expect(limparNome(undefined)).toBeUndefined();
  });
});

describe("entrar pelo WhatsApp", () => {
  it("primeira mensagem cria a conta já confirmada e o link abre a sessão", () => {
    const b = novo();
    const r = b.linkDeEntrada(TEL, "Ana Souza 💈");
    expect(r.novo).toBe(true);
    expect(r.nome).toBe("Ana Souza");
    const sessao = b.entrarComLink(r.token);
    expect(b.membroDaSessao(sessao)).toMatchObject({ telefone: TEL, nome: "Ana Souza", verificado: true });
  });

  it("sem nome no perfil vira \"Aluno\"; quem volta mantém o nome", () => {
    const b = novo();
    expect(b.linkDeEntrada(TEL).nome).toBe("Aluno");
    const deNovo = b.linkDeEntrada(TEL, "Outro Nome");
    expect(deNovo.novo).toBe(false);
    expect(deNovo.nome).toBe("Aluno");
  });

  it("o link funciona uma vez só", () => {
    const b = novo();
    const { token } = b.linkDeEntrada(TEL, "Ana");
    b.entrarComLink(token);
    expect(() => b.entrarComLink(token)).toThrow(/já foi usado ou venceu/);
  });

  it(`o link vence em ${LINK_HORAS} horas`, () => {
    const b = novo();
    const agora = new Date("2026-10-27T12:00:00Z");
    const { token } = b.linkDeEntrada(TEL, "Ana", agora);
    const depois = new Date(agora.getTime() + LINK_HORAS * 3_600_000 + 1000);
    expect(() => b.entrarComLink(token, depois)).toThrow(/venceu/);
  });

  it("pedir link novo mata o anterior", () => {
    const b = novo();
    const velho = b.linkDeEntrada(TEL, "Ana").token;
    const atual = b.linkDeEntrada(TEL, "Ana").token;
    expect(() => b.entrarComLink(velho)).toThrow(ErroMembro);
    expect(() => b.entrarComLink(atual)).not.toThrow();
  });

  it("token inventado não entra", () => {
    const b = novo();
    b.linkDeEntrada(TEL, "Ana");
    expect(() => b.entrarComLink("qualquer-coisa")).toThrow(ErroMembro);
  });

  it("limita links pedidos por número", () => {
    const b = novo();
    const agora = new Date();
    for (let i = 0; i < LIMITES.linksPorTelefone; i++) b.linkDeEntrada(TEL, "Ana", agora);
    expect(() => b.linkDeEntrada(TEL, "Ana", agora)).toThrow(/muitos links/);
    expect(() => b.linkDeEntrada("5511912345678", "Bia", agora)).not.toThrow();
  });

  it("número de fora do Brasil não ganha conta", () => {
    expect(() => novo().linkDeEntrada("14155550100", "John")).toThrow(ErroMembro);
  });

  it(`a sessão dura ${SESSAO_DIAS} dias`, () => {
    const b = novo();
    const sessao = entrar(b);
    const linha = b.db.prepare("SELECT expira_em AS e FROM sessoes").get() as { e: string };
    const dias = (new Date(linha.e).getTime() - Date.now()) / 86_400_000;
    expect(Math.round(dias)).toBe(SESSAO_DIAS);
    expect(b.membroDaSessao(sessao)).toBeDefined();
  });

  it("sair de todos os aparelhos derruba as sessões e o link pendente", () => {
    const b = novo();
    const celular = entrar(b);
    const computador = b.entrarComLink(b.linkDeEntrada(TEL).token);
    const pendente = b.linkDeEntrada(TEL).token;
    const { id } = b.membroDaSessao(celular)!;
    b.sairDeTodos(id);
    expect(b.membroDaSessao(celular)).toBeUndefined();
    expect(b.membroDaSessao(computador)).toBeUndefined();
    expect(() => b.entrarComLink(pendente)).toThrow(ErroMembro);
  });

  it("o banco não guarda o link nem a sessão em texto", () => {
    const b = novo();
    const { token } = b.linkDeEntrada(TEL, "Ana");
    const sessao = b.entrarComLink(token);
    const tudo = JSON.stringify([b.db.prepare("SELECT * FROM links_entrada").all(), b.db.prepare("SELECT * FROM sessoes").all()]);
    expect(tudo).not.toContain(token);
    expect(tudo).not.toContain(sessao);
  });

  it("limita por IP", () => {
    const b = novo();
    const agora = new Date();
    for (let i = 0; i < LIMITES.porIp; i++) b.checarIp("1.2.3.4", agora);
    expect(() => b.checarIp("1.2.3.4", agora)).toThrow(/Muitas tentativas/);
    expect(() => b.checarIp("5.6.7.8", agora)).not.toThrow();
  });
});

describe("nome, progresso e LGPD", () => {
  it("troca o nome", () => {
    const b = novo();
    const { id } = b.membroDaSessao(entrar(b, "Aluno"))!;
    b.trocarNome(id, "  Carlos  Silva ");
    expect(b.listar()[0]!.nome).toBe("Carlos Silva");
    expect(() => b.trocarNome(id, "💈")).toThrow(ErroMembro);
  });

  it("marca lições e apaga tudo ao excluir a conta", () => {
    const b = novo();
    const sessao = entrar(b);
    const { id } = b.membroDaSessao(sessao)!;
    b.marcarLicao(id, "curso-a", "l1", true);
    b.marcarLicao(id, "curso-a", "l1", true);
    b.marcarLicao(id, "curso-a", "l2", true);
    b.marcarLicao(id, "curso-a", "l2", false);
    expect([...b.licoesConcluidas(id, "curso-a")]).toEqual(["curso-a/l1"]);
    b.excluirConta(id);
    expect(b.membroDaSessao(sessao)).toBeUndefined();
    expect(b.licoesConcluidas(id).size).toBe(0);
  });
});
