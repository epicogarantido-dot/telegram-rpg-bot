/**
 * Cria 6 barbearias de DEMONSTRAÇÃO (uma por tema) com fotos reais do
 * Unsplash (licença gratuita: https://unsplash.com/license). Só pra teste:
 *
 *   npm run semear:demo -w @aprenda/site
 *
 * Login de cada uma: demo-<tema>@exemplo.com / senha "demonstracao".
 * Rodar de novo não duplica: barbearia que já existe é pulada.
 * Atrás de proxy, rode com NODE_USE_ENV_PROXY=1 pro fetch usar HTTPS_PROXY.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BancoAgenda, gravarFoto, pastaFotos, processarFoto, TEMAS } from "@aprenda/agenda";

const FOTOS: { id: string; categoria: string; legenda?: string }[] = [
  { id: "1512690459411-b9245aed614b", categoria: "ambiente", legenda: "Nossa cadeira" },
  { id: "1585747860715-2ba37e788b70", categoria: "ambiente", legenda: "O salão" },
  { id: "1592647420148-bfcc177e2117", categoria: "ambiente" },
  { id: "1593702275687-f8b402bf1fb5", categoria: "degrade", legenda: "Degradê clássico" },
  { id: "1622286342621-4bd786c2447c", categoria: "degrade", legenda: "Low fade" },
  { id: "1567894340315-735d7c361db0", categoria: "corte", legenda: "Corte na tesoura" },
  { id: "1605497788044-5a32c7078486", categoria: "corte" },
  { id: "1647140655214-e4a2d914971f", categoria: "corte", legenda: "Acabamento" },
  { id: "1532710093739-9470acff878f", categoria: "barba", legenda: "Barba com espuma" },
  { id: "1596728325488-58c87691e9af", categoria: "barba", legenda: "Toalha quente" },
  { id: "1503951914875-452162b0f3f1", categoria: "barba" },
  { id: "1517832606299-7ae9b720a186", categoria: "navalhado", legenda: "Navalha" },
  { id: "1599351431202-1e0f0137899a", categoria: "navalhado", legenda: "Desenho na navalha" },
  { id: "1521490683712-35a1cb235d1c", categoria: "infantil", legenda: "Primeiro corte" },
  { id: "1587909209111-5097ee578ec3", categoria: "produtos", legenda: "Pomadas" },
  { id: "1621605815971-fbc98d665033", categoria: "produtos" },
  { id: "1622287162716-f311baa1a2b8", categoria: "equipe", legenda: "Rafael" },
  { id: "1567894340315-735d7c361db0", categoria: "equipe", legenda: "Diego" },
  { id: "1605497788044-5a32c7078486", categoria: "equipe", legenda: "Bruno" },
];

const PAR_ANTES_DEPOIS = { antes: "1605497788044-5a32c7078486", depois: "1593702275687-f8b402bf1fb5" };

const PERFIS: Record<string, { nome: string; bio: string; oferta?: string; capa: string; desde?: number }> = {
  silencioso: { nome: "Norte Barbearia", bio: "Corte preciso. Uma cadeira, horário marcado.", capa: "1512690459411-b9245aed614b" },
  atemporal: { nome: "Maison Lâmina", bio: "O clássico nunca sai de moda. Cortes sociais, barba e dia do noivo.", capa: "1503951914875-452162b0f3f1" },
  cerimonia: { nome: "Salão Imperial", bio: "Atendimento sob reserva. Uma hora inteira, só sua.", capa: "1592647420148-bfcc177e2117" },
  tecnico: { nome: "Cume Barbearia", bio: "Ambiente climatizado, café e corte em dia. Pra você e pros pequenos.", oferta: "10% de desconto na primeira visita", capa: "1585747860715-2ba37e788b70", desde: 2016 },
  potencia: { nome: "Box 7", bio: "Degradê, navalhado e freestyle. Sem enrolação.", oferta: "Corte + barba por R$ 60 de terça a quinta", capa: "1622286342621-4bd786c2447c" },
  extravagancia: { nome: "Casa Aurum", bio: "A arte da navalha, desde 1998.", capa: "1596728325488-58c87691e9af", desde: 1998 },
};

const EQUIPE = [
  { nome: "Rafael Souza", especialidade: "Degradê e navalhado" },
  { nome: "Diego Lima", especialidade: "Corte na tesoura" },
  { nome: "Bruno Alves", especialidade: "Barba e toalha quente" },
];

async function baixar(id: string): Promise<Buffer> {
  const cache = join(pastaFotos(), "..", "cache-demo");
  mkdirSync(cache, { recursive: true });
  const arq = join(cache, `${id}.jpg`);
  if (existsSync(arq)) return readFileSync(arq);
  const r = await fetch(`https://images.unsplash.com/photo-${id}?w=1600&q=80&fm=jpg`);
  if (!r.ok) throw new Error(`Falha ao baixar ${id}: HTTP ${r.status}`);
  const dados = Buffer.from(await r.arrayBuffer());
  writeFileSync(arq, dados);
  return dados;
}

async function main() {
  // Baixa tudo antes de criar qualquer coisa: falha de rede não deixa barbearia pela metade.
  const imagens = new Map<string, Buffer>();
  for (const f of FOTOS) if (!imagens.has(f.id)) imagens.set(f.id, await baixar(f.id));
  const banco = new BancoAgenda(undefined, { valorCentavos: 2990, dias: 30, testeDias: 3650 });
  for (const tema of TEMAS) {
    const perfil = PERFIS[tema.id]!;
    const email = `demo-${tema.id}@exemplo.com`;
    if (banco.db.prepare("SELECT 1 FROM usuarios WHERE email = ?").get(email)) {
      console.log(`↷ ${perfil.nome} já existe`);
      continue;
    }
    const { barbearia: b } = banco.criarConta({ nomeBarbearia: perfil.nome, telefone: "5519900000000", nome: EQUIPE[0]!.nome, email, senha: "demonstracao" });
    banco.atualizarBarbearia(b.id, { nome: perfil.nome, telefone: "5519900000000", endereco: "Rua Exemplo, 123 - Centro" });
    banco.atualizarSite(b.id, { tema: tema.id, bio: perfil.bio, cidade: "Campinas", instagram: "suabarbearia", oferta: perfil.oferta, desde: perfil.desde ?? null });
    for (const p of EQUIPE.slice(1)) banco.adicionarProfissional(b.id, p.nome);

    const arquivoPorId = new Map<string, string>();
    for (const f of FOTOS) {
      const proc = await processarFoto(imagens.get(f.id)!);
      const arquivo = banco.registrarFoto(b.id, { categoria: f.categoria, legenda: f.legenda, largura: proc.largura, altura: proc.altura });
      gravarFoto(arquivo, proc);
      if (f.categoria !== "equipe") arquivoPorId.set(f.id, arquivo);
      else {
        const prof = banco.profissionais(b.id).find((p) => p.nome.startsWith(f.legenda!));
        const dados = EQUIPE.find((e) => e.nome.startsWith(f.legenda!))!;
        if (prof) banco.atualizarProfissional(b.id, prof.id, { especialidade: dados.especialidade, fotoArquivo: arquivo });
      }
    }
    const capa = banco.fotos(b.id).find((f) => f.arquivo === arquivoPorId.get(perfil.capa));
    if (capa) banco.definirCapa(b.id, capa.id);
    // Um par de antes e depois (aparece na Potência e na página de trabalhos).
    const antes = banco.fotos(b.id).find((f) => f.arquivo === arquivoPorId.get(PAR_ANTES_DEPOIS.antes));
    const depois = arquivoPorId.get(PAR_ANTES_DEPOIS.depois);
    if (antes && depois) banco.definirAntes(b.id, antes.id, depois);
    console.log(`✓ ${perfil.nome} (${tema.nome}) → /b/${b.slug}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
