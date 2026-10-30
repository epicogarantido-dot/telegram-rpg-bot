/**
 * Frases entre as seções do site da barbearia: quebram a sequência de fotos e vendem a ideia
 * (o corte como preparo, presença, ritual). Quatro por estilo, no tom de cada um: três em letreiro entre as seções e a última como título da chamada final.
 */
// Regras: frase curta, que se lê correndo no letreiro; nada que a barbearia talvez não tenha
// (café, ar, toalha quente); a quarta chama pra marcar, porque é o título do botão final.
const FRASES: Record<string, [string, string, string, string]> = {
  potencia: [
    "Degradê na régua do primeiro ao último fio.",
    "Aqui o fade não acaba. Ele some.",
    "Sai da cadeira já conferindo no espelho.",
    "Tua próxima régua tá a um toque.",
  ],
  cerimonia: [
    "Sem pressa. Cada detalhe no lugar.",
    "Aqui o relógio anda mais devagar.",
    "Você entra cansado. Sai lembrando quem é.",
    "Reserve a sua hora.",
  ],
  extravagancia: [
    "Tradição de barbearia, acabamento de joalheiro.",
    "Barba desenhada fio a fio.",
    "Todo rei tem a sua cadeira.",
    "Sua cadeira está esperando.",
  ],
  silencioso: [
    "Bom corte não precisa de legenda.",
    "Linhas limpas. Nada sobrando.",
    "O corte certo fala antes de você.",
    "Marque o seu horário.",
  ],
  atemporal: [
    "Clássico é o corte que nunca sai de moda.",
    "Tesoura, pente e mão de quem sabe.",
    "Estilo não envelhece.",
    "Seu horário de sempre, a um toque.",
  ],
  tecnico: [
    "Hora marcada, cadeira pronta quando você chega.",
    "Do primeiro corte do filho ao degradê do pai.",
    "Cuidar do visual cabe na sua agenda.",
    "Escolha o horário que cabe no seu dia.",
  ],
};

export function frasesDoTema(tema: string): [string, string, string, string] {
  return FRASES[tema] ?? FRASES.silencioso!;
}
