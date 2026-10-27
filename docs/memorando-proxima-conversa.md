# Memorando pra próxima conversa (27/10/2026)

**Pro próximo chat:** o dono do projeto vai recomeçar com você. Na avaliação dele, **nós falhamos**:
o que está abaixo era pra estar pronto e funcionando, e não está do jeito que ele esperava. Sua
tarefa é:

1. **Analisar o que realmente existe** (código na branch `ccr-8c6e8ed7-26crva`, o que está no ar
   em https://barbearias777.squareweb.app e o que os zips de `npm run pacote:square` entregam).
   Não confie neste memorando nem no `CLAUDE.md` como prova de que algo funciona: eles dizem o que
   foi *feito*, não o que foi *conferido no ar*.
2. **Comparar com o que era pra termos** (lista abaixo) e escrever, pro dono, a lista do que falta,
   do que está quebrado e do que nunca foi testado de verdade.
3. **Arrumar o que deve ter sido a nossa falha**, começando pelo que impede vender.
   Pergunte ao dono o que ele viu dar errado antes de sair mexendo: ele sabe onde doeu.

Regras do projeto: leia o `CLAUDE.md` (custo zero, sem bot, Pix manual, travas, LGPD, textos em
português). Commit e push na branch `ccr-8c6e8ed7-26crva`, sem PR.

---

## O que era pra termos

### O negócio
- O dono vende pra barbeiros um **site da barbearia + agenda online + painel** (o SaaS), por Pix
  (contratação R$ 100, depois R$ 50 a cada 30 dias, valores no `.env`).
- O **site de leads** (cursos grátis + Revista) é o funil: primeiro contato manual pelo WhatsApp
  (feito pelo dono, sem bot) → grupo de barbeiros → site → "Quero meu site".
- O dono cuida do WhatsApp dos leads pessoalmente. **Nada de bot** (foi removido).

### Site de leads (app `barbearias777`)
- Página inicial pro barbeiro, carrossel de cursos, carrossel dos 6 estilos (abrindo um site de
  exemplo no ar), Revista com 28 matérias, `/barbeiros` (página de venda), privacidade e termos.
- Painel de leads (`/painel`): busca de barbearias (Receita/OSM, busca assistida), mensagens de
  convite uma a uma com SAIR, demonstração pro lead, cartão com QR, `/painel/divulgacao` (posts
  prontos pro grupo e contagem de visitas/cadastros por origem).
- Visual: tema "Cerimônia" (escuro, ameixa, Jost).

### Fluxo de venda
1. "Quero meu site" → `/montar`: nome, cidade e estilo, sem cadastro.
2. Abre a **prévia** do site com o nome dele e fotos de exemplo; dá pra trocar o estilo.
3. "Quero este site" → cadastro (etapas Seu site → Cadastro → Pagamento).
4. Pagamento: Pix (QR + copia e cola) e envio do comprovante.
5. Tela **"Pedido recebido!"**: a equipe chama no WhatsApp e monta o site de verdade com as fotos e
   preços dele. O barbeiro **não edita nada** antes de pagar (painel fechado).
6. O dono confere em `/painel/assinaturas` (vê o comprovante), clica "Confirmar e liberar" → o site
   vai pro ar e o barbeiro recebe aviso no celular (se ligou os avisos).

### SaaS (site das barbearias)
- Site de cada barbearia `/b/<nome>` em 6 estilos (`docs/estilos/plano.md`), com capa, trabalhos
  por categoria (inclui Sobrancelha), equipe, serviços e preços, mapa, WhatsApp.
- Agendamento com adicionais (barba, sobrancelha), "qualquer profissional", travas anti-trote,
  link do cliente pra remarcar/cancelar, `.ics`.
- Painel do barbeiro `/app`: agenda do dia, bloquear horário, fechar hoje, fila, fotos por espaço
  (com acervo de fotos padrão), serviços com tempo próprio, folga entre clientes, equipe, horários,
  números do mês, clientes sumidos, planos mensais, pedido de avaliação, calendário no celular,
  avisos por Web Push, troca de senha.
- Banco de 29 fotos de exemplo (`data/demo-fotos`) e 6 sites de exemplo criados por botão.

### Dois apps
- Pedido final do dono: **o site que ele vende num app separado** do site de leads.
- Feito com um código só: `MODO_SITE=leads|saas` + `apps/site/proxy.ts` + `lib/modo.ts`.
  Zips: `dist/leads-commit.zip` (atualiza `barbearias777`) e `dist/saas-square.zip` (app novo).
  Variáveis: `.env.saas.example` (SaaS) e `.env.example` (leads, com `SAAS_URL`).

---

## O que sabemos que NÃO foi conferido no ar (comece por aqui)

- Na última checagem, o servidor `barbearias777` ainda rodava a versão **5a54797**, duas versões
  antes do fim. Nada das últimas entregas (compra em 3 etapas, painel fechado, matérias novas,
  dois apps) foi visto funcionando no servidor de verdade.
- Os **6 sites de exemplo nunca foram criados no servidor** (o carrossel da home não tinha links).
- O **app SaaS separado nunca subiu na Square**: só foi testado aqui, com dois servidores locais.
  Não sabemos se o plano da Square comporta dois apps de 512 MB, nem se o subdomínio
  `sitedabarbearia` está livre.
- **Avisos no celular** (Web Push) nunca foram testados num celular real.
- **Pix:** o QR e o copia e cola nunca foram pagos de verdade com as chaves reais do dono.
- **Demonstração pedida pelo painel de leads ao app SaaS** (`/api/demonstracao`) foi testada só
  chamando a API, não clicando no painel de leads.
- Tudo foi testado com Playwright em banco zerado, não com uso real (celular, 4G, iPhone).

## Pontos que podem ser a causa de "não funcionou"
- **Commit na Square:** o dono sobe o zip por Commit e reinicia. Já houve página velha presa no
  cache do Next; o `iniciar.cjs` apaga `apps/site/.next/server/route-cache` ao iniciar. Confira
  `/api/versao` depois de cada subida.
- **Variáveis do `.env`:** nomes certos são `PLANO_VALOR` e `PLANO_ADESAO` (em reais),
  `PAINEL_SENHA` igual nos dois apps, `SAAS_URL` no de leads, `LEADS_URL` e `SITE_URL` no SaaS.
  Sem `SAAS_URL`, o app de leads serve tudo sozinho.
- **Páginas estáticas** (home, `/barbeiros`, Revista) são geradas no build: o que depende de
  variável do servidor não aparece nelas até revalidar.
- **Openverse** (fotos das matérias) e **Wikimedia** estavam fora do ar ou bloqueando nesta sessão;
  as 5 últimas matérias usaram fotos CC0 do StockSnap que já estavam no banco.
- O dono mudou de ideia algumas vezes no fluxo de venda (editar antes de pagar → não editar). Os
  textos foram ajustados, mas vale reler o fluxo inteiro como barbeiro.

## Onde está cada coisa
- Código: `apps/site` (Next 16), `packages/agenda` (SaaS), `packages/prospeccao` (leads),
  `packages/catalogo` (cursos/Revista). Mapa completo no `CLAUDE.md`.
- Deploy: `docs/deploy-square.md`. Abordagem de venda: `docs/abordagem.md`. Pauta: `docs/pauta.md`.
- Testes: `npm test`, `npm run typecheck`, `npm run build:site`, `npm run pacote:square`.
