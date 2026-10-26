---
name: escrever-curso
description: Escreve um curso próprio do Aprenda Livre (autoria "propria") pra barbeiros — gestão, atendimento, finanças, marketing, liderança — quando não há material aberto pra traduzir. Use quando pedirem "escrever curso", "criar curso", "curso sobre X" e a skill adicionar-fonte não achar fonte aberta.
---

# Escrever um curso próprio

Primeiro tente traduzir (skill `adicionar-fonte`): material aberto e bom já existe pra muita
coisa. Escreva do zero só quando não houver, ou quando o tema é do Brasil (MEI, Pix, leis).

## 1. Desenho do curso (antes de qualquer lição)

Escreva em 5 linhas e mostre ao dono se o curso for grande:
- **Pra quem:** (ex.: barbeiro que trabalha sozinho e não sabe quanto lucra)
- **No fim ele consegue:** 3 coisas observáveis ("montar um orçamento do mês", não "entender finanças")
- **Módulos:** 2–4, cada um com 1–3 lições. Curso inteiro: 4–8 lições.
- **O que NÃO entra:** pra não virar livro.
- **Fatos a conferir:** valores, leis, prazos (lista pra pesquisa).

## 2. Cada lição (5–8 minutos de leitura no celular)

Estrutura fixa, que o aluno aprende a reconhecer:

1. **Abertura**: o problema do dia a dia em 2–3 linhas, com cena de barbearia.
2. **A ideia**: o conceito explicado simples, com um exemplo de barbearia.
3. **Como fazer**: passos numerados.
4. **Na prática**: tabela, conta ou roteiro com valores de exemplo (marcados *Valores de exemplo.*).
5. **Para pensar**: 2 perguntas sobre a barbearia DELE.

Regras:
- Português do Brasil simples ("pra", "você"); frase curta; sem jargão ou explique na hora.
- Exemplos sempre do mundo da barbearia (corte, barba, cadeira, comissão, Pix, fila de sábado).
- Lei, imposto, valor oficial: fonte oficial conferida e data ("conferido em outubro de 2026");
  feche com "combine com seu contador" quando a decisão depende do caso.
- Nada de promessa de ganho ("dobre seu faturamento"). Nada de recomendar produto financeiro
  específico; explique o tipo (Tesouro Selic, CDB com FGC) e os riscos.
- Uma lição não depende de link externo pra fazer sentido.

## 3. Arquivo

Cursos próprios são gerados por script, como `packages/ingestao/manuais/cursos-proprios.py`
(acrescente o curso lá ou crie um script irmão). Campos que mudam em relação à tradução:
`"autoria": "propria"`, `"traducao": "original"`, `"idiomaOriginal": "pt"`, `fonte.nome:
"Aprenda Livre"`, licença `CC-BY-4.0`, sem `fonte.url`. `tags` com `"barbearia"` faz o curso
aparecer em `/barbeiros`. `area` vira ícone e filtro (veja `componentes/cursos.tsx`; área nova
precisa de ícone lá).

## 4. Conferir

```bash
python3 packages/ingestao/manuais/<script>.py data/cursos
npm test -w @aprenda/catalogo
NODE_USE_ENV_PROXY=1 npm run conferir:links -- <slug>
npm run build:site
```

Leia uma lição inteira no celular. Rode o agente `checador-fatos` no curso se tiver número ou lei.
Atualize `docs/pauta.md`.
