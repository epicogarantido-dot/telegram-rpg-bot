import type { Barbearia, Expediente } from "@aprenda/agenda";
import { agoraNoFuso, diaDaSemana, nomeDia, paraMinutos, TEMAS } from "@aprenda/agenda";

/** URL pública da foto (miniatura ou grande). Servida por app/f/[nome]/route.ts. */
export function urlFoto(arquivo: string, tamanho: "p" | "g" = "g"): string {
  return `/f/${arquivo}${tamanho === "p" ? "-p" : ""}.webp`;
}

export function urlAbsoluta(caminho: string): string {
  return `${(process.env.SITE_URL ?? "").replace(/\/$/, "")}${caminho}`;
}

export function linkMapa(b: Pick<Barbearia, "nome" | "endereco" | "cidade">): string | undefined {
  if (!b.endereco) return undefined;
  const q = [b.nome, b.endereco, b.cidade].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function nivelEfeitos(tema: string): number {
  return TEMAS.find((t) => t.id === tema)?.efeitos ?? 1;
}

/** "Aberto agora · fecha às 19:00", "Abre amanhã às 09:00"... pra primeira tela do site. */
export function situacaoAgora(b: Barbearia, expedientes: Map<number, Expediente>): { aberto: boolean; texto: string } {
  const agora = agoraNoFuso(b.fuso);
  const hoje = agora.slice(0, 10);
  const min = paraMinutos(agora.slice(11));
  const e = expedientes.get(diaDaSemana(hoje));
  if (e && min >= paraMinutos(e.abre) && min < paraMinutos(e.fecha)) {
    const pausa = e.pausaInicio && e.pausaFim && min >= paraMinutos(e.pausaInicio) && min < paraMinutos(e.pausaFim);
    return pausa
      ? { aberto: false, texto: `No intervalo · volta às ${e.pausaFim}` }
      : { aberto: true, texto: `Aberto agora · fecha às ${e.fecha}` };
  }
  if (e && min < paraMinutos(e.abre)) return { aberto: false, texto: `Fechado · abre hoje às ${e.abre}` };
  for (let i = 1; i <= 7; i++) {
    const d = new Date(`${hoje}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const prox = expedientes.get(d.getUTCDay());
    if (prox) return { aberto: false, texto: `Fechado · abre ${i === 1 ? "amanhã" : nomeDia(d.getUTCDay())} às ${prox.abre}` };
  }
  return { aberto: false, texto: "Horários a confirmar" };
}

const DIAS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Dados estruturados pro Google entender que é uma barbearia (nome, endereço, horário, serviços). */
export function dadosEstruturados(b: Barbearia, ctx: {
  expedientes: Map<number, Expediente>; servicos: { nome: string; precoCentavos: number }[]; capa?: string;
}): string {
  const horario = [...ctx.expedientes].flatMap(([dia, e]) => (e.pausaInicio && e.pausaFim
    ? [[e.abre, e.pausaInicio], [e.pausaFim, e.fecha]] : [[e.abre, e.fecha]])
    .map(([abre, fecha]) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DIAS_SCHEMA[dia], opens: abre, closes: fecha })));
  const dados = {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    name: b.nome,
    url: urlAbsoluta(`/b/${b.slug}`),
    telephone: `+${b.telefone}`,
    ...(b.bio && { description: b.bio }),
    ...(ctx.capa && { image: urlAbsoluta(urlFoto(ctx.capa)) }),
    ...(b.endereco && { address: { "@type": "PostalAddress", streetAddress: b.endereco, addressLocality: b.cidade, addressCountry: "BR" } }),
    openingHoursSpecification: horario,
    makesOffer: ctx.servicos.map((s) => ({
      "@type": "Offer", price: (s.precoCentavos / 100).toFixed(2), priceCurrency: "BRL",
      itemOffered: { "@type": "Service", name: s.nome },
    })),
  };
  // Escapa "<" pra o JSON nunca fechar a tag <script> (dado vem do barbeiro).
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}
