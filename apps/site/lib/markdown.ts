import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** Markdown do curso -> HTML seguro. O conteúdo vem de fora, então sempre sanitiza. */
export function renderizarMarkdown(md: string): string {
  const html = marked.parse(md, { async: false })
    // Foto sozinha num parágrafo, com título, vira figura com legenda: ![alt](src "Foto: crédito (licença)").
    .replace(/<p><img src="([^"]+)" alt="([^"]*)" title="([^"]+)"\s*\/?><\/p>/g,
      '<figure class="artigo-foto"><img src="$1" alt="$2" loading="lazy" decoding="async"><figcaption>$3</figcaption></figure>');
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "details", "summary", "figure", "figcaption"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "loading", "decoding"],
      code: ["class"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
