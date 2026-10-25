import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Curso, Licao, Modulo } from "@aprenda/catalogo";
import type { CursoBruto, LicaoBruta } from "./tipos.ts";

const MODELO = "claude-opus-5-5";

const LicaoTraduzida = z.object({
  titulo: z.string(),
  conteudo: z.string(),
});

const INSTRUCOES = `Você traduz material didático aberto para o português do Brasil.

Regras:
- Tradução fiel e natural, no tom de um bom professor brasileiro. Não resuma, não omita, não acrescente conteúdo.
- Preserve EXATAMENTE a estrutura Markdown: títulos, listas, tabelas, links, imagens e blocos de código.
- Não traduza código, comandos, nomes de arquivos, URLs, nem atributos/tags HTML. Comentários dentro do código podem ser traduzidos.
- Termos técnicos consagrados em inglês no Brasil ficam em inglês (ex.: "commit", "deploy", "framework"); na primeira ocorrência, se ajudar, explique entre parênteses.
- Quando o texto citar um recurso externo que só existe em inglês, mantenha o link e não invente uma versão em português.
- "titulo" é o título da lição traduzido; "conteudo" é o Markdown completo traduzido.`;

export function criarCliente(): Anthropic {
  return new Anthropic();
}

export async function traduzirLicao(cliente: Anthropic, licao: LicaoBruta, idiomaOriginal: string): Promise<Licao> {
  const stream = cliente.beta.messages.stream({
    model: MODELO,
    max_tokens: 64000,
    // Tradução de material didático: qualidade importa mais que custo por chamada.
    output_config: { effort: "high", format: zodOutputFormat(LicaoTraduzida) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: INSTRUCOES,
    messages: [
      {
        role: "user",
        content: `Idioma original: ${idiomaOriginal}\n\nTítulo: ${licao.titulo}\n\n<conteudo>\n${licao.conteudo}\n</conteudo>`,
      },
    ],
  });
  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") {
    throw new Error(`Tradução recusada para a lição "${licao.id}": ${msg.stop_details?.explanation ?? "sem detalhes"}`);
  }
  if (msg.stop_reason === "max_tokens") {
    throw new Error(`Lição "${licao.id}" longa demais: a tradução foi cortada. Divida a lição na receita.`);
  }
  const texto = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const r = LicaoTraduzida.parse(JSON.parse(texto));
  return { id: licao.id, titulo: r.titulo, conteudo: r.conteudo, urlOriginal: licao.urlOriginal };
}

export interface OpcoesTraducao {
  /** Sem chave de API: grava o texto original, marcado como "original", pra testar o pipeline. */
  semTraducao?: boolean;
  aoProgredir?: (msg: string) => void;
}

export async function traduzirCurso(bruto: CursoBruto, opcoes: OpcoesTraducao = {}): Promise<Curso> {
  const log = opcoes.aoProgredir ?? (() => {});
  const cliente = opcoes.semTraducao ? undefined : criarCliente();
  const modulos: Modulo[] = [];
  for (const m of bruto.modulos) {
    const licoes: Licao[] = [];
    for (const l of m.licoes) {
      log(`  ${m.id}/${l.id}`);
      licoes.push(cliente ? await traduzirLicao(cliente, l, bruto.idiomaOriginal) : l);
    }
    modulos.push({ id: m.id, titulo: m.titulo, licoes });
  }
  return {
    ...bruto,
    modulos,
    traducao: cliente ? "automatica" : "original",
    atualizadoEm: new Date().toISOString().slice(0, 10),
  };
}
