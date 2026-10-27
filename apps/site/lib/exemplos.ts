import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gravarFoto, processarFoto, TEMAS } from "@aprenda/agenda";
import { PASTA_CURSOS } from "@aprenda/catalogo";
import { obterAgenda } from "./agenda";

/**
 * Sites de exemplo, um por estilo, pra mostrar ao barbeiro um site de verdade no ar (o
 * /barbeiros e a página inicial levam até eles). São demonstrações sem dono e sem login:
 * ninguém consegue entrar e mudar nada, a marcação vai até o último passo mas não grava,
 * e o aviso no topo diz que é exemplo. Fotos de `data/demo-fotos` (Unsplash), que vêm no zip.
 */
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

export function ehSiteDeExemplo(slug: string): boolean {
  return Object.values(sitesDeExemplo()).includes(slug);
}

/** Cria os exemplos que faltam (rodar de novo não duplica). Devolve quantos criou. */
export async function criarSitesDeExemplo(): Promise<number> {
  const banco = obterAgenda();
  const existentes = sitesDeExemplo();
  const fotos = JSON.parse(await readFile(join(PASTA_FOTOS_DEMO, "fotos.json"), "utf8")) as { arquivo: string; categoria: string; legenda?: string }[];
  // Cada foto passa por processarFoto uma vez só e vale pros 6 sites (no servidor da Square é lento).
  const prontas = new Map<string, Awaited<ReturnType<typeof processarFoto>>>();
  for (const f of fotos) prontas.set(f.arquivo, await processarFoto(await readFile(join(PASTA_FOTOS_DEMO, f.arquivo))));
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
      const proc = prontas.get(f.arquivo)!;
      const arquivo = banco.registrarFoto(b.id, { categoria: f.categoria, legenda: f.legenda, largura: proc.largura, altura: proc.altura });
      gravarFoto(arquivo, proc);
      if (f.arquivo === perfil.capa) capa = arquivo;
    }
    const foto = banco.fotos(b.id).find((f) => f.arquivo === capa);
    if (foto) banco.definirCapa(b.id, foto.id);
    if (tema.id === "potencia") banco.atualizarFuncionamento(b.id, { mostrarPrecos: true, intervaloMin: 30, atendimento: "ambos" });
    existentes[tema.id] = b.slug;
    banco.definirConfiguracao(CHAVE, JSON.stringify(existentes));
    criados++;
  }
  return criados;
}
