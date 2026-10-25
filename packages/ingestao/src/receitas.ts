import type { ReceitaGithub } from "./fontes/github-markdown.ts";

const ODIN: ReceitaGithub["fonte"] = {
  nome: "The Odin Project",
  url: "https://www.theodinproject.com/paths/foundations/courses/foundations",
  tituloOriginal: "Foundations",
  autores: ["The Odin Project", "Erik Trautman"],
  licenca: "CC-BY-NC-SA-4.0",
  atribuicao:
    "Traduzido e adaptado de “Foundations”, de The Odin Project (autor original: Erik Trautman), licenciado sob CC BY-NC-SA 4.0. Esta tradução é distribuída sob a mesma licença.",
};

/**
 * Cursos que sabemos coletar. Para adicionar um novo, siga a skill
 * `.claude/skills/adicionar-fonte` — confira a licença ANTES de tudo.
 */
export const RECEITAS: ReceitaGithub[] = [
  {
    slug: "primeiros-passos-na-web",
    titulo: "Primeiros Passos na Web",
    resumo:
      "Curso relâmpago: o que acontece quando você abre um site e qual editor de texto usar para começar a programar.",
    area: "Programação",
    nivel: "iniciante",
    tags: ["web", "internet", "ferramentas"],
    idiomaOriginal: "en",
    repo: "TheOdinProject/curriculum",
    ref: "main",
    fonte: ODIN,
    modulos: [
      {
        id: "preparacao",
        titulo: "Preparação",
        licoes: ["foundations/installations/how_does_the_web_work.md", "foundations/installations/text_editors.md"],
      },
    ],
  },
  {
    slug: "fundamentos-desenvolvimento-web",
    titulo: "Fundamentos do Desenvolvimento Web",
    resumo:
      "Comece do zero: como a web funciona, como pensar como programador e como pedir ajuda. Primeira parte do currículo do The Odin Project.",
    area: "Programação",
    nivel: "iniciante",
    tags: ["web", "html", "javascript", "carreira"],
    idiomaOriginal: "en",
    repo: "TheOdinProject/curriculum",
    ref: "main",
    fonte: { ...ODIN, tituloOriginal: "Foundations" },
    modulos: [
      {
        id: "introducao",
        titulo: "Introdução",
        licoes: [
          "foundations/introduction/how_this_course_will_work.md",
          "foundations/introduction/introduction_to_web_development.md",
          "foundations/introduction/motivation_and_mindset.md",
          "foundations/introduction/asking_for_help.md",
        ],
      },
      {
        id: "preparacao",
        titulo: "Preparação",
        licoes: [
          "foundations/installations/how_does_the_web_work.md",
          "foundations/installations/command_line_basics.md",
          "foundations/installations/text_editors.md",
        ],
      },
    ],
  },
];
