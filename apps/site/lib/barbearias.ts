import type { Barbearia, Expediente } from "@aprenda/agenda";
import { agoraNoFuso, dataValida, diaDaSemana, nomeDia, paraMinutos, TEMAS } from "@aprenda/agenda";
import { obterAgenda } from "@/lib/agenda";
import { soEntrega } from "@/lib/modo";

/** URL pública da foto (miniatura ou grande). Servida por app/f/[nome]/route.ts. */
export function urlFoto(arquivo: string, tamanho: "p" | "g" = "g"): string {
  return `/f/${arquivo}${tamanho === "p" ? "-p" : ""}.webp`;
}

export function urlAbsoluta(caminho: string): string {
  return `${(process.env.SITE_URL ?? "").replace(/\/$/, "")}${caminho}`;
}

/**
 * Link do site pra divulgar ("" = página inicial, "/agendar" = direto no agendar). No SaaS o app é
 * de uma barbearia só, então o endereço principal já é o site dela (e /agendar, o agendar).
 */
export function linkPublico(b: Pick<Barbearia, "slug">, pagina: "" | "/agendar" = ""): string {
  return urlAbsoluta(soEntrega() ? pagina : `/b/${b.slug}${pagina}`);
}

export function linkMapa(b: Pick<Barbearia, "nome" | "endereco" | "cidade">): string | undefined {
  if (!b.endereco) return undefined;
  const q = [b.nome, b.endereco, b.cidade].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/**
 * Mapa do Google Maps pra pôr na página (iframe, sem chave nem custo). Pino no endereço. Só a
 * cidade, sem endereço, vale só na prévia/demonstração (`demoAte`); site de cliente sem endereço
 * fica sem mapa.
 */
export function mapaEmbutido(b: Pick<Barbearia, "endereco" | "cidade" | "demoAte">): string | undefined {
  if (!b.endereco && !b.demoAte) return undefined;
  const q = [b.endereco, b.cidade].filter(Boolean).join(", ");
  if (!q) return undefined;
  return `https://www.google.com/maps?${new URLSearchParams({ q, z: b.endereco ? "16" : "13", hl: "pt-BR", output: "embed" })}`;
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
  const proximaAbertura = () => {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(`${hoje}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      const prox = expedientes.get(d.getUTCDay());
      if (prox) return `abre ${i === 1 ? "amanhã" : nomeDia(d.getUTCDay())} às ${prox.abre}`;
    }
    return undefined;
  };
  // O dono fechou hoje pelo painel (feriado, imprevisto): vale mais que o horário de funcionamento.
  if (b.fechadoEm === hoje) {
    const prox = proximaAbertura();
    return { aberto: false, texto: prox ? `Fechado hoje · ${prox}` : "Fechado hoje" };
  }
  if (e && min >= paraMinutos(e.abre) && min < paraMinutos(e.fecha)) {
    const pausa = e.pausaInicio && e.pausaFim && min >= paraMinutos(e.pausaInicio) && min < paraMinutos(e.pausaFim);
    return pausa
      ? { aberto: false, texto: `No intervalo · volta às ${e.pausaFim}` }
      : { aberto: true, texto: `Aberto agora · fecha às ${e.fecha}` };
  }
  if (e && min < paraMinutos(e.abre)) return { aberto: false, texto: `Fechado · abre hoje às ${e.abre}` };
  const prox = proximaAbertura();
  return { aberto: false, texto: prox ? `Fechado · ${prox}` : "Horários a confirmar" };
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
      "@type": "Offer",
      // Preço só vai pro Google se o dono quis mostrar no site.
      ...(b.mostrarPrecos && { price: (s.precoCentavos / 100).toFixed(2), priceCurrency: "BRL" }),
      itemOffered: { "@type": "Service", name: s.nome },
    })),
  };
  // Escapa "<" pra o JSON nunca fechar a tag <script> (dado vem do barbeiro).
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

/** Evento de calendário de um horário (com o link pra cancelar/remarcar, quando houver). */
export function montarEvento(b: Barbearia, h: { servico: string; profissional: string; inicio: string; duracaoMin: number; linkGestao?: string }) {
  const site = urlAbsoluta(`/b/${b.slug}`);
  return {
    uid: `${b.slug}-${h.inicio.replace(/\D/g, "")}-${h.profissional.replace(/\W/g, "")}@agenda`,
    titulo: `${h.servico} na ${b.nome}`,
    descricao: [
      `${h.servico} com ${h.profissional}.`,
      h.linkGestao?.startsWith("http")
        ? `Cancelar ou remarcar: ${h.linkGestao}`
        : `Precisa remarcar ou cancelar? WhatsApp da barbearia: https://wa.me/${b.telefone}`,
      ...(site.startsWith("http") && !h.linkGestao ? [site] : []),
    ].join("\n"),
    local: [b.endereco, b.cidade].filter(Boolean).join(", ") || undefined,
    inicio: h.inicio,
    duracaoMin: h.duracaoMin,
    fuso: b.fuso,
    lembreteMin: 60,
  };
}

/**
 * Evento a partir da URL antiga de confirmação (serviço, profissional, data e hora).
 * Só usa dados públicos da barbearia: não lê nem expõe agendamentos de ninguém.
 */
export function eventoDoHorario(b: Barbearia, sp: { servico?: string; profissional?: string; data?: string; hora?: string }) {
  const banco = obterAgenda();
  const servico = banco.servicos(b.id).find((s) => String(s.id) === sp.servico);
  const prof = banco.profissionais(b.id).find((p) => String(p.id) === sp.profissional);
  if (!servico || !prof || !sp.data || !dataValida(sp.data) || !sp.hora || !/^([01]\d|2[0-3]):[0-5]\d$/.test(sp.hora)) return undefined;
  const evento = montarEvento(b, { servico: servico.nome, profissional: prof.nome, inicio: `${sp.data}T${sp.hora}`, duracaoMin: servico.duracaoMin });
  return { evento, servico, prof };
}

/** Corte de cabelo (vai pro grupo "Cortes" no site), pelo nome do serviço. */
export function ehCorte(nome: string): boolean {
  return /corte|degrad|fade|taper|navalhado|social|americano|militar|tesoura|m[aá]quina|infantil|cabelo|freestyle|disfar[cç]ado|undercut|moicano|mullet|crop|buzz|topete|pompadour/i.test(nome);
}

/**
 * Uma foto pra cada serviço, pelo nome ("barba" → fotos de barba...). Evita repetir enquanto
 * houver foto que ainda não foi usada; sem palavra conhecida, usa os cortes e depois o resto.
 */
const TRABALHO = ["degrade", "navalhado", "corte", "barba", "sobrancelha", "infantil"];

export function fotosDosServicos<F extends { arquivo: string; categoria: string }>(nomes: string[], fotos: F[]): (F | undefined)[] {
  const usadas = new Set<string>();
  const regras: [RegExp, string[]][] = [
    [/sobrancelha/i, ["sobrancelha"]],
    [/infantil|crian|kids/i, ["infantil", "corte"]],
    [/navalh|risco|desenho|moicano/i, ["navalhado", "degrade"]],
    [/degrad|fade|taper|freestyle|pezinho|acabamento|disfar/i, ["degrade", "corte"]],
    [/barba|bigode|toalha|cavanhaque|pigment/i, ["barba"]],
    [/corte|cabelo|social|americano|militar|tesoura|m[aá]quina|crop|buzz|mullet|topete|pompadour|undercut/i, ["corte", "degrade"]],
    [/produto|pomada|hidrata|luzes|platin|selagem|relaxa/i, ["produtos", "corte"]],
  ];
  // Foto livre das categorias certas; acabou? Outra foto de trabalho ainda não usada; só então repete.
  const pegar = (categorias: string[]) => {
    for (const c of categorias) {
      const livre = fotos.find((f) => f.categoria === c && !usadas.has(f.arquivo));
      if (livre) return livre;
    }
    return fotos.find((f) => TRABALHO.includes(f.categoria) && !usadas.has(f.arquivo))
      ?? fotos.find((f) => f.categoria === categorias[0]);
  };
  return nomes.map((nome) => {
    const regra = regras.find(([r]) => r.test(nome));
    const f = pegar(regra ? regra[1] : ["corte", "degrade", "barba"]) ?? fotos.find((x) => !usadas.has(x.arquivo) && x.categoria !== "produtos");
    if (f) usadas.add(f.arquivo);
    return f;
  });
}
