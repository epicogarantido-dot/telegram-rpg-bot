import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Curso, PASTA_CURSOS } from "@aprenda/catalogo";
import { coletarGithub } from "./fontes/github-markdown.ts";
import { RECEITAS } from "./receitas.ts";
import { traduzirCurso } from "./traduzir.ts";

const USO = `Uso: npm run ingerir -- [--sem-traducao] [--listar] <slug...|--todos>

  --listar         mostra as receitas disponíveis
  --todos          coleta e traduz todas as receitas
  --sem-traducao   grava o texto original (útil sem ANTHROPIC_API_KEY)`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--listar")) {
    for (const r of RECEITAS) console.log(`${r.slug}  —  ${r.titulo} [${r.fonte.licenca}]`);
    return;
  }
  const semTraducao = args.includes("--sem-traducao");
  const slugs = args.filter((a) => !a.startsWith("--"));
  const escolhidas = args.includes("--todos") ? RECEITAS : RECEITAS.filter((r) => slugs.includes(r.slug));
  if (escolhidas.length === 0) {
    console.error(USO);
    process.exit(1);
  }
  if (!semTraducao && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error("Defina ANTHROPIC_API_KEY (ou rode com --sem-traducao).");
    process.exit(1);
  }

  await mkdir(PASTA_CURSOS, { recursive: true });
  for (const receita of escolhidas) {
    console.log(`📥 ${receita.slug}: coletando de ${receita.repo}`);
    const bruto = await coletarGithub(receita);
    console.log(`🌎 traduzindo ${bruto.modulos.reduce((n, m) => n + m.licoes.length, 0)} lições`);
    const curso = Curso.parse(await traduzirCurso(bruto, { semTraducao, aoProgredir: console.log }));
    const destino = join(PASTA_CURSOS, `${curso.slug}.json`);
    await writeFile(destino, JSON.stringify(curso, null, 2) + "\n");
    console.log(`✅ ${destino}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
