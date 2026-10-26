---
name: escrever-materia
description: Escreve uma matéria da Revista do Aprenda Livre (notícia, episódio da série "Barbearias pelo mundo" ou guia) com pesquisa conferida em fonte primária. Use quando pedirem matéria, notícia, artigo, episódio, guia, "conteúdo pra revista" ou "seguir com as matérias".
---

# Escrever uma matéria da Revista

Leitor: **barbeiro brasileiro**, dono ou funcionário, lendo no celular no intervalo entre
clientes. Objetivo: ele aprende algo que usa amanhã e confia na gente (e um dia assina o SaaS).
A propaganda do SaaS entra sozinha no fim da página; o texto não vende nada.

## 1. Pauta

Pegue a próxima de `docs/pauta.md` (ou a pedida). Antes de escrever, responda em uma linha:
**"O barbeiro termina de ler e faz ___ diferente."** Se não tiver resposta, a pauta está fraca.

## 2. Pesquisa — fato só com fonte conferida

- Pesquise com WebSearch (`extended` pra coisa recente ou de nicho). Resultado de busca é
  pista, **não fonte**: abra a página primária com `curl -sL` (WebFetch não resolve DNS aqui).
- Fonte boa, em ordem: site oficial (empresa, governo: planalto.gov.br, gov.br/receitafederal),
  imprensa reconhecida, revista do setor (Modern Barber, BarberEVO, American Salon), Wikipedia
  só pra contexto (e confirmando o dado na referência dela).
- **Preço, data, número, nome, cargo, lei:** cada um conferido na fonte e anotado com o dia.
  Se duas fontes discordam, diga isso ou não use o dado.
- **Dado de fornecedor** (SQUIRE, Zenoti, Booksy, Trinks...) é dito como tal: "segundo a própria empresa".
- **Vídeo do YouTube:** confirme título e canal pelo oEmbed
  `curl -s "https://www.youtube.com/oembed?url=<url>&format=json"`; inscritos pela página do canal
  (`grep -oE '"[0-9.,]+ ?(mil|mi)? ?inscritos"'`), sempre com a data.
- **Não copie** texto nem imagem das fontes; escreva com suas palavras. Citação direta: curta,
  entre aspas, com a fonte. Vídeo e foto de terceiros só como link.
- Na dúvida sobre um fato, rode o agente `checador-fatos` na matéria pronta.

## 3. Texto

- Português do Brasil, conversa de balcão: "pra", "você", frases curtas, sem jargão de marketing.
- Abertura de 2–3 linhas que diz o que o leitor vai ganhar. Nada de "Neste artigo veremos".
- Subtítulos `###` a cada 3–5 parágrafos; listas onde há passos; tabela pra preço/comparação.
- `####` pra itens nomeados (canal, barbearia, serviço) seguido de uma linha em itálico com o dado.
- Valor em moeda de fora: mostre o original (£ 60, US$ 43) e, se ajudar, a ordem de grandeza
  em reais com a data do câmbio. Não invente conversão.
- **Série "Barbearias pelo mundo"**: história curta da casa → como é o atendimento passo a passo
  → quanto custa (tabela com fonte) → **"O que dá pra trazer pra sua barbearia"** (4–6 ideias que
  um barbeiro daqui aplica sem gastar muito) → gancho pro próximo episódio.
- **Notícia**: o que mudou → pra quem vale e a partir de quando → o que fazer agora → "combine
  com seu contador" quando for imposto/lei.
- **Guia**: o que é cada recurso → pra quem serve → como estudar/usar → link pro guia irmão.
- Links internos (`/revista/...`, `/cursos/...`, `/barbeiros#comunidade`) ajudam a navegar;
  o teste confere se existem.
- Tamanho: 500–1.200 palavras. Mais que isso, divida em dois.

## 4. Arquivo

`data/artigos/<slug>.json` (schema `Artigo` em `packages/catalogo/src/schema.ts`):

```json
{
  "slug": "japao-barbearia-ritual-e-rapidez",
  "titulo": "até 90 caracteres",
  "resumo": "até 220 caracteres; é o que aparece no carrossel e no WhatsApp",
  "tipo": "serie",
  "serie": { "nome": "Barbearias pelo mundo", "episodio": 2 },
  "publicadoEm": "AAAA-MM-DD (hoje)",
  "tags": ["barbearia", "..."],
  "conteudo": "Markdown",
  "fontes": [{ "titulo": "Nome — página", "url": "https://..." }]
}
```

`tipo: "serie"` anda junto com `serie`, e episódios não pulam número. Texto longo: gere o JSON
com um script Python em `packages/ingestao/manuais/` (evita erro de aspas) e rode-o.

## 5. Conferir antes de publicar

```bash
npm test -w @aprenda/catalogo                     # schema, links internos, séries, rascunhos
NODE_USE_ENV_PROXY=1 npm run conferir:links -- <slug>   # links externos respondem
npm run build:site
```

Abra a matéria no celular (390 px) e no computador e leia uma vez inteira. Marque a pauta
como publicada em `docs/pauta.md`.
