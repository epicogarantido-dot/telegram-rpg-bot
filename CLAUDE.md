# Aprenda Livre

Cursos gratuitos e **abertos** do mundo inteiro, traduzidos para o português do Brasil,
num site e num bot de WhatsApp. Tudo em TypeScript, monorepo com npm workspaces.

## Mapa

- `data/cursos/*.json` — o catálogo. Fonte da verdade; validado por `Curso` (zod).
- `packages/catalogo` — schema, carregamento e busca. Usado pelo site e pelo bot.
- `packages/ingestao` — coleta de fontes (`fontes/`), receitas (`receitas.ts`) e tradução com a API do Claude (`traduzir.ts`).
- `packages/prospeccao` — leads por nicho via Google Places API, SQLite em `data/privado/` (fora do git), mensagem de convite, opt-out.
- `packages/agenda` — SaaS das barbearias: temas (`temas.ts`), fotos do portfólio (`imagens.ts`: reprocessa, tira EXIF/GPS, WebP), equipe com foto, contas, assinatura (Pix estático `pix.ts`, acesso até `acesso_ate`, só o admin libera), serviços, profissionais, expediente, disponibilidade (`horariosLivres`, pura) e agendamentos. SQLite em `data/privado/agenda.db`; tudo filtrado por `barbearia_id`.
- `packages/membros` — contas dos alunos: login = WhatsApp + senha; número provado mandando código ao bot (`confirmarPeloWhatsapp`), limite de tentativas, progresso, exclusão (LGPD). SQLite em `data/privado/membros.db`.
- `apps/site` — Next.js (App Router) com DOIS sites em grupos de rota com layout raiz próprio: `app/(cursos)` (Aprenda Livre) e `app/(barbearias)` (site de cada barbearia `/b/<slug>`, `/b/<slug>/trabalhos`, `/b/<slug>/agendar`, e o painel `/app`, `/app/site`, `/app/fotos`). Visual dos temas: `app/(barbearias)/temas.css` (variáveis por `data-tema`, efeitos limitados por `data-efeitos`). Fotos servidas por `app/f/[nome]`. Imports com `@/` (raiz do app).
- Mesmo processo pros dois sites só por causa da memória do plano da Square Cloud; separar quando o plano crescer.
- Demo: `npm run semear:demo -w @aprenda/site` cria 6 barbearias (uma por tema) com fotos do Unsplash.
- **Produto x captação:** o SaaS vendido aos barbeiros é o site da barbearia + agenda + painel, e **não usa WhatsApp/bot** (risco de banimento). O site de cursos + bot é outra frente: captar leads de barbeiros e oferecer o SaaS.
- Agendar (`/b/<slug>/agendar`): 3 passos (serviço → dia e horário com "qualquer um" → nome e WhatsApp). Avisos no celular do barbeiro por Web Push (`lib/avisos.ts`, `public/painel-sw.js`, chaves VAPID no banco ou no `.env`); o aviso traz "Confirmar no WhatsApp", que abre o WhatsApp DO BARBEIRO com a mensagem pronta (quem envia é ele).
- `apps/site` (cursos) — Alunos: `/cadastro`, `/confirmar`, `/entrar`, `/esqueci`, `/minha-area`; bot chama `/api/whatsapp/codigo` com `BOT_SEGREDO`. Celular de demonstração em `componentes/DemoBarbearia.tsx`; botões de formulário usam `BotaoEnviar` (estado de carregando). `/app` (painel do barbeiro; bloqueado → `/app/assinatura`), `/b/<slug>` (cliente agenda), `/painel/assinaturas` (admin confirma Pix), `/painel/backup`. Cursos (estático), `/barbeiros` (captação opt-in), `/painel` (leads, protegido por `PAINEL_SENHA`).
- `apps/bot` — WhatsApp via Baileys (não oficial). `responder.ts` é a lógica pura; `index.ts` é só transporte.
- `docs/estilos/` — `plano.md` (plano dos 6 temas escolhidos, com nível de efeitos 1–5 que o tema deve respeitar) e Atlas de Estilos: 10 temas pros sites das barbearias, cada um a essência de uma sensação de luxo (marca só como referência).
- `docs/` — `seguranca.md`, licenças/fontes, riscos do WhatsApp e `estrategia.md` (funil e roadmap do SaaS).

## Comandos

```bash
npm test               # vitest em todos os pacotes
npm run typecheck
npm run build:site
npm run dev:site
npm run ingerir -- --listar | <slug> | --todos [--sem-traducao]
npm run bot
npm run prospectar -- buscar barbearia Campinas [--fonte osm|google] | listar | resumo
npm run pacote:square   # zip pronto pra Square Cloud (docs/deploy-square.md)
```

## Regras do projeto

- **Custo zero.** Nada que exija pagar ou cadastrar cartão (ver `docs/custo-zero.md`). Tradução: o Claude traduz na sessão, sem API paga. Leads: OpenStreetMap. Cobrança: Pix estático com confirmação manual.

- **Licença antes de tudo.** Nenhum curso entra sem licença aberta que permita tradução (ver `docs/licencas.md` e a skill `adicionar-fonte`). Grátis ≠ aberto.
- Toda página de curso mostra a atribuição (`fonte.atribuicao`). Não remova.
- Cursos CC BY-NC: nada de anúncio ou cobrança nessas páginas (`permiteUsoComercial`).
- O bot só responde; não implementar disparo em massa. Convites de prospecção saem do painel, enviados por uma pessoa, um a um, com limite diário.
- Todo convite identifica o remetente e oferece SAIR; opt-out é permanente (`bloqueados`).
- Dados de Maps só pela Places API oficial; nunca raspar o site do Google Maps.
- Nunca commitar `.env` nem `apps/bot/auth/`.
- Acesso vencido bloqueia o painel E a página pública; "já paguei" nunca libera sozinho — só `confirmarPagamento` (admin).
- Foto enviada nunca é servida como veio: sempre passa por `processarFoto` (valida, redimensiona, remove metadados).
- Toda consulta do SaaS recebe `barbeariaId` da sessão (`exigirBarbeiro`), nunca do formulário.
- O bot nunca envia mensagem primeiro, nem pra código de login: a pessoa manda o código pra ele.
- Visual: o dono prefere o estilo limpo (sem 3D/confete). Antes de mexer no design, use as skills `frontend-design` e `diretrizes-interface`; animação só em resposta a uma ação da pessoa e sempre respeitando `prefers-reduced-motion`. No site de cursos vale à risca; nos sites das barbearias cada tema segue o próprio nível de efeitos (`docs/estilos/plano.md`, efeitos em `temas.css` e `componentes/barbearia/Efeitos.tsx`), e com movimento reduzido o site fica parado e completo.
- Código e textos em português; identificadores também.
