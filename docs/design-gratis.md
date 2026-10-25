# Recursos grátis pra deixar o site bonito

Licenças conferidas nas páginas oficiais em 25/10/2026. Regra: preferir o que dá pra
**embutir no build** (fonte, ícone, SVG) em vez de carregar de serviço externo — o site
fica mais rápido e não manda dados do visitante pra terceiros (LGPD).

## Já em uso no site

| Recurso | Pra quê | Licença |
|---|---|---|
| [Fontsource](https://fontsource.org) — Inter + Bricolage Grotesque | Fontes embutidas (sem Google Fonts em tempo real) | OFL 1.1, uso comercial livre |
| [Lucide](https://lucide.dev) (`lucide-react`) | Ícones | ISC / MIT, sem atribuição |

## Ilustrações

| Site | Licença | Atribuição? |
|---|---|---|
| [unDraw](https://undraw.co) | Uso livre, comercial ou não; dá pra trocar a cor pela do site | Não |
| [ManyPixels](https://www.manypixels.co/gallery) | Mesma licença do unDraw | Não |
| [Open Peeps](https://openpeeps.com) | CC0 (domínio público) — pessoas desenhadas à mão | Não |
| [Storyset](https://storyset.com) | Grátis **com** crédito ao Freepik | **Sim** — evitar ou creditar |

## Ícones (alternativas)

[Heroicons](https://heroicons.com), [Tabler Icons](https://tabler.io/icons), [Iconoir](https://iconoir.com) — todos MIT.
Use um conjunto só no site inteiro pra manter o estilo coeso (hoje: Lucide).

## Fundos, formas e padrões

| Site | O que faz | Licença |
|---|---|---|
| [Haikei](https://haikei.app) | Gera SVG de ondas, manchas, camadas | Arquivos gerados são seus |
| [fffuel](https://www.fffuel.co) | Gradientes, texturas, padrões em SVG | Uso comercial sem atribuição; não pode revender os arquivos |
| [Hero Patterns](https://heropatterns.com) | Padrões repetíveis em SVG | CC BY 4.0 — **precisa de crédito** |

## Cores

[Coolors](https://coolors.co) (gerar paleta) e [Realtime Colors](https://realtimecolors.com)
(testar paleta num site de exemplo). A paleta atual está nas variáveis no topo de
`apps/site/app/globals.css` (claro e escuro).

## Fotos

[Unsplash](https://unsplash.com/license) e [Pexels](https://www.pexels.com/license/): uso comercial grátis,
sem atribuição obrigatória. Não pode usar foto com pessoa reconhecível pra sugerir que ela endossa o
produto. Baixe a foto, otimize e coloque em `apps/site/public/` (não linke direto do site deles).

## Componentes prontos

[shadcn/ui](https://ui.shadcn.com) e [daisyUI](https://daisyui.com) (MIT) são ótimos, mas dependem de
Tailwind CSS. O site usa CSS próprio; só vale migrar se o visual precisar crescer muito.

## Inspiração e componentes (avaliados em 25/10/2026)

| Site | O que é | Custo / licença | Serve pra nós? |
|---|---|---|---|
| [React Bits](https://reactbits.dev) | 217 componentes animados em React | Grátis, MIT + Commons Clause (pode usar no site, não pode revender o componente) | Sim, com moderação: escolher 1 efeito por página |
| [21st.dev](https://21st.dev) | Biblioteca de componentes e prompts | Grátis só 2 cópias/dia; ilimitado a partir de US$ 6/mês | Pra olhar ideias; o MCP "Magic" é pago |
| [Uiverse](https://uiverse.io) | Botões, cards, loaders em HTML/CSS puro | Grátis, MIT | Sim — copiar e colar CSS, sem dependência |
| [Motionsites](https://motionsites.ai) | Galeria de prompts de landing page | Parte paga | Só inspiração |
| [Seasats](https://www.seasats.com), [Alche](https://alche.studio), [Aether](https://aether.so) | Sites de empresas (vitrine de design) | — | Inspiração: tipografia grande, foto/vídeo forte, menu lateral criativo |
| Dora.run, Infinitepapers | — | Bloqueados pela rede da sessão / "em breve" | Não deu pra ver |

## Ferramentas pro Claude (do vídeo)

| Ferramenta | Veredito |
|---|---|
| **frontend-design** (Anthropic) | ✅ Instalada no projeto (`.claude/skills/frontend-design`, Apache 2.0) |
| **Web Interface Guidelines** (Vercel) | ✅ Instalada como `.claude/skills/diretrizes-interface` (lê a lista oficial, MIT) |
| **Chrome DevTools MCP** (Google) | Grátis, mas o Playwright que já está no `.mcp.json` faz o mesmo papel |
| **shadcn MCP** | Grátis, mas exige migrar o site pra Tailwind; só vale se adotarmos shadcn |
| **Magic MCP (21st.dev)** | ❌ Pago (créditos de IA) — fora da regra de custo zero |
