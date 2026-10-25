import { describe, expect, it } from "vitest";
import { BancoMembros, ErroMembro, extrairCodigo, LIMITES, telefoneValido, validarSenha } from "./banco.ts";

const TEL = "5511987654321";
const novo = () => new BancoMembros(":memory:");
const cadastro = (b: BancoMembros, senha = "segredo-forte") =>
  b.cadastrar({ nome: "Ana Souza", telefone: "(11) 98765-4321", senha, consentiu: true });

describe("validações", () => {
  it("aceita só celular brasileiro", () => {
    expect(telefoneValido("11 98765-4321")).toBe(TEL);
    expect(() => telefoneValido("(11) 3232-1010")).toThrow(ErroMembro);
    expect(() => telefoneValido("+1 415 555 0100")).toThrow(ErroMembro);
  });
  it("recusa senha curta, óbvia ou repetida", () => {
    expect(() => validarSenha("curta")).toThrow(/8 caracteres/);
    expect(() => validarSenha("12345678")).toThrow(/fácil/);
    expect(() => validarSenha("aaaaaaaaa")).toThrow(/fácil/);
    expect(() => validarSenha("barbearia-2026")).not.toThrow();
  });
  it("acha o código na mensagem", () => {
    expect(extrairCodigo("Meu código: AB3K9Q")).toBe("AB3K9Q");
    expect(extrairCodigo("ab3k9q")).toBe("AB3K9Q");
    expect(extrairCodigo("oi, tudo bem?")).toBeUndefined();
    expect(extrairCodigo("ABCDEFGH")).toBeUndefined(); // 8 letras não é código
    // Palavras comuns de 6 letras não podem virar código (quebrariam comandos do bot).
    expect(extrairCodigo("buscar python")).toBeUndefined();
    expect(extrairCodigo("barbas")).toBeUndefined();
    expect(extrairCodigo("buscar 234567")).toBeUndefined(); // só número também não
    expect(extrairCodigo("buscar ok, código 7K3M9P")).toBe("7K3M9P");
  });
});

describe("cadastro com confirmação pelo WhatsApp", () => {
  it("fluxo completo: código → mensagem do próprio número → sessão", () => {
    const b = novo();
    cadastro(b);
    const { codigo, desafio } = b.novoCodigo(TEL, "cadastro");
    expect(extrairCodigo(codigo)).toBe(codigo); // todo código gerado é reconhecível
    expect(b.statusDoDesafio(desafio)?.confirmado).toBe(false);
    expect(() => b.concluirCadastro(desafio)).toThrow(/Ainda não/);

    // Mensagem de OUTRO número com o código certo não confirma.
    expect(b.confirmarPeloWhatsapp("5521999998888", `Meu código: ${codigo}`)?.ok).toBe(false);
    expect(b.confirmarPeloWhatsapp(TEL, `Meu código: ${codigo}`)?.ok).toBe(true);
    // Reenvio não confirma de novo.
    expect(b.confirmarPeloWhatsapp(TEL, codigo)?.ok).toBe(false);

    const token = b.concluirCadastro(desafio);
    expect(b.membroDaSessao(token)).toMatchObject({ telefone: TEL, verificado: true });
    // O código é de uso único.
    expect(() => b.concluirCadastro(desafio)).toThrow();
  });

  it("outro navegador (sem o desafio) não conclui", () => {
    const b = novo();
    cadastro(b);
    const { codigo } = b.novoCodigo(TEL, "cadastro");
    b.confirmarPeloWhatsapp(TEL, codigo);
    expect(() => b.concluirCadastro("desafio-inventado")).toThrow(ErroMembro);
    expect(() => b.concluirCadastro(undefined)).toThrow(ErroMembro);
  });

  it("código expira e o novo invalida o antigo", () => {
    const b = novo();
    cadastro(b);
    const t0 = new Date("2026-10-25T12:00:00Z");
    const a = b.novoCodigo(TEL, "cadastro", t0);
    expect(b.confirmarPeloWhatsapp(TEL, a.codigo, new Date("2026-10-25T12:16:00Z"))?.ok).toBe(false);
    const b1 = b.novoCodigo(TEL, "cadastro", t0);
    const b2 = b.novoCodigo(TEL, "cadastro", t0);
    expect(b.confirmarPeloWhatsapp(TEL, b1.codigo, t0)?.ok).toBe(false);
    expect(b.confirmarPeloWhatsapp(TEL, b2.codigo, t0)?.ok).toBe(true);
  });

  it("número confirmado não pode ser recadastrado; não confirmado pode", () => {
    const b = novo();
    cadastro(b, "primeira-senha");
    cadastro(b, "segunda-senha"); // ninguém provou o número ainda: substitui
    const { codigo, desafio } = b.novoCodigo(TEL, "cadastro");
    b.confirmarPeloWhatsapp(TEL, codigo);
    b.concluirCadastro(desafio);
    expect(() => cadastro(b, "terceira-senha")).toThrow(/já tem conta/);
    expect(b.entrar(TEL, "segunda-senha").verificado).toBe(true);
  });
});

describe("login", () => {
  it("mesma mensagem pra número inexistente e senha errada; bloqueia após limite", () => {
    const b = novo();
    cadastro(b);
    const erroInexistente = (() => { try { b.entrar("21 99999-0000", "x"); } catch (e) { return (e as Error).message; } })();
    const erroSenha = (() => { try { b.entrar(TEL, "errada"); } catch (e) { return (e as Error).message; } })();
    expect(erroInexistente).toBe(erroSenha);

    const agora = new Date();
    for (let i = 1; i < LIMITES.porTelefone; i++) expect(() => b.entrar(TEL, "errada", agora)).toThrow(/incorretos/);
    expect(() => b.entrar(TEL, "segredo-forte", agora)).toThrow(/Muitas tentativas/);
    // Passada a janela, volta a funcionar.
    expect(b.entrar(TEL, "segredo-forte", new Date(agora.getTime() + 16 * 60_000)).token).toBeTruthy();
  });

  it("limita por IP", () => {
    const b = novo();
    const agora = new Date();
    for (let i = 0; i < LIMITES.porIp; i++) b.checarIp("1.2.3.4", agora);
    expect(() => b.checarIp("1.2.3.4", agora)).toThrow(/Muitas tentativas/);
    expect(() => b.checarIp("5.6.7.8", agora)).not.toThrow();
  });
});

describe("esqueci a senha", () => {
  it("troca a senha só com confirmação e derruba sessões antigas", () => {
    const b = novo();
    cadastro(b);
    const c = b.novoCodigo(TEL, "cadastro");
    b.confirmarPeloWhatsapp(TEL, c.codigo);
    const velha = b.concluirCadastro(c.desafio);

    const r = b.novoCodigo(TEL, "senha");
    expect(() => b.redefinirSenha(r.desafio, "nova-senha-boa")).toThrow(/Confirme/);
    b.confirmarPeloWhatsapp(TEL, r.codigo);
    const nova = b.redefinirSenha(r.desafio, "nova-senha-boa");
    expect(b.membroDaSessao(velha)).toBeUndefined();
    expect(b.membroDaSessao(nova)?.telefone).toBe(TEL);
    expect(b.entrar(TEL, "nova-senha-boa").token).toBeTruthy();
  });

  it("número sem conta recebe código que nunca funciona (não revela se existe)", () => {
    const b = novo();
    const r = b.novoCodigo("21 99999-0000", "senha");
    expect(r.codigo).toHaveLength(6);
    expect(b.confirmarPeloWhatsapp("5521999990000", r.codigo)?.ok).toBe(false);
  });
});

describe("progresso e LGPD", () => {
  it("marca lições e apaga tudo ao excluir a conta", () => {
    const b = novo();
    const id = cadastro(b);
    b.marcarLicao(id, "curso-a", "l1", true);
    b.marcarLicao(id, "curso-a", "l1", true);
    b.marcarLicao(id, "curso-a", "l2", true);
    b.marcarLicao(id, "curso-a", "l2", false);
    expect([...b.licoesConcluidas(id, "curso-a")]).toEqual(["curso-a/l1"]);
    const token = b.criarSessao(id);
    b.excluirConta(id);
    expect(b.membroDaSessao(token)).toBeUndefined();
    expect(b.licoesConcluidas(id).size).toBe(0);
  });
});
