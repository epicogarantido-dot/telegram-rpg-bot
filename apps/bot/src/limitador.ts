/** Limite simples de mensagens por conversa numa janela de 1 minuto. */
export class Limitador {
  private readonly historico = new Map<string, number[]>();
  constructor(private readonly opcoes: { porMinuto: number }, private readonly agora = () => Date.now()) {}

  permitir(chave: string): boolean {
    const limite = this.agora() - 60_000;
    const recentes = (this.historico.get(chave) ?? []).filter((t) => t > limite);
    if (recentes.length >= this.opcoes.porMinuto) {
      this.historico.set(chave, recentes);
      return false;
    }
    recentes.push(this.agora());
    this.historico.set(chave, recentes);
    return true;
  }
}
