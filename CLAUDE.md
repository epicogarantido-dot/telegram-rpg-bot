# Aprenda Livre

Cursos gratuitos e **abertos** do mundo inteiro, traduzidos para o português do Brasil,
num site e num bot de WhatsApp. Tudo em TypeScript, monorepo com npm workspaces.

## Mapa

- `data/cursos/*.json` — o catálogo. Fonte da verdade; validado por `Curso` (zod).
- `packages/catalogo` — schema, carregamento e busca. Usado pelo site e pelo bot.
- `packages/ingestao` — coleta de fontes (`fontes/`), receitas (`receitas.ts`) e tradução com a API do Claude (`traduzir.ts`).
- `packages/prospeccao` — leads por nicho via Google Places API, SQLite em `data/privado/` (fora do git), mensagem de convite, opt-out.
- `apps/site` — Next.js (App Router). Cursos (estático), `/barbeiros` (captação opt-in), `/painel` (leads, protegido por `PAINEL_SENHA`).
- `apps/bot` — WhatsApp via Baileys (não oficial). `responder.ts` é a lógica pura; `index.ts` é só transporte.
- `docs/` — licenças/fontes, riscos do WhatsApp e `estrategia.md` (funil e roadmap do SaaS).

## Comandos

```bash
npm test               # vitest em todos os pacotes
npm run typecheck
npm run build:site
npm run dev:site
npm run ingerir -- --listar | <slug> | --todos [--sem-traducao]
npm run bot
npm run prospectar -- buscar barbearia "Campinas SP" | listar | resumo
```

## Regras do projeto

- **Licença antes de tudo.** Nenhum curso entra sem licença aberta que permita tradução (ver `docs/licencas.md` e a skill `adicionar-fonte`). Grátis ≠ aberto.
- Toda página de curso mostra a atribuição (`fonte.atribuicao`). Não remova.
- Cursos CC BY-NC: nada de anúncio ou cobrança nessas páginas (`permiteUsoComercial`).
- O bot só responde; não implementar disparo em massa. Convites de prospecção saem do painel, enviados por uma pessoa, um a um, com limite diário.
- Todo convite identifica o remetente e oferece SAIR; opt-out é permanente (`bloqueados`).
- Dados de Maps só pela Places API oficial; nunca raspar o site do Google Maps.
- Nunca commitar `.env` nem `apps/bot/auth/`.
- Código e textos em português; identificadores também.
