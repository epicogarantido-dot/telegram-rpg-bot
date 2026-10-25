import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** Markdown do curso -> HTML seguro. O conteúdo vem de fora, então sempre sanitiza. */
export function renderizarMarkdown(md: string): string {
  const html = marked.parse(md, { async: false });
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "details", "summary"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      code: ["class"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
