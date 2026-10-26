---
name: escrever-materia
description: Escreve uma matéria da Revista do Aprenda Livre (notícia, episódio da série "Barbearias pelo mundo" ou guia) com pesquisa conferida em fonte primária. Use quando pedirem matéria, notícia, artigo, episódio, guia, "conteúdo pra revista" ou "seguir com as matérias".
---

# Escrever uma matéria da Revista

Leitor: **barbeiro brasileiro**, dono ou funcionário, lendo no celular no intervalo entre
clientes. Objetivo: ele aprende algo que usa amanhã e confia na gente (e um dia assina o SaaS).
A propaganda do SaaS entra sozinha no fim da página; o texto não vende nada.

**Linha editorial** (detalhes em `docs/pauta.md`): nada de técnica de corte nem de divulgar
quem vende curso (até termos link de afiliado, sinalizado na matéria). Foco em atendimento,
gestão, dinheiro, divulgação, equipe, barbearias de outros países e **curiosidades**.

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
- **Guia**: o que é cada recurso → pra quem serve → como usar → link pro guia irmão.
- **Curiosidade** (`tipo: "curiosidade"`): o fato que surpreende logo na abertura → a história,
  com datas e fontes → "Como usar isso na sua barbearia" (conversa na cadeira, post, identidade).
  Quando historiadores discordam, mostre as versões em vez de escolher uma.
- Links internos (`/revista/...`, `/cursos/...`, `/barbeiros#comunidade`) ajudam a navegar;
  o teste confere se existem.
- Tamanho: 500–1.200 palavras. Mais que isso, divida em dois.

### Escrever bem (pedido do dono: as primeiras matérias pareciam lista de fatos)

- **Abra com uma cena ou um fato que surpreende**, não com um resumo. "Na St James's Street,
  um barbear custa £ 60 e a fila não acaba" puxa mais que "A Truefitt & Hill é a mais antiga".
- **Negrito com economia:** no máximo um por seção, só no que o leitor tem que lembrar.
  Texto todo em negrito é texto sem destaque.
- **Fonte no ponto certo, uma vez.** "Segundo a CNN..." na primeira menção basta; o resto do
  crédito fica na lista de fontes do fim. Nada de "segundo X" em toda frase.
- **Parágrafo de 2 a 4 frases, com ligação entre eles.** Lista só pra passos ou itens paralelos;
  o resto é texto corrido, que lê melhor no celular do que bala atrás de bala.
- **Comente o fato.** Depois do dado, uma frase que diz o que ele significa ("Repare quantas
  vezes o cliente escolhe alguma coisa").
- **As ideias pra barbearia são concretas:** o que fazer amanhã, quanto custa, e quando der,
  uma conta em reais marcada como exemplo ("conta de exemplo: corte a R$ 40...").
- **Feche com uma frase que amarra**, não com resumo. Depois, o gancho do próximo episódio.
- Sem clichê ("no mundo de hoje", "não é mesmo?", "confira") e sem exclamação em excesso.

### Foto (obrigatória)

Toda matéria tem `imagem`, e o teste falha sem ela. Só licença que deixa usar em site com venda
e modificar (CC0, domínio público, CC BY, CC BY-SA), com crédito visível:

```bash
cd apps/site
NODE_USE_ENV_PROXY=1 node scripts/foto-materia.mjs buscar "barber pole" /caminho/folha.png  # olhe a folha numerada
NODE_USE_ENV_PROXY=1 node scripts/foto-materia.mjs <slug> <id> [top|bottom|attention]       # grava public/revista/<slug>.webp
```

Cole o bloco impresso no JSON e escreva o `alt` (o que a foto mostra, pra quem não vê). Confira
a tag/título da foto: "Havana barber" pode ser de Miami. Foto de outro lugar que não o da
matéria só se o `alt` disser isso.

## 4. Arquivo

`data/artigos/<slug>.json` (schema `Artigo` em `packages/catalogo/src/schema.ts`):

```json
{
  "slug": "japao-barbearia-ritual-e-rapidez",
  "titulo": "até 90 caracteres",
  "resumo": "até 220 caracteres; é o que aparece no carrossel e no WhatsApp",
  "tipo": "serie | noticia | guia | curiosidade",
  "serie": { "nome": "Barbearias pelo mundo", "episodio": 2 },
  "publicadoEm": "AAAA-MM-DD (hoje)",
  "tags": ["barbearia", "..."],
  "conteudo": "Markdown",
  "fontes": [{ "titulo": "Nome — página", "url": "https://..." }],
  "imagem": { "arquivo": "/revista/<slug>.webp", "alt": "...", "credito": "...", "licenca": "CC BY 2.0", "fonte": "https://..." }
}
```

`tipo: "serie"` anda junto com `serie`, e episódios não pulam número. Escreva a matéria em
`packages/ingestao/manuais/revista/` (`serie.py`, `curiosidades.py` ou `mercado.py`; foto em
`imagens.json`) e gere os JSON com `python3 packages/ingestao/manuais/revista/gerar.py`.

## 5. Conferir antes de publicar

```bash
npm test -w @aprenda/catalogo                     # schema, links internos, séries, rascunhos
NODE_USE_ENV_PROXY=1 npm run conferir:links -- <slug>   # links externos respondem
npm run build:site
```

Abra a matéria no celular (390 px) e no computador e leia uma vez inteira. Marque a pauta
como publicada em `docs/pauta.md`.
