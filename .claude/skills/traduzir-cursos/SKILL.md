---
name: traduzir-cursos
description: Traduz ou retraduz cursos do catálogo para pt-BR usando o pipeline com a API do Claude, ou traduz manualmente quando não há chave de API. Use quando pedirem para traduzir, retraduzir, melhorar tradução ou quando um curso estiver com traducao "original".
---

# Traduzir cursos

- **Padrão (custo zero): você mesmo traduz, na sessão.** Rode
  `npm run ingerir -- --sem-traducao <slug>`, traduza `titulo` e `conteudo` de cada
  lição em `data/cursos/<slug>.json` seguindo as regras de `INSTRUCOES` em
  `traduzir.ts`, e mude `traducao` para `"automatica"`. Lições longas: uma por vez.
- Só se o dono configurar `ANTHROPIC_API_KEY` (é pago): `npm run ingerir -- <slug>`
  traduz em lote pela API.
- Só marque `"revisada"` depois que uma pessoa revisar.
- Nunca traduza código, URLs, nomes de arquivo ou atributos HTML.
- Depois: `npm test && npm run build:site`.
