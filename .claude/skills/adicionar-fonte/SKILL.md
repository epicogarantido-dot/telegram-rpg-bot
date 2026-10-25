---
name: adicionar-fonte
description: Adiciona um novo curso gratuito (de outro idioma) ao catálogo do Aprenda Livre — verifica a licença, cria a receita de coleta e gera o JSON do curso. Use quando pedirem para "adicionar curso", "trazer curso de X", "nova fonte" ou "buscar cursos grátis".
---

# Adicionar uma fonte de curso

## 1. Licença primeiro — sem isso, PARE

Abra o arquivo de licença da fonte (LICENSE, license.md, rodapé do site) e confirme
que ela está em `Licenca` (`packages/catalogo/src/schema.ts`). Regras:

- ✅ CC BY, CC BY-SA, CC0, MIT, BSD → pode traduzir e publicar.
- ⚠️ CC BY-NC / BY-NC-SA → pode, mas a página **não pode ter anúncio nem cobrança**.
- ❌ CC BY-ND (sem derivadas), "todos os direitos reservados", "grátis para assistir"
  (Coursera, Udemy grátis, YouTube comum) → **não entra**. Grátis ≠ aberto.
  Nesse caso, no máximo um link para o original, nunca o conteúdo traduzido.

Copie a frase de atribuição que a licença exige para `fonte.atribuicao`.
Detalhes e fontes já avaliadas: `docs/licencas.md`.

## 2. Receita

Se o material é Markdown num repositório GitHub, adicione uma entrada em
`packages/ingestao/src/receitas.ts` (adaptador `github-markdown`). Prefira um
commit fixo em `ref` em vez de `main`, pra tradução ser reproduzível.
Fonte de outro formato (API, HTML, PDF) → crie um adaptador novo em
`packages/ingestao/src/fontes/` que devolva `CursoBruto`, com teste.

## 3. Coletar e traduzir

```bash
npm run ingerir -- --listar
npm run ingerir -- <slug>                # precisa de ANTHROPIC_API_KEY
npm run ingerir -- --sem-traducao <slug> # só pra testar a coleta
```

## 4. Conferir

- `npm test` e `npm run build:site` passam.
- Abra uma lição no site e compare com o original: Markdown, links e código intactos.
- Para revisão de qualidade, use o agente `revisor-traducao`.
