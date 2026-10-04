# Isekairpg — estado do projeto

> Cole este arquivo no início do novo chat, junto com o zip mais recente.

---

## O cenário

O jogador é **usuário de aura** e recebe muito ouro do Império pra ficar
forte. Dentro da Torre vive gente que **não usa aura**: nasceu ali, ou foi
mandada pra lá e não tem como voltar — só quem usa aura desce. São essas
pessoas, e os nativos, que viram os **aldeões do clã**: o jogador as encontra
explorando, e daí funda uma aldeia, ou acha um clã já formado e domina.

Outro **usuário de aura** aparece raramente explorando (peso 1 contra
dezenas). É assim que se ganha personagem novo — achando, não criando.

## O que é, hoje

RPG de texto em **site próprio**. O bot do Telegram foi **removido em 20/09**
(`core/router.py`, `core/keyboards.py`, `game/views.py` e ~1.100 linhas do
`main.py` apagados; `aiogram` saiu do requirements). O `main.py` agora só
prepara o banco e serve a API.

Em cima disso está sendo construído um jogo novo de **3 pilares**:

1. **Storylets** — narrativa por qualidades (King of Dragon Pass / Six Ages /
   Reigns / Fallen London). Motor pronto, com auditor.
2. **Torre** — o jogo de combate que já existia, e que agora também é o mapa.
3. **Idle / clã** — o clã trabalha enquanto você não está, e você resolve as
   situações ao voltar. Motor pronto, jogável, faltando conteúdo.

### Stack

```
main.py                    prepara o banco e serve o site (uvicorn) — só isso
game/                      regras compartilhadas
  logic.py                 motor de combate, stats, loja, morte (~6.500)
  storylets.py             motor de storylets + saga
  storylets_auditor.py     auditor de alcançabilidade
  clan_repo.py             tabelas do clã + tick do AFK + ração/fome
  clan_afk.py              perfil de risco pré-calculado
  clan_risco.py            curva de risco (incidente x morte)
  clan_materiais.py        ranks de material e necessidades do clã
  clan_aldeia.py           bronze, prata e serviços
  clan_fundacao.py         mito de fundação e humor do clã
  clan_habitantes.py       habitantes: profissão, potencial, fadiga, aura (puro)
  territorio.py            mapa compartilhado: pontos, bots, conquista (puro)
  clan_jornada.py          travessia do clã pro próximo andar, lutando (puro)
  clan_postos.py           postos por andar, achados explorando (puro)
  clan_equipes.py          talentos, equipes com guarda, manutenção e greve (puro)
  clan_ferreiro.py         ferramentas e equipamento dos NPCs, em lote (puro)
  clan_batalha.py          batalha pelo ponto entre jogadores (puro)
  clan_explorar.py         explorar o andar: 5 achados, emboscada, saque de cidade (puro)
  characters.py            5 slots, armário e mercado de personagens
  pet_skills.py            4 opções de batalha por pet (arquétipo x raridade)
  tutoriais.py             13 tutoriais (fora do views.py de propósito)
  conteudo/storylets/*.json   31 storylets
webapp/
  api.py                   147 rotas
  contas.py                autenticação do site (PBKDF2 + Bearer)
  comprovantes.py          Pix por upload + painel de admin
  avisos.py                caixa de avisos dentro do jogo
  imagens.py               espelho local das artes + miniaturas
  catalogo_imagens.py      o que tem e o que falta de arte, por tipo (/admin)
  static/                  app.js (~5.900), style.css (~1.550), admin.html
testes/                    suíte — ver testes/LEIA-ME.md
data/                      SQLite, imagens, comprovantes — NUNCA no zip
```

### Variáveis de ambiente

| Variável | Precisa? | Pra quê |
|---|---|---|
| `BOT_TOKEN` | só pro bot | Sem ela o jogo sobe em **modo só site** (desde 20/09) — sem polling e sem espelho de imagens |
| `WEBAPP_URL` | sim | URL pública; faz o botão do Mini App aparecer no bot |
| `ADMIN_SENHA` | **sim** | Liga o painel `/admin`. Sem ela o painel fica DESLIGADO |
| `SOMENTE_SITE` | ainda não | `1` = para de aceitar entrada pelo Telegram |
| `WEBAPP_PORT` | não | Padrão 8080 |

---

## O que já está pronto

### Migração pro site
- Autenticação própria (PBKDF2 + `Authorization: Bearer`), com `initData` do
  Telegram convivendo até o `SOMENTE_SITE` ser ligado
- Contas do site usam `telegram_id` **negativo** (IDs do Telegram são sempre
  positivos, então não colide e o schema não muda)
- `/vincular` no bot dá um código de 6 caracteres pra levar o personagem
- Imagens espelhadas do Telegram pro disco, automático no boot
- Pix por upload no site + painel de admin em `/admin`
- Caixa de avisos dentro do jogo
- PWA (manifest, ícone, service worker que nunca guarda resposta de API)

### Jogo
- Criação de personagem (classe e raça) em carrossel
- Trilhas, engaste de gemas, hospital, tutorial, histórico de combate
- Poção e Autobatalha usáveis (eram **vendidas e inutilizáveis**)
- Recompensa diária, resgatar todas as missões
- Aprender skill de core, re-rolar afixo, fundir montaria, fugir da raid
- Personagens da conta (5 slots, armário, mercado) no site
- Portão da cidade: sair da Torre custa 100g, serviços da cidade exigem estar
  nela

### Clã / idle
- Mito de fundação (3 perguntas, 27 combinações, flags permanentes)
- Humor do clã em 5 faixas — muda quais eventos aparecem
- Conselho: membros opinam com viés, e **a perícia de quem executa é testada**
- Saga: o log de causa vira história legível
- Perfil de risco pré-calculado por (membro, área)
- Materiais em 5 ranks, equipamento, 6 comodidades
- Bronze e prata com fonte e ralo
- Distribuição automática de equipamento (melhor peça pro melhor guerreiro)

### Interface
- Barra de 5 grupos; caminhos irmãos em grade no fim de cada página
- Praça da Cidade com arte real; jogador representado pela arte de STATUS
- Piso de qualidade: zoom liberado, `focus-visible`, `prefers-reduced-motion`,
  `tabular-nums`, inputs em 16px, toque de 44px
- Imagens no tamanho certo (`?w=`), `loading="lazy"`, Pillow opcional
- **Versão de cache automática** (hash do conteúdo) — ver armadilhas

---

## O que falta

### ✅ Migração terminada (20/09) — o que era a lista abaixo
Imagens já no servidor, `/vincular` dispensado (só o dev joga), bot removido.
Ficaram DORMENTES (sem uso, dá pra apagar numa limpeza): `webapp/auth.py`
(validação do initData do Telegram), `set_bot_instance`/`_bot_instance` em
`api.py`, e o código de exportar imagem do Telegram em `webapp/imagens.py`.
Também eram código morto antigo: `infra/db.py` e `infra/repo.py`.
**Tudo isso foi apagado em 20/09** (login do Mini App, `webapp/auth.py`,
instância do bot, download de arte pelo Telegram, exportação/espelho,
cartão do espelho no /admin, vibração/alerta do cliente no app.js,
`testar_telegram.js`). `game/assets.py` segue com os `file_id` antigos só
como DADO (quais chaves têm arte); a arte de verdade está em disco.

### (histórico) Pra terminar a migração
1. Commit e conferir `/admin` → aba Imagens → **235/235**
2. `/vincular` no bot pra levar o personagem
3. Ligar `SOMENTE_SITE=1`
4. **Só então** encolher `router.py` e `views.py` pro que sobra
5. ~~`main.py` exige `BOT_TOKEN`~~ **feito em 20/09**: sem token o processo
   sobe em modo só site e avisa quantas imagens ainda não foram espelhadas
   (sem o bot elas não podem mais ser baixadas). `testar_modo_so_site.py`.

### No clã
- ~~**Fome não consome nada.**~~ **Fechado em 17/09.** Quem está em posto
  come 1 a cada 4 ticks (6 por sessão cheia); a comida tem teto e o que
  passa apodrece; fome e ferimento entram como atributo a menos no perfil
  de combate. Ver `auditar_fome.py`.
  - A faixa rasa agora tem **três andares** (1, 3 e 5) em vez de um: o
    passo de `areas_disponiveis` virou 2 em 2 até o andar 10. Postar no
    Andar 5 rende ~85 de comida por sessão contra 24 de antes, e os
    andares 7 e 9 seguram o material rank 1, que o passo de 5 quase tirou
    do jogo. O teto de comida virou 60 por membro (mínimo 180) e o
    Celeiro **dobra** — 300 e 600 num clã de 5.
- ~~**`ferimento` é gerado e nunca gravado.**~~ **Fechado em 20/09**: o
  RECUA fere o mais fraco do grupo (mesma regra de quem cai) e o curandeiro
  da aldeia trata 1 ponto por sessão. `testar_aldeia.py` força o RECUA e
  confere no disco. Texto antigo, pra registro: `clan_afk.rodar_tick` devolve
  `evento["ferimento"] = 1` no RECUA e `rodar_afk` simplesmente não lê. É o
  mesmo bug da fome, no campo vizinho. A cura já existe e funciona (o
  `curandeiro` da aldeia, 40🥉, `cura_todos`), então gravar não cria beco
  sem saída — `penalizar_modelo` já desconta ferimento, só falta alguém
  escrever no campo.
- ~~**Situações guardadas** não consumidas uma a uma~~ **Fechado em 20/09**:
  a fila era um contador disfarçado, e o ponteiro do storylet era o MESMO do
  encontro da Torre (encontro pendente aparecia nas Decisões do clã; abrir
  as Decisões apagava o encontro; o sorteio do clã rodava sem contexto e
  podia puxar encontro da Torre; situação sem storylet travava a fila).
  Hoje cada situação guarda o próprio `sid` (`clan_repo.situacao_da_vez`),
  o sorteio é só do clã, o ponteiro da Torre é devolvido intacto, e a tela
  mostra de onde a situação veio (área + motivo). `testar_fila_situacoes.py`.
- **Zonas disputadas / PvP por território** — o botão "atacar ou não" é um
  storylet, o motor já faz. Falta a camada de mapa e os clãs de NPC.
- **Duas ações por estação** (Six Ages) — precisa decidir o que é "estação"
  aqui: sessão? dia real? tick?

### Arte (achado de 20/09, pelo catálogo novo do /admin)
- ~~24 artes gravadas com acento que o jogo pedia sem acento~~ e ~~38 chaves
  que `chave_valida` recusava~~ — **fechado em 20/09** por
  `assets.normalizar_chave`, que agora limpa a chave dos DOIS lados (quem
  pede e quem grava, inclusive `save_asset` e o cache em disco). Medido:
  334 → 310 chaves pedidas, 79 → **55 faltando**, 38 → **0 inválidas**;
  monstros caíram de 57 pra 33 faltando sem desenhar nada
- **15 montarias ainda sem arte nenhuma** — `explore.py` pede `MOUNT_{id}` e
  não existe um único `MOUNT_` no `assets.py`; toda montaria mostra a Cidade
- Sobram 4 telas e 33 monstros sem arte própria. Ver
  `testes/auditar_catalogo_imagens.py`

### 🏘️ Aldeia viva (20/09, a partir do documento de Clã e Aldeia do dev)
Feito: **habitantes** que não usam aura (`game/clan_habitantes.py`, puro, e
`clan_habitante` em `TABELAS`) — nome, 6 profissões (agricultor, lenhador,
caçador, minerador, curandeiro, guarda), nível com teto no **potencial ★**
(★1 para no 4, ★5 vai ao 20), **especialização** no Nv.10 (Minerador →
Geólogo), **fadiga** Descansado/Cansado/Exausto com descanso como porta de
saída, **despertar de Aura** (raro no dia a dia, 1 em 3 nas crises), **ataque
à aldeia** com defesa de guardas + aura + estágio, **estágios** Acampamento →
Capital do Clã (derivados, não gravados), **acolher** (custa comida),
chegada espontânea, **Memórias do Clã** e **Memorial**. Tudo roda dentro de
`rodar_afk`, come da mesma comida e entra no diário.
Medido (`auditar_aldeia.py`): agricultor Nv1 rende ~23/sessão (lutador no
Andar 5 rende ~85 — a aldeia não substitui o posto); rodízio rende 42% mais
que trabalhar sem parar; na crise, alguém desperta 34% das vezes.
Segunda leva (20/09): **chefes** por cargo (bônus = 1% por nível do chefe;
Capitão na defesa; Mestre da Aura dobra o despertar calmo), **identidade da
aldeia** (5 especializações, 1 vaga na Vila e 2 na Cidade, trocar custa
60🥉), **família** (30% de quem chega é parente; luto derruba o trabalho;
quem vê o parente em perigo desperta 2×) e **automação** (descanso
automático, tick a tick). Medido: regra automática 105 de madeira em 12
sessões contra 94 do rodízio à mão e 66 sem descanso.
🗺️ **Território (20/09)** — `game/territorio.py` (puro) + tabela GLOBAL
`territorio` (70 linhas, semeadas uma vez com semente fixa — o mundo é o
mesmo pra todos). 6 tipos (mina, floresta, cristais, caça, ruínas,
nascente) × 10 tiers + 10 locais seguros. Regras: **um ponto por vez**
(`clan.ponto_id`; tomar outro larga o anterior, que fica sem dono);
**locais seguros** não são atacados nem tomados e aceitam vários clãs;
todo ponto disputado pode ser tomado por **jogador** (força do clã dele
medida na hora) ou **bot** (8 clãs de NPC donos de 75% do mapa no começo).
**Perda gradual**: integridade 0–100, produção proporcional, recupera entre
ataques, só perde em 0 (média de 12 sessões pra um clã fraco no tier 8).
Medido: clã comum (força 75) toma o tier 1 com 96% e o tier 10 com 16%.
Do documento: **tudo feito**. As relíquias entraram em 20/09 (abaixo).
Migração de andar: feita em 20/09 (Travessia). Postos avançados/logística: feitos e
retirados no mesmo dia — o clã só trabalha no andar onde está.

### 🥇 Ouro único, material na forja, comida comprada (20/09)
- **Só ouro.** Mina e Ruínas do mapa rendem **material** (rank = tier do
  ponto, `territorio.rank_do_tier`), Cristais rende ouro, o minerador da
  aldeia rende material rank 1, o achado raro do AFK rende ouro. Serviços
  da aldeia custam ouro; "vender material" e "trocar bronze por prata"
  saíram. Colunas `bronze`/`prata` ficam no banco velho sem uso (nada lê;
  não precisa migração pra remover).
- **Forja pede material** (`items.REQ_MATERIAL_CRAFT`): o RANK acompanha a
  raridade (lendário = rank 5, Primordial). Piso: 25/40/60/80 do comum ao
  épico e **10 no lendário** (só 20% de chance — o dev baixou pra o
  material não falhar junto). **+1 por tier acima do 1 em cada core**
  (`MATERIAL_POR_TIER`, conta única em `craft.custo_material`): lendário
  com 8 cores Tier 5 = 42. Gasta a **mochila** do personagem primeiro (`p["materiais_torre"]`,
  em `CAMPOS_EXTRAS`) e depois o estoque do clã. Falta material → nada é
  cobrado. Monstro da Torre deixa material do rank do andar: comum 35%
  (1), elite 2, boss 5.
- **Comida a ouro** na Aldeia (1g/unidade, só se paga o que coube no
  celeiro) e **compra automática** (`regras.compra_comida_auto`): só age
  quando a sessão termina com gente faminta, até `limite_ouro_comida` (300g
  padrão) por sessão. Aparece no diário.
- **Achados de brinde:** (1) os storylets davam "+120 de bronze"/"+20 de
  comida" que NUNCA chegavam — eram qualidade abstrata sobrescrita a cada
  abertura. Agora `_aplicar_recursos_reais` entrega ouro e comida de
  verdade (decisões e fundação). (2) "Reparar o arsenal" e "Contratar mão
  de obra" cobravam moeda por efeitos que nada lia; saíram — decidir se
  voltam com mecanismo de verdade. (3) O diário nunca mostrava madeira e
  couro ganhos (o front lia campos que a rota não mandava).

### 👹 Covis do Chefe (20/09)
Os andares 5, 10, 15... já eram só de chefe na Torre (`get_bosses_no_andar`).
No mapa, cada um virou um **Covil** (tipo `covil`, 10 pontos, andar 5 a 50):
rende material do rank do andar em volume de chefe — 30/sessão no tier 1
(a mina rende 5) até ~97 de Primordial no tier 10 — e por isso é o ponto
mais guardado (×1,5) e mais atacado (+10%). É onde os clãs vão disputar
material de AFK. `garantir_mapa` agora semeia o que FALTA por (tipo, nome):
banco que já tinha os 70 pontos ganha os covis sem perder conquistas.

### 🧭 Travessia do clã (20/09 — 2ª versão, a pedido do dev)
A 1ª "jornada" (cada perigo = um sorteio, qualquer andar de 5 a 50) foi
achada irreal. Agora (`game/clan_jornada.py`, puro; tela Clã → Travessia):
- **Só pro andar SEGUINTE ao do clã** (`clan.andar`, começa em 1), e só se
  o jogador já chegou nele na Torre (`p["andar_max"]`, em CAMPOS_EXTRAS).
  Chegar muda o andar do clã.
- **Batalha atrás de batalha contra o relógio**: a travessia dura 16–26
  turnos; cada batalha tem 6 turnos pra ser vencida — senão chega REFORÇO,
  e cada estouro seguido traz mais (1, depois 2, depois 3). Chegar =
  terminar o tempo com alguém de pé. Andar de chefe: o chefe entra aos 60%
  do tempo e bloqueia a saída até cair.
- Decisões: tática (⚖️/⚔️/🛡️), comer no meio da luta (reserva da carroça),
  recuar (metade do espólio). Espólio = material por monstro abatido
  (`material_do_monstro`) + ouro.
- **Lutadores** = o modelo do AFK (`_modelo_de_combate` + `logic.recalc`);
  **regras de golpe** = as da Torre (acerto 100+prec−esq, dano atk−def,
  crítico ×1,5). **Monstros** = nome/raça/tipo do gerador da Torre, mas com
  números na régua do clã (`stats_do_inimigo`, referência: lutador nível
  2×andar, a mesma da fronteira do AFK). Medido com os números crus: do
  andar 20 em diante nenhuma batalha terminava (a defesa e a esquiva da
  Torre crescem mais rápido que o modelo do clã) — o clã só sobrevivia ao
  relógio, o oposto do pedido.
Medido (`auditar_jornada.py`): grupo no ponto atravessa ~100% vencendo 2–6
batalhas; na metade do ponto, 0% do andar 10 em diante.
- **O clã só trabalha até o andar onde está** (decisão do dev, 20/09):
  `clan_repo.andar_de_trabalho` = menor entre `tower_floor` e `clan.andar`;
  as TRÊS rotas que ofereciam áreas passam por `areas_do_cla` (uma regra,
  um lugar). Lutador num posto fora do alcance volta pra casa com aviso
  (`recolher_fora_do_alcance`) — antes, `rodar_afk` pulava o posto em
  silêncio e o lutador "trabalhava" sem produzir. O posto novo também é
  recusado se o clã não alcança o andar.

### 🔎 Postos achados explorando (20/09)
`game/clan_postos.py` (puro) + `clan.postos` (JSON). As áreas do AFK deixaram
de ser "um posto pronto por andar": agora são os postos que o clã ACHOU.
- A lista depende do andar: Clareira/Nascente (comida) desde o 1, Bosque
  (madeira) 2+, Trilha de Caça (couro) 4+, Veio (metal) 6+, Veio Profundo
  (metal ×1,6) 12+. Um de cada tipo por andar.
- Explorar um andar alcançado custa `4 + andar/2` de comida; acha em ~60%,
  o TIPO é sorteado pelo peso (raro sai menos) e a ★ também (★3 = 15%).
  Medido: achar um Veio específico no Andar 9 leva ~9 buscas (~70 de comida).
- Clã novo ganha a Clareira do Andar 1 (sem ela não teria onde trabalhar nem
  comida pra primeira busca). Chegar num andar pela Travessia revela 1 posto.
- O motor do AFK não mudou: cada posto vira uma área (`area_do_posto`).
  `areas_disponiveis` segue existindo como ajudante dos testes de AFK.

### 👥 Aldeia por equipes — FASE 1 de 4 (20/09, pedido grande do dev)
`game/clan_equipes.py` (puro) + colunas `clan_habitante.talentos/funcao/equipe`
e `clan.equipes`. Feito nesta fase:
- **Talentos** 0–5★ por profissão (agricultor, lenhador, caçador,
  minerador, guarda, curandeiro); 0★ = não pode. Medido: 62% dos talentos
  são 0★; 21% podem ser guarda. **5★ produz 4× o 1★** (linear).
- **Nível máximo**: coletor 20; guarda 20 × estrelas de guarda (5★ = 100);
  passar de 100 só guarda 5★ com aura (+20 por estrela de aura).
- **Equipes**: coletar é FORA, num posto do andar do clã, e **só sai com
  guarda** (o jogador escolhe quantos). A escolta enfrenta a ameaça do andar
  (cresce mais que linear: andar 10 = 97, pede 2 guardas 1★ Nv20; andar
  40 = 652, pede 10). Escolta fraca = rende proporcional e coletor cansado.
  Habitante fora de equipe NÃO produz (a sessão da aldeia só cuida da vida).
- **Manutenção** por sessão (além da ração): madeira 0,5 por habitante;
  guarda +12 de comida, 1 couro e 1 ferro. **Faltou qualquer um = greve**:
  ninguém sai. **Comprar de outras aldeias**: comida 1g, madeira 2g, couro
  3g, ferro 5g (ferro = material rank 1).
- Os LUTADORES (personagens) não vão mais pros postos — são da Travessia (a
  fase 3 os transforma em guardas). O caminho antigo "membro no posto" do
  `rodar_afk` ficou sem entrada na tela; apagar quando a fase 3 entrar.

**Próximas fases (pedido de 20/09, ainda NÃO feitas):**
- ✅ **Fase 2 — Ferreiro (feita, 20/09)**: `game/clan_ferreiro.py` (puro),
  colunas `tier_ferramenta`/`tier_equipamento` por habitante, página
  Clã → ⚒️ Ferreiro. Duas trilhas: ferramenta (todos; ×1,00→×1,75 na
  produção) e equipamento (quem tem guarda ≥1★; ×1,00→×2,10 no poder).
  Ação da vez: NIVELAR quem está abaixo do tier do lote (degrau ×1,5,
  arredondado pra cima) ou EVOLUIR todos um tier (degrau × gente).
  Degrau por cabeça: T2 3 r1, T3 2 r2, T4 4 r2, T5 1 r3; guarda ×2. Material
  só do CLÃ. Medido: 25 coletores do T1 ao T5 = 75 r1 + 150 r2 + 25 r3.
- ✅ **Fase 3 — Batalha nos pontos (feita, 20/09)**: `game/clan_batalha.py`
  (puro) + `clan_repo.batalha_pelo_ponto`. Ponto de OUTRO JOGADOR se toma
  com a **equipe do ponto** (chave especial `"ponto"` em `clan.equipes`,
  coletores + guardas; sem ela não se marcha). Poder = guardas (+ o
  personagem do defensor de guarda, valendo um guarda 3★ do mesmo nível).
  Defensor configurado pra FUGIR (`clan.defesa`) entrega o ponto sem
  mortes. Lutando: quem perde tem os guardas MORTOS e os coletores
  ROUBADOS — nos dois sentidos (pedido do dev: atacar e perder custa o
  mesmo). Ponto de bot segue a regra antiga (força × guarnição).
  **Personagem de guarda**: `p["de_guarda"]` (CAMPOS_EXTRAS) + poder em
  `clan.guarda_pessoal`; as 11 rotas da Torre/combate chamam
  `_exigir_fora_da_guarda`.
- **Página de cada equipe** (tela de detalhe `clan_equipe`, aberta pelo
  cartão em Clã → Postos): escolher quem entra, ordenado por talento na
  função (depois nível), mostrando "em: outra equipe" / "livre", com filtro
  "Só quem está livre"; o rascunho sobrevive ao filtro. A equipe do ponto
  tem lá a escolha lutar/fugir e o botão do personagem de guarda.
  `testar_varredura.js` ganhou a lista DETALHE (tela fora do menu precisa de
  um `irPara` até ela).
- ✅ **Fase 4 — Storylets (feita, 20/09)**: cada resposta da Fundação tem
  `gente` (função + estrelas mínimas + quantos) e `recursos`; todo clã ganha
  ainda o "velho do portão" (guarda 1★) — sem guarda nenhuma equipe sai.
  `clan_repo.fundar_aldeia` cria o clã inicial (ex.: montanha+guerra+
  negociou = 7 pessoas). `clã_aldeia.json`: 10 storylets de equipes, aldeia
  e vizinhos; efeitos madeira/couro/ferro agora vão pro estoque de verdade
  (`_aplicar_recursos_reais`). Qualidade **vizinhos** começa em 50
  (`storylets._estado`) e mexe no preço das outras aldeias (±30%,
  `clan_equipes.preco_de_outra_aldeia`). 🐛 Achado: as situações (Decisões)
  só nasciam de lutador em posto — que não vão mais pra lá; agora nascem
  das equipes lá fora (~35% por equipe por sessão cheia).
- **Ferreiro por FUNÇÃO** (2ª rodada, dev: "separar conforme o que faz"):
  5 bancadas — agricultor, lenhador, caçador, minerador, guarda — cada
  habitante com o próprio tier em cada uma (`clan_habitante.tiers`); a
  bancada só conta quem está FAZENDO aquilo agora
  (`trabalho_dos_habitantes`); mudar de função = chegar como novato.
- **Postos** agrupa as equipes pelo que fazem (ponto, comida, madeira,
  couro, ferro). A **página da equipe** mostra primeiro quem está nela (com
  ✖ Tirar) e "➕ Adicionar coletores/guardas" abre a lista de candidatos
  (mais talento primeiro, "em: outra equipe"/"livre", filtro de livres);
  cada toque já salva. Equipe pode ficar incompleta — só não SAI.
- Rank 3 escasso: o dev decidiu MANTER (chefe deixa 1). Medição em
  `testes/medir_material.py` (andares 5 e 10): Torre = 1 de rank 3 por luta
  no andar de chefe; andar 4 dá 0,28 r1 + 0,20 r2 por luta, andar 9 dá
  0,31 r1 + 0,60 r2; Travessia 4→5 e 9→10 = 1 de rank 3 cada (o chefe) e
  ~1–1,5 de r1/r2; equipe no Veio: 12/sessão (minerador 1★ Nv1) a 94
  (5★ Nv20), ×2 com a Mina. A Mina do andar 5 não multiplicava nada (Veio
  só do 6) — o dev mandou o Veio aparecer a partir do andar 5.

### 🔎 Explorar, cidade, Veio de Cores e o mapa por andar (20/09, dev)
- **Mapa**: 3 pontos de cada tipo em CADA andar (1–50); o Covil do Chefe só
  nos andares de chefe (3 em cada) — lá sai o material de lendário; 1
  refúgio por andar. ~1.130 pontos; o ponto guarda o `andar` (coluna nova,
  índice); força/bônus seguem `tier_do_andar` (de 5 em 5). Banco com o
  mapa velho (andar NULL) é refeito e os clãs soltam o ponto. A tela do
  mapa só lista o andar do clã (`listar_mapa(andar)`).
- **🔮 Veio de Cores** (tipo `cores`, `so_guardas`): rende ~2 cores por
  sessão (× integridade) do tier da Torre no andar, direto pro inventário
  do personagem (`rodar_afk` devolve `cores`, a rota `/api/clan` soma em
  `p["inv"]["cores"]`). A equipe do ponto ali é só de guardas.
- **🏰 Cidade**: equipe especial `cidade` (só guardas) = guarnição. É ela
  que defende a aldeia (`defesa_da_aldeia` conta só guarda em casa). Ataque
  que passa leva 20% de comida, madeira, couro e ferro (Memória + diário).
- **🔎 Explorar** (`game/clan_explorar.py` + `explorar_com_equipe` /
  `escolher_achado` / `atacar_cidade`): uma EQUIPE com guarda explora o
  andar do clã (custa `4 + andar/2` de comida; 25% de emboscada — escolta
  fraca = +25 de cansaço na equipe) e volta com 5 achados (postos
  escondidos, pontos do mapa do andar, cidades de outros clãs no andar).
  Escolher: posto → descoberto e a equipe fica lá; ponto → a equipe vira a
  do ponto e marcha (`conquistar_ponto`: bot ou batalha de guardas);
  cidade → guardas × guarnição (+ personagem de guarda do dono): vencendo,
  a guarnição morre e 20% do estoque vem; perdendo, guardas mortos e
  coletores levados. A lista fica gravada em `clan.achados` e é consumida
  ao escolher; explorar de novo refaz (e cobra de novo).
  (`explorar_andar` antigo ficou só como ajudante de teste.)
  Explorar gasta **comida E madeira** (`madeira_da_busca` = 2 + andar/5: a
  lenha da tocha e da fogueira); faltando um dos dois, nada é cobrado.
- **⭐ XP de verdade** (dev: "guardas também têm estrelas, níveis e XP"): o
  XP saiu do "todo mundo ganha 1 por tick em casa" e foi pro TRABALHO —
  coletor 24/sessão numa equipe que saiu; guarda de escolta 10 + ameaça/10
  (andar 5: 15, andar 20: 33, andar 40: 75); guarnição 5 de vigia + 30 se
  repelir ataque (10 se não); emboscada 15; batalha vencida 50
  (`clan_repo.dar_xp`). Parado em casa não aprende (só o curandeiro, que
  trabalha lá). Teto: coletor 20; guarda 20 × ★ (só aura passa do 100).
  **Ritmo ×20 (dev: "muito tempo, divide por 20")**: `H.RITMO_XP = 20`
  multiplica TODO XP ganho em `ganhar_xp` (um lugar só). Sessão = até 6h
  (24 ticks de 15 min; acima disso não acumula). Medido agora: coletor
  Nv1→20 em ~5 sessões; guarda no andar 40: Nv1→20 em 1,5, Nv20→60 em 13,
  Nv60→100 em 25 (~6 dias a 4 sessões/dia); no andar 5 o 60→100 leva ~129.

### 🏺 Relíquias + 🛡️ privilégio do novato (20/09, dev)
- `game/clan_reliquias.py` (puro) + `clan.reliquias` + página Clã → 🏺
  Relíquias. 8 relíquias, cada uma com história e um efeito passivo
  (ferreiro −20% material, explorar acha mais, guarda +10%, coleta +10%,
  defesa da cidade +25%, manutenção −15%, ferro +15%, XP dos NPCs +25%).
  **Acham-se nos POSTOS**: ~1% por equipe por sessão (medido: 1,01%), sem
  repetir; o acervo cresce e só **3 ficam ativas** — a escolha é o sistema.
  Cada efeito é LIDO onde age (o teste recusa relíquia de enfeite).
- **Privilégio do novato**: até o andar 10 (`logic.ANDAR_DO_NOVATO`) morrer
  não cobra nada — portal sempre aberto, sem cooldown, sem perder o andar.
- **Reviver por ouro**: com o portal fechado, 20.000 de ouro
  (`CUSTO_REVIVER_OURO`, ~3 dias de diárias) via `/api/tower/revive_pago`.
  A tela da morte não tem (e o teste proíbe) botão de "começar de novo".

### 💰 O OURO VIROU SALÁRIO (20/09, dev)
Monstro da Torre e da Raid **não paga mais ouro** (`reward_gold = 0`); a
Travessia paga em couro e as decisões do clã em ferro; o AFK do clã não
gera ouro (achado raro virou ferro) e os pontos Cristais/Ruínas/Covil dão
bônus de material/comida/couro. Ouro vem só de quem PAGA: missões diárias
(`game/diarias.py`, 4 missões + bônus = 4.000/dia), missões de iniciante
(8.500 uma vez), login diário (500 × dias, teto 3.500), arena (50 + 2×nível
do oponente), Onda de Boss e a venda na loja. `auditar_recompensas.py` teve
a asserção INVERTIDA: antes garantia que o abate pagava ouro, agora garante
que não paga (e que paga XP e material).

### 🖼️ Arte que só existia no Telegram + 🛒 material na loja (20/09)
- **Xamã Goblin e chefe do andar 20 sem imagem**: não era chave errada — a
  chave bate (`MOB_XAMA_GOBLIN`, `MOB_XAMA_KOBOLD_DAS_CINZAS`). As 31
  chaves que nasceram COM ACENTO no assets.py (Xamã, Capitão, Gárgula,
  Demônio, Aberração, Titã...) nunca foram baixadas pro disco: o espelho
  recusava nome acentuado, e a normalização veio depois. Com o bot fora,
  o file_id não mostra nada. O catálogo do /admin contava como "arte
  própria"; agora, havendo espelho no disco, chave com file_id e SEM
  arquivo vira `sem_arquivo` ("só no Telegram — reenviar"), conta como
  faltando e ganha o 📤 Enviar. (Recuperar do Telegram exigiria o token do
  bot de novo — o dev decide.)
- **Loja da cidade vende material de forja**: rank 1 = 50g, rank 2 = 100g,
  rank 3 = 200g por unidade (`clan_materiais.PRECO_NA_LOJA`), +1/+5, vai pra
  mochila (`/api/shop/buy_material`).

### 📑 Páginas do clã (20/09)
A tela única do clã virou 4 páginas com abas no topo e no menu: Resumo
(diário, humor, situação, recursos, andar), Postos (explorar + membros),
Aldeia (habitantes, serviços, forja e construções), Histórico (sessões
passadas + tombados). Todas usam `carregarPaginaDoClan` (uma chamada a
`/api/clan`, redireciona pra Fundação) e as ações voltam pra MESMA página
(`recarregarClan`, que olha `TELA_ATUAL`).

### ⚔️ Material por tipo de monstro + mapa que dá bônus (20/09, regras do dev)
- **3 ranks, pelo MONSTRO** (`clan_materiais.RANK_DO_TIPO`): comum → rank 1
  (forja Comum/Incomum), elite/general → rank 2 (Raro/Épico), chefe → rank 3
  (Lendário). **Tudo deixa 1** (dev, 20/09): comum em 35% das vezes; elite,
  general e chefe sempre. ⚠️ Com isso, o rank 3 do CLÃ só vem da Travessia
  (1 por andar de chefe atravessado) — Atalaia e Núcleo primordial (40 de
  rank 3 cada) ficaram praticamente inalcançáveis. Decisão pendente do dev.
  Posto: Veio → rank 1, Veio Profundo → rank 2; rank 3 só de chefe. Os 5
  ranks por faixa de andar saíram (a versão "rank cheio só em andar de
  chefe" durou uma rodada — o dev corrigiu). Comodidades e equipamento do
  clã foram pra 3 ranks (Atalaia e Núcleo primordial: 40 de rank 3 ≈ 8
  chefes). Material velho de rank 4/5 cai no 3 ao carregar.
- **Ponto do mapa dá BÔNUS, não produz** (`territorio.bonus_do_ponto`):
  +100% (tier 1) a +150% (tier 10) × integridade, no recurso do tipo
  (floresta→madeira, nascente→comida, caça→couro+comida, mina→material,
  ruínas/covil→material+ouro, cristais→ouro). `rodar_afk` aplica em cima do
  que postos + aldeia renderam (`aplicar_bonus_do_ponto`). Sem ponto o clã
  pega o mesmo, só que menos. Refúgio não dá bônus.
- **Mapa só no andar do clã**: toma e segura pontos só do andar onde está
  (todo ponto fica em andar de chefe, `andar_do_ponto` = tier×5); mudar de
  andar larga o ponto; um refúgio em cada andar de chefe.
- 🐛 Pego pelo teste na mesma rodada: ao dobrar os ranks 4/5 no carregamento,
  eu lia `clan["materiais"]` DEPOIS de sobrescrevê-lo — todo material do clã
  carregava vazio. `testar_jornada`/`testar_ouro_e_forja` acusaram.

### 🧭 O clã só domina os postos do andar onde está (20/09, regra do dev)
"Não se anda mais que 1 andar, e o clã só domina os pontos onde ele está —
a progressão é lenta." `andar_de_trabalho` = o andar do clã (nunca além do
`tower_floor`); `areas_do_cla` só devolve postos DESSE andar, e explorar
também só nele. Mudar de andar é recomeçar a achar postos (a chegada da
Travessia revela 1). A logística de caravanas entre andares distantes
(perda no caminho, emboscada, posto avançado), feita logo antes, SAIU
inteira: com a regra do dev a distância não existe.

### ⚖️ Pendências de equilíbrio fechadas (20/09)
- **Forja:** piso = ~50 de material por peça QUE SAI (piso × chance):
  comum 25 (100%), incomum 40, raro 30, épico 20, lendário 10.
- **Mão de obra voltou**, agora com leitor: 500g → a próxima construção
  gasta 30% menos metal e madeira (`clan.mao_de_obra`, lido e consumido em
  `/api/clan/construir`; não se paga duas vezes). **Reparar arsenal** segue
  fora — exigiria um sistema de desgaste que o jogo não tem.
- **Condições de ouro nas decisões:** não existiam — o "bronze" dos
  storylets só aparecia em EFEITOS (recompensas/custos), nunca em condição.
  As recompensas agora são ouro real (+60 a +150; custos de −40 a −120).
- **Arena de Pets**, três bugs achados ao medir o "efeito bola de neve":
  (1) a recarga do jogador só andava DEPOIS do clique — a tela mostrava toda
  skill com um turno a mais e o botão vinha travado (espelho: jogador 38%);
  (2) todo empate de barra era do jogador (espelho 1x1: até 90%); agora é
  moeda; (3) espelho de curandeiros e de tanques NUNCA terminava (60/60) —
  cura era % do ATK contra dano subtrativo. Cura virou % da vida (15%/8%),
  Muralha 25%, e a arena "se fecha" depois da ação 40 (−10% cura/escudo e
  +10% dano por rodada). Medido depois: espelho 45–50%, toda combinação
  termina. A bola de neve em si já tinha caído com o rebalanço de ATK
  (vencedor fica com ~3,3 de 5, era ~4,1).

### 📤 Arte pelo painel (20/09)
- `/admin` → Imagens → cada linha do catálogo tem **📤 Enviar** (arte que
  falta) ou **🔁 Trocar** (arte que já existe). O arquivo vai em base64 no
  JSON (nada de multipart — armadilha nº 9), é validado pelos BYTES
  (JPG/PNG/WEBP/GIF, até 8 MB), apaga as miniaturas velhas da chave e grava
  uma versão em `data/imagens/_versoes.json`; o front põe `&v=` na URL das
  artes trocadas, senão o cache de 24h de `/api/imagem` esconderia a troca.
  Arte enviada conta como "própria" no catálogo mesmo sem file_id do bot.
- **Monstro normal não nasce do andar 30 em diante** (`monsters.pesos_do_andar`,
  agora fonte única da regra). O catálogo parou de cobrar essas 42 artes:
  monstros foram de 33 faltando pra **0**. Falta arte de verdade só em 22
  retratos de jogador, 15 montarias e 4 telas.
- ⚠️ **`data/imagens/` é a ÚNICA cópia da arte** depois que o bot sair. Ao
  "apagar o data" pra recomeçar os testes, apagar o resto e MANTER essa pasta
  (e `_versoes.json` dentro dela).

### Fila do dev (pedido de 20/09) — o que AINDA falta
Feitos neste lote: autobatalha travando, XP fixo em 10, ⭐/andar parados na
barra de cima, tinta preta nos cartões que viram, botão da poção, cores da
loja atrás de botão, `wa_atk` na forja, prêmio da Onda a 1%.
Segundo lote: campo `sexo` (3º passo da criação) + arte do jogador por
raça e sexo (`STATUS_<RAÇA>_<M|F>`, com queda pra `STATUS_<RAÇA>` e
`STATUS`), atributos de combate dos pets na ficha, engaste com a arte da
peça em cima. As 22 chaves de arte de jogador entraram no catálogo do
/admin — todas faltando, é só desenhar.
Em aberto:
- **Arena de Pets**: ✅ as 4 opções por pet estão prontas (20/09) —
  `game/pet_skills.py`, 3 skills por arquétipo + ataque básico, escaladas
  pela raridade, com arte e estado (escudo/atordoado/veneno/buff) na tela.
  ✅ **1x1 com troca** também pronto: entra um de cada lado, quem cai dá
  lugar ao próximo do esquadrão (barra zerada — cair custa tempo) e a
  batalha acaba quando um lado não tem mais ninguém. A ORDEM do esquadrão
  virou decisão: o slot 1 é quem abre a luta.
  ✅ **Atributos rebalanceados (20/09)**: o `atk` de combate saía de
  `bonus_stats.atk` — que é o bônus passivo no personagem, quase sempre 10 —
  enquanto a `def` ia de 5 a 70 por raridade. Com dano subtrativo
  (`max(1, atk - def)`), o lendário tank levava 979 turnos pra morrer. Hoje
  o atk vem da tabela por raridade, dimensionado como `def + hp/10`: 7 a 11
  golpes básicos pra derrubar o espelho em toda raridade (tanque ~15).
  A tela dos atributos saiu da ficha do personagem e foi pro cartão dos
  Espíritos, que é onde se compara pet com pet.
  ⚠️ Medido: o vencedor termina com ~4 de 5 pets vivos. Ganhar o primeiro
  duelo tende a decidir a partida (é próprio do formato), então se isso
  incomodar, o lugar de mexer é a barra de quem entra ou uma cura entre
  duelos.
- **Arena PvP**: ✅ pronta (20/09) — mesmos blocos da Torre (retratos, ATB,
  fila de turnos, log, grade de skills), com o retrato do adversário vindo
  da raça e do sexo dele. O retrato sai do personagem VIVO
  (`load_player`), não do snapshot: `arena_snapshots` não tem coluna de
  raça/sexo e criar uma pediria migração (armadilha nº 14).

### Conteúdo
- 41 storylets: 31 do clã + 10 encontros da Torre. O plano é ~30 com memória visível no meio de ~200 neutros.
- Áreas de AFK são derivadas da Torre automaticamente, mas sem texto próprio
- 8 estados vazios ainda sem próximo passo (o teste lista)

---

## Como trabalhar neste projeto

- **Medir antes e depois**, com simulação. Isso pegou praticamente todos os
  achados grandes deste projeto.
- **Avisar sobre bugs encontrados**, mesmo fora do que foi pedido
- **Entregar zip completo**, nunca patch solto
- **Nunca incluir `data/`** no zip
- Usar **commit** (não "upload") no Square Cloud
- O dev trabalha **do celular** e aprova iterativamente

### Rodar os testes

```bash
bash testes/rodar_tudo.sh              # suíte completa
python3 testes/auditar_storylets.py    # alcançabilidade dos storylets
python3 testes/auditar_areas_afk.py    # áreas do AFK
python3 testes/auditar_materiais.py    # ranks de material
python3 testes/auditar_risco_afk.py    # curva de risco
python3 testes/auditar_fome.py         # o laço da comida
python3 testes/auditar_fusao.py        # a curva da fusão mítica
python3 testes/auditar_catalogo_imagens.py # arte: o que falta, por tipo
python3 testes/auditar_recompensas.py  # ritmo de XP + rota da autobatalha
python3 testes/auditar_pet_skills.py   # equilíbrio das 4 opções de pet
python3 testes/auditar_arena.py        # contrato rota x tela da Arena PvP
python3 testes/auditar_aldeia.py       # o laço da aldeia viva, simulado
python3 testes/testar_aldeia.py        # E2E da aldeia no banco (migração, ferimento)
python3 testes/auditar_territorio.py   # o mapa: 10 por tipo, perda gradual, tiers
python3 testes/testar_territorio.py    # E2E do mapa: um por vez, PvP, perda pros bots
python3 testes/testar_ouro_e_forja.py  # só ouro, material na forja, comida comprada
python3 testes/testar_migracoes.py     # toda tabela migra banco velho pelo próprio CREATE
python3 testes/testar_modo_so_site.py  # o jogo sobe sem BOT_TOKEN
python3 testes/testar_fila_situacoes.py # a fila do clã é fila e não pisa na Torre
python3 testes/auditar_jornada.py      # a travessia: no ponto passa lutando, metade não
python3 testes/testar_jornada.py       # E2E da travessia + postos no banco
python3 testes/auditar_postos.py       # postos: lista por andar, achar é sorte, raro é raro
python3 testes/auditar_equipes.py      # talentos, tetos, 5★=4×, guarda caro, ameaça do andar
python3 testes/testar_equipes.py       # E2E: só sai com guarda, coleta, manutenção, greve, compra
python3 testes/medir_material.py       # quanto material dão os andares 5 e 10, por fonte
python3 testes/auditar_ferreiro.py     # lote, nivelar novato, guarda ×2, bônus; custo T1→T5
python3 testes/testar_ferreiro.py      # E2E do ferreiro no banco
python3 testes/testar_batalha.py       # batalha pelo ponto: rouba/mata nos dois sentidos, fuga, Torre travada
python3 testes/testar_cidade_e_cores.py # Veio de Cores só de guardas; guarnição defende; saque de 20%
python3 testes/testar_explorar.py      # explorar: guarda, comida+madeira, emboscada, 5 achados, posto/ponto/cidade
python3 testes/testar_xp_guardas.py    # XP do trabalho: escolta/vigia/coletor sim, parado não; teto por estrelas
python3 testes/testar_fundacao_e_vizinhos.py # fundação monta o clã; vizinhos mexem no preço; storylets com efeito real
node    testes/testar_admin.js         # o painel /admin executa
python3 testes/testar_fome.py          # E2E da ração no banco
python3 testes/testar_trava.py         # a trava do jogador (o bug do Explorar)
python3 testes/testar_estado_jogador.py # o save não pode descartar campo
python3 testes/testar_backup.py        # o backup restaura de verdade
node    testes/testar_telegram.js      # o app sobe fora do Telegram
node    testes/executar_appjs.js       # o app.js executa de verdade
python3 testes/testar_schema_cla.py    # migração das tabelas do clã
```

Ver `testes/LEIA-ME.md` — cada teste tem escrito **por que existe** e qual bug
real ele pegou.

---

## Armadilhas (custaram caro, não repetir)

1. **Verificar se algo já existe antes de implementar.** Já houve recriação
   da Loja inteira sem perceber que estava pronta.

2. **`background:` shorthand apaga `background-image`** de outra regra com a
   mesma especificidade. Usar `background-color:` nos componentes base.

3. **A lógica do bot nem sempre está no motor compartilhado.** Foi a causa de
   quatro bugs: `pending_orders` e `conta_bloqueada` que não gravavam, o
   vendedor do Mercado que nunca era avisado, e os tutoriais presos ao
   `aiogram`.

4. **Campo novo no jogador precisa entrar em `_extra_fields`** do
   `sql_repo.py`. Fora dela, `save_player_sql` descarta em silêncio e o
   campo some a cada reinício. Já mordeu três vezes.

5. **`p["tower_floor"]` é sobrescrito** durante combates de Exploração — usar
   `explore_state.saved_tower_floor`.

6. **Efeito bonito isolado ≠ efeito bom no produto.**

7. **A versão de cache agora é automática.** O servidor calcula o hash de
   `app.js` + `style.css` e carimba no `index.html`. Isso existe porque eu
   caí na armadilha: o arquivo ficou preso em `v=31` enquanto eu achava que
   estava em `v=43`, e **doze versões de mudança foram servidas do cache
   antigo**. Não mexa nisso pra voltar a número manual.

8. **`node --check` não executa nada.** Passou num `app.js` de onde eu tinha
   apagado 475 linhas por engano — inclusive o menu inteiro. Quem pegou foi a
   varredura. Ao substituir bloco grande, delimitar pelo fim do próprio bloco
   e conferir o tamanho antes de apagar.

9. **Dependência implícita derruba tudo.** `python-multipart` faltando não
   quebrou só o upload: o FastAPI valida no registro da rota, então derrubou
   as 147 rotas de uma vez. Hoje a rota é registrada condicionalmente, e
   Pillow segue o mesmo padrão.

10. **Campo que nada grava é enfeite, por mais bonita que seja a fórmula.**
    `fome` existia na tabela, `clan_risco.poder_do_membro` descontava ela do
    poder, e mesmo assim nada acontecia — porque ninguém escrevia no campo e
    porque `clan_risco.py` **não é importado por nenhum arquivo fora dos
    testes**. Quem decide vida e morte no AFK é `clan_afk.montar_perfil`,
    que só lê atributo. Antes de ajustar uma fórmula, conferir quem a chama.
    Mesmo caso ainda aberto: `ferimento`, e as comodidades (`teto_comida`
    era declarado e não lido; `reduz_perda`, `bonus_situacoes`,
    `cura_ferimento` e `revela_perfil` continuam sem leitor — só `forja`
    funciona, porque `custo_equipamento` consulta ela direto).

11. **Teste com caminho absoluto da sua máquina não é rede, é enfeite.**
    ⚠️ Voltou em 18/09: `testar_grupos.js`, `testar_varredura.js`,
    `testar_backend.js` e `testar_imagens.js` ainda tinham
    `/home/claude/isekai/` embutido. Hoje todos derivam a raiz do próprio
    arquivo, e `testar_varredura.js` varre a pasta de testes recusando
    qualquer caminho absoluto novo.
    `testar_imports.py` importava um stub de `/home/claude/bench` e fazia
    chdir pra `/home/claude/isekai`: não passava em lugar nenhum, nem no
    servidor. E `rodar_tudo.sh` chamava nove arquivos que não existem no
    repositório, então a suíte saía sempre vermelha e o resultado dos
    testes reais sumia no ruído. Os dois estavam assim havia tempo sem
    ninguém perceber — porque uma suíte que sempre falha vira ruído de
    fundo, e ruído de fundo a gente para de ler.

12. **A trava do jogador não pode pertencer à THREAD.** Foi o que travava
    o "Explorar". A trava ficava num `threading.local()` e era solta "no
    começo do próximo `_carregar_jogador`", apostando que o threadpool
    reaproveitaria a thread. Ele não reaproveita: o FastAPI serve cada
    rota síncrona numa thread qualquer. Rota de leitura pegava a trava e
    nunca soltava (38 rotas assim), a requisição seguinte caía noutra
    thread e esperava para sempre, e cada retentativa prendia mais uma
    thread do pool até o processo inteiro parar — bot incluso, porque ele
    roda no mesmo event loop. Qualquer rota de escrita que ESTOURASSE
    entre carregar e gravar deixava a trava presa igual, já que o
    `finally` morava em `_salvar_jogador`. Hoje quem segura a trava é a
    REQUISIÇÃO (`RotaQueSoltaATrava` + contextvar), o `acquire` tem
    timeout de 20s, e `testar_trava.py` não deixa voltar.

13. **`window.Telegram.WebApp` existir NÃO quer dizer que você está no
    Telegram.** O `telegram-web-app.js` cria o objeto em qualquer lugar; o
    que muda é `platform`, que vem `"unknown"` fora do cliente — e aí todo
    método que fala com o host (`ready`, `expand`, `HapticFeedback`,
    `BackButton`, `showAlert`) **estoura** `WebAppMethodUnsupported`.
    `tg.ready()` estava na terceira linha do app.js, no escopo do módulo:
    estourando ali, derrubava o arquivo inteiro e o jogo ficava na tela de
    carregando sem dizer por quê. Optional chaining não protege — o método
    existe, ele só estoura ao ser chamado. Hoje a detecção olha `platform`
    e toda chamada passa por `tgTentar`/`tgAlerta`/`tgVibrar`;
    `testar_telegram.js` roda o bloco contra um cliente que estoura tudo.
    Como o jogo está migrando pra site próprio, **fora do Telegram é o caso
    normal**, não a exceção.

14. **`CREATE TABLE IF NOT EXISTS` não conserta tabela que já existe.**
    Produção estourou com `no such column: equip_poder` na tela do clã: o
    banco nasceu antes de `equip_poder`, `equip_rank`, `perfil_json` e
    `perfil_nivel` entrarem no CREATE, e as tabelas do clã nunca tiveram
    migração. Lendo o código o schema parecia certo; no disco estava
    errado. Hoje `TABELAS` em `clan_repo.py` é a **única** fonte — o CREATE
    e a migração saem dela, então coluna nova não tem como existir num
    lugar e faltar no outro. `testar_schema_cla.py` monta o banco velho de
    propósito e confere.
    ✅ **Fechado em 20/09** pras outras 19 tabelas: `infra/migracao.py`
    lê o PRÓPRIO texto do CREATE e acrescenta no disco o que falta —
    cada CREATE virou constante `_SQL_*` e o init chama
    `garantir_colunas` com ela. `testar_migracoes.py` monta cada tabela
    no formato mais velho possível e confere, e recusa CREATE solto.
    (`infra/db.py` e `infra/repo.py` são código MORTO — nada importa os
    dois; ficaram fora, pra apagar quando o dev quiser.) Eram: `character_storage`, `active_slot`, `character_market`,
    `marketplace`, `premium_wallet`, `premium_history`, `player_registry`,
    `raid_rooms`, `arena_week`, `global_boss`, `avisos`, `usuarios`,
    `sessoes`, `codigos_vinculo`, `meta`, `players` (o de `infra/db.py`).
    Só `players` do `sql_repo.py` tem migração, e no formato antigo
    (CREATE de um lado, dicionário de ALTERs do outro, na mão).

15. **`url()` do CSS sem aspas quebra com parêntese na URL.**
    A arte procedural subiu e o retrato do monstro apareceu VAZIO — quadrado
    escuro, sem um erro sequer no console. O SVG usava
    `fill="url(#gradiente)"` internamente; dentro de
    `background-image: url(data:image/svg+xml,...)` o `)` de dentro fechava
    o `url()` do CSS antes da hora e a regra inteira virava lixo.
    (`encodeURIComponent` não escapa `(` nem `)`.) Hoje
    Hoje todo `background-image` posto pelo JS passa por `porFundo`, que põe
    aspas no url(). Vale pra qualquer URL com parêntese ou espaço, não só
    data-URI de SVG.

16. **Coluna declarada não é coluna usada.** Terceira vez: `teto_comida` e
    `fome` já tinham aparecido assim, e agora `clan.diario` — declarada no
    schema, carregada em `carregar_clan()` e **nunca escrita por ninguém**.
    O relatório do AFK vivia só na resposta da requisição: bastava reabrir
    a tela do clã pra sumir pra sempre. Ao mexer numa tabela, vale grepar
    cada coluna por uma escrita, não só por uma leitura.

17. **`p["premium"]` é CÓPIA da carteira, não a carteira.** O saldo de ⭐
    mora no `premium.db`; `spend_premium`/`add_premium` mexem lá e não
    tocam na cópia que a tela lê. Foi relatado que o mercado não cobrava
    pra anunciar nem pagava a venda — medido, a carteira estava certa o
    tempo todo (100⭐→50⭐ na taxa, 50⭐→350⭐ na venda). O número parado na
    tela é indistinguível de "não cobrou". Toda operação de carteira agora
    ressincroniza a cópia, e `testar_mercado.py` confere as DUAS: conferir
    só a carteira daria verde com o bug em pé.

18. **`player_id` não sobrevive ao save, e o site nunca teve um.** Comprar
    VIP e Autobatalha pelo site dava "❌ Erro: player_id inválido": só o
    bot injetava o campo, no começo de cada callback. A correção é chamar
    `ensure_premium_player(p, user_id=telegram_id)` — ele busca no
    `player_registry` POR `user_id` (o `chat_id` é só metadado), então
    devolve a MESMA carteira do bot e ninguém perde ⭐. O saldo da loja
    também aparecia zerado pelo mesmo motivo, porque a rota chamava sem
    `user_id`.

19. **O efeito de raridade nunca apareceu em item nenhum.** Os itens
    carregam a raridade em INGLÊS (`common`…`legendary`, de
    `game/items.py`) e o CSS só define as classes em PORTUGUÊS
    (`.rar-comum`…`.rar-lendario`). `class="cartao-item rar-legendary"` não
    casava com nada — cantos ornamentados, glow e o pulso do lendário
    nunca foram vistos, em tela nenhuma. Pets e montarias funcionavam
    porque os bancos deles já guardam em português, o que **escondia** o
    bug. Hoje toda classe passa por `classeRar()`, que aceita os dois
    vocabulários, e `testar_varredura.js` recusa classe montada na mão.

20. **Limpeza de temporário vai na ENTRADA, não na saída.** A tentação no
    backup era apagar o zip depois de enviar (`BackgroundTask`). Download
    cancelado, conexão caída ou processo reiniciado no meio deixam o
    arquivo pra trás de qualquer jeito — e aí o disco enche por causa da
    rotina que existe pra proteger os dados. `limpar_temporarios()` apaga o
    que ficou da vez passada, por idade, e cobre todos os casos com uma
    regra só.

21. **`node --check` não pega constante não declarada — e varredor de
    texto também não.** Uma constante nova foi inserida depois de uma
    âncora que não existia mais; a substituição não aplicou em silêncio, o
    `node --check` passou, e a tela do clã teria quebrado no ar. Tentei
    varrer o texto atrás de identificador sem declaração: regex não dá
    conta de template com `${}` aninhado nem de regex literal com aspas
    dentro (`replace(/"/g, …)` abre uma string falsa e engole o resto do
    arquivo). A resposta é EXECUTAR: `executar_appjs.js` roda o app.js num
    DOM de mentira e chama os construtores. ⚠️ Ele não cobre o que só roda
    dentro de uma `render*` — o furo está escrito no cabeçalho do teste.
    **A lição do lado de cá: toda substituição de texto precisa falhar
    alto quando o alvo não existe.**

23. **Meia regra de normalização é pior que nenhuma.**
    `resolver_asset_key_inimigo` tirava sete acentos (Ã Á É Í Ó Ú Ç) e só
    no caminho de elite/boss. Resultado: 24 artes gravadas com acento que o
    jogo pedia sem acento (existiam no disco e nunca apareceram), e 38
    chaves acentuadas que `imagens.chave_valida` recusa — a chave É o nome
    do arquivo, então `/api/imagem` devolvia 400 e o espelho nunca baixava.
    Duas falhas opostas, a mesma causa. Hoje `assets.normalizar_chave` é a
    única regra e passa nos dois lados: quem pede (o resolver), quem grava
    (`save_asset`) e o que já estava em disco (o cache e o ASSETS, no
    import). Chave de asset é identificador, não texto de tela: normalize
    inteiro ou não normalize.

24. **Recompensa na tela não é recompensa no jogo.** Os storylets
    mostravam "+120 de bronze" no painel da decisão e o valor ia pra uma
    QUALIDADE abstrata que a própria rota sobrescrevia com o estoque real
    na abertura seguinte. O jogador via o ganho e não recebia nada. Todo
    efeito que tem nome de recurso precisa de um caminho até o recurso —
    hoje é `_aplicar_recursos_reais`, e o teste trava as duas rotas.

25. **Um ponteiro, dois donos, nenhum dono.** O storylet em aberto
    (`st["atual"]`) era usado pelo encontro da Torre E pelas Decisões do
    clã. Cada tela achava que o ponteiro era dela: uma apagava a outra, e
    decidir numa consumia a fila da outra. Estado compartilhado entre dois
    fluxos precisa de dono explícito — hoje a situação do clã carrega o
    próprio `sid`, e quem mexe no ponteiro da Torre devolve o que achou.

22. **Ler-modificar-gravar sem trava perde cobrança.** Medido: 12 teleportes
    simultâneos cobravam 1 de 12. Existe trava por jogador em
    `_carregar_jogador`/`_salvar_jogador` — rota nova que carrega e não grava
    precisa soltar com `_soltar_trava_pendente()`.

---

## Decisões de design já tomadas

- **Dificuldade financeira é intencionalmente difícil** — não facilitar sem
  pedido explícito
- **Não existe fuga no Mundo Exterior** (Exploração)
- **O AFK pode matar livremente.** Morte permanente de guerreiros e
  secundários; só o cabeça do clã revive. Por isso a agência vem ANTES: você
  escolhe o posto e vê a chance antes de mandar.
- **Clãs de NPC ocupam o mapa** no começo; PvP por território é escalada
- **O mapa é a própria Torre** — cada andar é uma área de AFK
- **5 ranks de material nos andares 1–50**, não 10 em 1–100. Medido: a
  fronteira de farm é ~metade do seu andar e para no 49 no fim do jogo, então
  ranks 6–10 seriam inalcançáveis.
- ~~**Moeda do clã é separada do ouro do jogador**~~ — **revertido pelo dev
  em 20/09: só existe OURO.** Bronze e prata saíram do jogo inteiro. O ouro
  mora em `p["gold"]`; `clan_repo` nunca grava ouro — ele devolve
  `ganho_ouro`/`custo_ouro` e quem tem `p` (a rota) soma, cobra e salva.
  O risco que a regra antiga evitava continua real: o teto é que segura
  (compra de comida a 1g por unidade, sempre pior que farmar).
  ⚠️ **EM ABERTO (18/09):** a ideia de prata/bronze serem fração de ouro
  contraria isso. Medido: com 1 ouro = 1 prata = 10 bronze, os 5.064💰 de
  uma conta comum viram **253 sessões** de renda de clã — a aldeia vira o
  bolso do personagem, exatamente o que a medição dizia. Nem 1 ouro = 0,1
  prata resolve (ainda dá 25 sessões). **A taxa não é o que conserta; o
  teto é.** Proposta: câmbio ruim + teto de ~100🥉 por sessão (50% da renda
  do clã, custando ~10💰) — o ouro do Império socorre uma sessão ruim e não
  substitui postar gente. E tem justificativa de cenário, não de regra:
  ouro lá em cima não compra o que se come.
- **Come quem está em posto**; quem fica na aldeia não come e recupera fome.
  É a porta de saída: se a comida acabou, recolher o pessoal conserta o clã
  e custa a produção da sessão. Fome sem saída, com morte permanente, seria
  armadilha e não aposta.
- **A comida é servida do mais forte pro mais fraco**, pela mesma razão
  medida no equipamento: o grupo vence se ALGUÉM vence, então dividir pouca
  comida igual enfraquece todo mundo sem salvar ninguém.
- **Equipamento do idle é automático** (melhor peça pro melhor guerreiro).
  Medido: força ganha nos dois eixos, porque o grupo vence se ALGUÉM vence.
  O personagem que você pilota na Torre continua equipando na mão.

---

## Números medidos que valem lembrar

| | |
|---|---|
| `load_player` sem índice, 1.500 jogadores | 7,01 ms → 0,51 ms com índice |
| 30 requisições simultâneas | congelava o bot 459 ms → 1,9 ms |
| 12 teleportes simultâneos | cobrava 1 de 12 → 12 de 12 com trava |
| Fronteira de farm do AFK | ~50% do seu andar; para no 49 |
| Perfil de risco | 39 ms pra montar, 2,6 µs por tick |
| Morte no AFK, teto de 3 expedições | perfil 0% eterno, 5,9% dura ~5 sessões |
| Imagem no tamanho certo | 97% menos bytes em retrato (w=64) |
| Storylets | 31/31 alcançáveis, 0 arcos abertos, 27 fundações testadas |
| Renda de comida | ~85/sessão no Andar 5 (era ~24, com só o Andar 1) |
| Ração do clã | 6 por membro postado por sessão cheia (1 a cada 4 ticks) |
| Clã ganancioso (ninguém na comida) | déficit de 18 a 30/sessão = 6 a 10% do bronze |
| Fome no teto | muda a morte em 5 de 16 combinações, +23 a +47 pontos |
| Teto de comida | 60/membro (mín. 180); clã de 5 = 300, com Celeiro 600 |
| Trava presa entre threads | requisição pendurada pra sempre → 0 ms, e 409 em 20s no pior caso |
