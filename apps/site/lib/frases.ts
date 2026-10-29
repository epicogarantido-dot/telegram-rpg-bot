/**
 * Frases entre as seções do site da barbearia: quebram a sequência de fotos e vendem a ideia
 * (o corte como preparo, presença, ritual). Quatro por estilo, no tom de cada um: três em letreiro entre as seções e a última como título da chamada final.
 */
const FRASES: Record<string, [string, string, string, string]> = {
  potencia: [
    "Cabelo na régua é armadura. Você sai daqui pronto pra guerra.",
    "Ninguém lembra de um corte mais ou menos.",
    "Degradê limpo, cabeça erguida. O resto é consequência.",
    "Fade alinhado não é luxo. É padrão.",
  ],
  cerimonia: [
    "Uma hora só sua. O mundo espera lá fora.",
    "Elegância não se explica. Se percebe.",
    "Você entra cansado. Sai lembrando quem é.",
    "Atendimento sem pressa, acabamento sem erro.",
  ],
  extravagancia: [
    "Reis não pedem licença. Mas marcam horário.",
    "A navalha certa transforma um homem em presença.",
    "Todo guerreiro tem seu ritual antes da batalha.",
    "Brilho de rei começa na navalha.",
  ],
  silencioso: [
    "O corte certo fala antes de você.",
    "Menos é mais. Mas tem que ser perfeito.",
    "Toda grande semana começa na cadeira do barbeiro.",
    "Detalhe é o que separa o bom do impecável.",
  ],
  atemporal: [
    "Estilo não envelhece.",
    "Um bom corte não muda quem você é. Revela.",
    "Barba feita, olhar firme. Pronto pro que vier.",
    "Clássico é o que nunca precisa de explicação.",
  ],
  tecnico: [
    "Corte em dia, cabeça leve.",
    "Cuidar de si também é coisa de homem forte.",
    "Saia daqui pronto pra vencer o dia.",
    "Hora marcada, atendimento no tempo certo.",
  ],
};

export function frasesDoTema(tema: string): [string, string, string, string] {
  return FRASES[tema] ?? FRASES.silencioso!;
}
