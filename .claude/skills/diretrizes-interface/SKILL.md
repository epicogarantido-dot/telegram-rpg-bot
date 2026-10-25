---
name: diretrizes-interface
description: Revisa telas do site contra as Web Interface Guidelines da Vercel (teclado, foco, formulários, carregamento, animação, acessibilidade, mobile) antes de publicar. Use quando pedirem revisão de UX, "conferir o site", polimento, ou antes de gerar o pacote da Square Cloud.
---

# Diretrizes de interface (Vercel)

Fonte: [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) (licença MIT).
A lista muda com o tempo, então leia a versão atual em vez de confiar na memória:

```bash
curl -sSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/README.md
```

## Como revisar

1. Leia a lista inteira.
2. Escolha as telas tocadas pela mudança (ou as principais: `/`, `/cadastro`, `/entrar`,
   `/confirmar`, `/minha-area`, uma lição, `/barbeiros`).
3. Confira no código **e** no navegador (Playwright: celular 390px e desktop, claro e escuro).
4. Devolva só o que está em desacordo: `tela — regra — o que corrigir`. Corrija os itens
   simples direto; os de design, proponha antes.

Pontos que mais pegam neste projeto: botões de formulário mostram estado de carregando
(`componentes/BotaoEnviar.tsx`), inputs com fonte ≥ 16px no celular, alvo de toque ≥ 44px,
`prefers-reduced-motion`, mensagens de erro que dizem como resolver, links são `<a>`.
