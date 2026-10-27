import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gravarFoto, processarFoto, TEMAS, type Barbearia } from "@aprenda/agenda";
import { PASTA_CURSOS } from "@aprenda/catalogo";
import { obterAgenda } from "./agenda";
import { porCardapio } from "./cardapio";

/**
 * Sites de exemplo, um por estilo, pra mostrar ao barbeiro um site de verdade no ar (o
 * /barbeiros e a página inicial levam até eles). São demonstrações sem dono e sem login:
 * ninguém consegue entrar e mudar nada, a marcação vai até o último passo mas não grava,
 * e o aviso no topo diz que é exemplo. Fotos de `data/demo-fotos` (Unsplash), que vêm no zip.
 */
/** Endereços ilustrativos (rua do centro de Campinas, sem número) só pro mapa do exemplo ter onde apontar. */
const ENDERECOS: Record<string, string> = {
  silencioso: "Rua Barão de Jaguara, Centro",
  atemporal: "Rua Conceição, Centro",
  cerimonia: "Rua General Osório, Centro",
  tecnico: "Avenida Francisco Glicério, Centro",
  potencia: "Rua Dr. Quirino, Centro",
  extravagancia: "Rua Ferreira Penteado, Centro",
};

const PERFIS: Record<string, { nome: string; bio: string; oferta?: string; desde?: number; capa: string }> = {
  silencioso: { nome: "Norte Barbearia", bio: "Corte preciso. Uma cadeira, horário marcado.", capa: "ambiente-15126904.jpg" },
  atemporal: { nome: "Maison Lâmina", bio: "O clássico nunca sai de moda. Cortes sociais, barba e dia do noivo.", capa: "barba-15039519.jpg" },
  cerimonia: { nome: "Salão Imperial", bio: "Atendimento sob reserva. Uma hora inteira, só sua.", capa: "ambiente-15926474.jpg" },
  tecnico: { nome: "Cume Barbearia", bio: "Ambiente climatizado, café e corte em dia. Pra você e pros pequenos.", oferta: "10% de desconto na primeira visita", desde: 2016, capa: "ambiente-15857478.jpg" },
  potencia: { nome: "Box 7", bio: "Degradê, navalhado e freestyle. Sem enrolação.", oferta: "Corte + barba por R$ 60 de terça a quinta", capa: "degrade-16222863.jpg" },
  extravagancia: { nome: "Casa Aurum", bio: "A arte da navalha, desde 1998.", desde: 1998, capa: "barba-15967283.jpg" },
};

const EQUIPE = [
  { nome: "Rafael Souza", especialidade: "Degradê e navalhado" },
  { nome: "Diego Lima", especialidade: "Corte na tesoura" },
  { nome: "Bruno Alves", especialidade: "Barba e toalha quente" },
];

/** Os exemplos ficam no ar por 10 anos (o aviso não mostra a data, só que é exemplo). */
const DIAS_NO_AR = 3650;
const CHAVE = "sites_exemplo";
/** Fotos do banco (data/demo-fotos) que já entraram nos exemplos: as novas entram depois, pelo mesmo botão. */
const CHAVE_FOTOS = "fotos_exemplo";
const PASTA_FOTOS_DEMO = join(dirname(PASTA_CURSOS), "demo-fotos");

/** tema → slug dos exemplos que existem e estão no ar. */
export function sitesDeExemplo(): Record<string, string> {
  const banco = obterAgenda();
  const salvos = JSON.parse(banco.configuracao(CHAVE) ?? "{}") as Record<string, string>;
  return Object.fromEntries(Object.entries(salvos).filter(([, slug]) => {
    const b = banco.barbeariaPorSlug(slug);
    return b && banco.acessoAtivo(b);
  }));
}

type FotoDemo = { arquivo: string; categoria: string; legenda?: string; licenca?: string };

async function fotosDoBanco(): Promise<FotoDemo[]> {
  return JSON.parse(await readFile(join(PASTA_FOTOS_DEMO, "fotos.json"), "utf8")) as FotoDemo[];
}

/** Fotos já postas nos exemplos. Sem registro, vale o primeiro lote (as do Unsplash, sem campo `licenca`). */
function fotosJaPostas(lista: FotoDemo[]): Set<string> {
  const salvas = obterAgenda().configuracao(CHAVE_FOTOS);
  return new Set(salvas ? JSON.parse(salvas) as string[] : lista.filter((f) => !f.licenca).map((f) => f.arquivo));
}

/** Quantas fotos do banco ainda não estão nos exemplos que já existem. */
export async function fotosNovasParaExemplos(): Promise<number> {
  if (Object.keys(sitesDeExemplo()).length === 0) return 0;
  const lista = await fotosDoBanco();
  const postas = fotosJaPostas(lista);
  return lista.filter((f) => !postas.has(f.arquivo)).length;
}

/**
 * Acervo de fotos padrão: o site de exemplo do estilo pedido (ou o primeiro que houver). É de
 * onde a conta nova tira as fotos iniciais e o painel oferece fotos pra cada espaço do site.
 */
export function acervo(tema?: string): Barbearia | undefined {
  const exemplos = sitesDeExemplo();
  const slug = (tema && exemplos[tema]) || Object.values(exemplos)[0];
  return slug ? obterAgenda().barbeariaPorSlug(slug) : undefined;
}

/** Fotos com que um site novo começa: a capa e até 2 por espaço. O resto do acervo fica pra escolher no painel. */
export const FOTOS_PADRAO_POR_ESPACO = 2;

export function porFotosPadrao(destinoId: number, tema: string): void {
  const origem = acervo(tema);
  if (!origem) return;
  const banco = obterAgenda();
  const porEspaco = new Map<string, number>();
  for (const f of banco.fotos(origem.id)) {
    const n = porEspaco.get(f.categoria) ?? 0;
    if (!f.capa && n >= FOTOS_PADRAO_POR_ESPACO) continue;
    porEspaco.set(f.categoria, n + 1);
    const id = banco.usarFotoDoAcervo(destinoId, origem.id, f.id);
    if (f.capa) banco.definirCapa(destinoId, id);
  }
}

export function ehSiteDeExemplo(slug: string): boolean {
  return Object.values(sitesDeExemplo()).includes(slug);
}

/**
 * Cria os exemplos que faltam e põe nos que já existem as fotos novas do banco (rodar de novo
 * não duplica). As prévias de /montar copiam as fotos do exemplo, então ganham as novas também.
 * Devolve quantos sites criou.
 */
export async function criarSitesDeExemplo(): Promise<number> {
  const banco = obterAgenda();
  const existentes = sitesDeExemplo();
  const fotos = await fotosDoBanco();
  const postas = fotosJaPostas(fotos);
  const novas = fotos.filter((f) => !postas.has(f.arquivo));
  const precisam = new Set([...(Object.keys(existentes).length < TEMAS.length ? fotos : novas).map((f) => f.arquivo)]);
  // Cada foto passa por processarFoto uma vez só e vale pros 6 sites (no servidor da Square é lento).
  const prontas = new Map<string, Awaited<ReturnType<typeof processarFoto>>>();
  for (const f of fotos) if (precisam.has(f.arquivo)) prontas.set(f.arquivo, await processarFoto(await readFile(join(PASTA_FOTOS_DEMO, f.arquivo))));
  const registrar = (barbeariaId: number, f: FotoDemo) => {
    const proc = prontas.get(f.arquivo)!;
    const arquivo = banco.registrarFoto(barbeariaId, { categoria: f.categoria, legenda: f.legenda, largura: proc.largura, altura: proc.altura });
    gravarFoto(arquivo, proc);
    return arquivo;
  };
  for (const slug of Object.values(existentes)) {
    const b = banco.barbeariaPorSlug(slug);
    if (b) for (const f of novas) registrar(b.id, f);
  }
  let criados = 0;
  for (const tema of TEMAS) {
    const perfil = PERFIS[tema.id];
    if (!perfil || existentes[tema.id]) continue;
    const { barbearia: b } = banco.criarDemonstracao({ nome: perfil.nome, tema: tema.id, cidade: "Campinas", dias: DIAS_NO_AR });
    banco.atualizarSite(b.id, { tema: tema.id, bio: perfil.bio, cidade: "Campinas", oferta: perfil.oferta, desde: perfil.desde ?? null });
    const [primeiro] = banco.profissionais(b.id);
    if (primeiro) banco.atualizarProfissional(b.id, primeiro.id, { nome: EQUIPE[0]!.nome, especialidade: EQUIPE[0]!.especialidade });
    for (const p of EQUIPE.slice(1)) {
      banco.adicionarProfissional(b.id, p.nome);
      const novo = banco.profissionais(b.id).find((x) => x.nome === p.nome);
      if (novo) banco.atualizarProfissional(b.id, novo.id, { especialidade: p.especialidade });
    }
    let capa: string | undefined;
    for (const f of fotos) {
      const arquivo = registrar(b.id, f);
      if (f.arquivo === perfil.capa) capa = arquivo;
    }
    const foto = banco.fotos(b.id).find((f) => f.arquivo === capa);
    if (foto) banco.definirCapa(b.id, foto.id);
    if (tema.id === "potencia") banco.atualizarFuncionamento(b.id, { mostrarPrecos: true, intervaloMin: 30, atendimento: "ambos" });
    existentes[tema.id] = b.slug;
    banco.definirConfiguracao(CHAVE, JSON.stringify(existentes));
    criados++;
  }
  for (const slug of Object.values(existentes)) {
    const b = banco.barbeariaPorSlug(slug);
    if (b) {
      porFotosNaEquipe(b.id);
      porCardapio(b.id);
      const endereco = ENDERECOS[b.tema];
      if (!b.endereco && endereco) banco.atualizarBarbearia(b.id, { nome: b.nome, telefone: b.telefone, endereco });
    }
  }
  banco.definirConfiguracao(CHAVE_FOTOS, JSON.stringify(fotos.map((f) => f.arquivo)));
  return criados;
}

/** Profissional do exemplo sem foto ganha um retrato do espaço "equipe" (um diferente pra cada). */
function porFotosNaEquipe(barbeariaId: number): void {
  const banco = obterAgenda();
  const retratos = banco.fotos(barbeariaId).filter((f) => f.categoria === "equipe");
  const usados = new Set(banco.profissionais(barbeariaId).map((p) => p.fotoArquivo).filter(Boolean));
  const livres = retratos.filter((f) => !usados.has(f.arquivo));
  for (const p of banco.profissionais(barbeariaId)) {
    const foto = !p.fotoArquivo && livres.shift();
    if (foto) banco.atualizarProfissional(barbeariaId, p.id, { fotoArquivo: foto.arquivo });
  }
}
