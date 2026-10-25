# 📚 Aprenda Livre

O conhecimento do mundo, em português. Reunimos cursos gratuitos com licença aberta
(The Odin Project, MIT OCW, OpenStax, …), traduzimos com IA e publicamos num site e
num bot de WhatsApp — sempre com crédito aos autores originais.

```
fontes abertas ──► ingestão (coleta + tradução Claude) ──► data/cursos/*.json
                                                             │
                                          ┌──────────────────┴─────────────┐
                                          ▼                                ▼
                                     site (Next.js)                bot WhatsApp (Baileys)
```

## Começar

```bash
npm install
npm run dev:site                       # http://localhost:3000
npm test
```

Traduzir um curso novo (precisa de `ANTHROPIC_API_KEY`):

```bash
npm run ingerir -- --listar
npm run ingerir -- fundamentos-desenvolvimento-web
```

Bot de WhatsApp: leia **[docs/whatsapp.md](docs/whatsapp.md)** antes (riscos de banimento).

Fontes e licenças: **[docs/licencas.md](docs/licencas.md)**.

Prospecção de nichos (leads do Google Maps, painel, comunidade, SaaS): **[docs/estrategia.md](docs/estrategia.md)**.

Publicar: **[docs/deploy-square.md](docs/deploy-square.md)** · Regras de custo: **[docs/custo-zero.md](docs/custo-zero.md)**.

## Histórico

Este repositório antes guardava o RPG de Telegram *Isekairpg*. Esse código continua
intacto na branch `main` e no histórico do git.
