"""Matérias da Revista publicadas em 26/10/2026. Gera data/artigos/<slug>.json.

Fatos conferidos em fonte primária (skill escrever-materia):
- MEI: LC 238/2026 (Planalto), arts. 1º, 2º e 10; DAS 2026 pela Receita Federal.
- Japão: site oficial da QB House (preço, história, números) e Lei dos Barbeiros do Japão
  (理容師法, art. 1-2, e-Gov); barbearia Shibagaki pela SoraNews24 (2021).
- Turquia: CNN Travel (2021, série patrocinada pelo país, com controle editorial da CNN).
"""
import json, sys

DESTINO = sys.argv[1] if len(sys.argv) > 1 else "data/artigos"
HOJE = "2026-10-26"

MEI = {
"slug": "mei-vai-poder-faturar-mais-2027-2028",
"titulo": "MEI vai poder faturar mais: R$ 110 mil em 2027 e R$ 140 mil em 2028",
"resumo": "Uma lei de 21 de outubro sobe o limite do MEI em duas etapas. Pra barbeiro que estava perto de estourar os R$ 81 mil, muda o plano do ano que vem.",
"tipo": "noticia",
"publicadoEm": HOJE,
"tags": ["barbearia", "mei", "finanças", "brasil"],
"conteudo": """Muito barbeiro que trabalha sozinho é MEI e vive de olho no teto de faturamento. A boa notícia: **o teto vai subir**, em duas etapas. A Lei Complementar nº 238, de 21 de outubro de 2026, mudou a Lei do Simples Nacional.

### O que muda

| Ano | Limite de faturamento do MEI |
|---|---:|
| 2026 | R$ 81.000 (não muda) |
| 2027 | R$ 110.000 |
| A partir de 2028 | R$ 140.000 |

- **2026 continua igual:** o limite deste ano segue em R$ 81 mil.
- **2027:** a própria lei fixa R$ 110 mil para o ano-calendário de 2027 (art. 2º).
- **2028 em diante:** o novo texto do art. 18-A da Lei do Simples passa a valer R$ 140 mil, com efeito a partir de 1º de janeiro de 2028 (art. 10).
- **Quem abrir o MEI no meio do ano** continua com limite proporcional aos meses de atividade, como já era.

### Por que isso importa pra barbearia

Faça a conta: R$ 81 mil por ano dá **R$ 6.750 por mês**. Um barbeiro com agenda cheia passa disso fácil. Com R$ 110 mil, o teto vai pra cerca de **R$ 9.166 por mês** em 2027; com R$ 140 mil, cerca de **R$ 11.666 por mês** a partir de 2028.

Quem estava pensando em virar microempresa (ME) só por causa do limite pode **refazer as contas com o contador**: talvez dê pra continuar MEI, pagando o DAS fixo, por mais tempo.

### O que NÃO muda agora

- **O DAS de 2026** segue o mesmo: pra quem presta serviço, R$ 81,05 de INSS (5% do salário mínimo) + R$ 5,00 de ISS = **R$ 86,05 por mês**, segundo a Receita Federal.
- **Estourar o limite de 2026** continua com as regras de hoje. Passou dos R$ 81 mil este ano? Fale com o contador antes de dezembro.

A lei traz ainda outras mudanças, como regras de regularização de débitos que dependem de pedido e de regulamentação. Se você tem DAS atrasado, pergunte ao contador se vale pra você.

### O que fazer agora

1. **Some quanto a barbearia faturou de janeiro até hoje.** Sem isso, você não sabe se está perto do limite.
2. **Separe o dinheiro da barbearia do seu**, se ainda não separa. A lição [Separe o dinheiro da barbearia do seu](/cursos/seu-dinheiro-em-ordem/organizar/separar-o-dinheiro) mostra como.
3. **Leve a conta pro contador** e pergunte: "com o novo limite, continuo MEI em 2027?"

*Valores conferidos em 26 de outubro de 2026 nas fontes abaixo. Regra de imposto muda; combine sempre com seu contador.*""",
"fontes": [
    {"titulo": "Planalto — Lei Complementar nº 238, de 21 de outubro de 2026", "url": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp238.htm"},
    {"titulo": "Receita Federal — Simples Nacional: MEI, valores devidos em 2026", "url": "https://www8.receita.fazenda.gov.br/simplesnacional/noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3"},
],
}

JAPAO = {
"slug": "japao-barbear-de-ritual-e-corte-de-10-minutos",
"titulo": "Japão: o barbear mais caprichado do mundo e o corte de 10 minutos",
"resumo": "No mesmo país convivem a barbearia de bairro que faz o rosto inteiro na navalha e uma rede que só corta, em 10 minutos, por ¥ 1.400. As duas ensinam algo.",
"tipo": "serie",
"serie": {"nome": "Barbearias pelo mundo", "episodio": 2},
"publicadoEm": HOJE,
"tags": ["barbearia", "barbearias pelo mundo", "japão", "atendimento"],
"conteudo": """No Japão dá pra ver os dois extremos da barbearia lado a lado: a casa de bairro onde o atendimento leva **uma hora** e inclui barbear o rosto inteiro, e uma rede que **só corta cabelo, em uns 10 minutos**. O curioso é que a segunda nasceu de um cliente da primeira.

### O barbeiro japonês e a navalha

No Japão, barbearia é tão ligada ao barbear que está na lei: a Lei dos Barbeiros (理容師法) define o trabalho do barbeiro como **"o corte do cabelo, o barbear do rosto e outros meios de deixar a aparência em ordem"**.

E o barbear de lá não é só a barba. Em 2021, um repórter do site SoraNews24 foi à **Shibagaki**, em Yokohama, considerada a barbearia em estilo ocidental mais antiga do país, aberta em **1869** e tocada pela mesma família há cinco gerações. O atendimento foi assim:

1. **Corte**, com o mestre decidindo o estilo pelo formato do rosto (a maioria dos clientes deixa na mão dele).
2. **Lavagem com o cliente inclinado pra frente**, sobre a pia, porque assim o barbeiro alcança melhor a nuca.
3. **Rosto massageado com creme**, depois **toalha quente no rosto inteiro**.
4. **Espuma e navalha** no rosto, com traços firmes.
5. **Massagem nos ombros** no final, com um aparelho de vibração antigo.

Tudo levou **cerca de uma hora**.

### A rede que só corta

A **QB House** conta no próprio site como começou. O fundador, **o senhor Konishi**, frequentava uma barbearia cara antes de reuniões importantes. Um dia, com pressa, pediu o serviço "em 30 minutos" e saiu com o mesmo resultado na metade do tempo de sempre. Daí veio a pergunta: **por que pagar por barbear, lavagem e massagem quando eu só quero cortar?**

Em **novembro de 1996** abriu a primeira loja, em Kanda, Tóquio, com a ideia de **"10 minutos, 1.000 ienes"**. Algumas soluções da casa:

- **Pagamento antes, numa máquina de fichas** na entrada (a empresa diz ter sido a primeira do setor). O barbeiro não perde tempo com caixa.
- **Um "semáforo" na porta** mostra o tempo de espera: verde, amarelo ou vermelho. Ninguém precisa ligar pra perguntar.
- **Sem lavagem:** um aspirador tira os fios cortados.
- **Sem agendamento e sem escolher barbeiro:** atende na ordem de chegada.

### Quanto custa

| | Japão | Fonte |
|---|---|---|
| Corte na QB House | **¥ 1.400** (com imposto), só corte | site oficial, out/2026 |
| Tempo médio de corte na QB House | **12 min 15 s** | site oficial |
| Lojas da QB House no Japão | **612** (jun/2026), e outras em 6 países | site oficial |
| Atendimento completo na Shibagaki | cerca de **1 hora** | SoraNews24, 2021 |

### O que dá pra trazer pra sua barbearia

- **Separe o rápido do ritual.** Ofereça um "só corte" bem feito e rápido pra quem tem pressa, e um "completo" (corte, lavagem, toalha quente, barba, massagem) com preço de experiência. Cada cliente paga pelo que quer.
- **Mostre a espera.** O semáforo da QB House é simples de copiar: um aviso na porta ou no Instagram dizendo "fila agora: 2 pessoas". (O site de agendamento do Aprenda Livre tem isso pronto pra quem atende por ordem de chegada.)
- **Tire o caixa do meio do corte.** Cobrar antes, ou por Pix com QR na bancada, poupa minutos em cada cliente.
- **Toalha quente no rosto inteiro.** Custa pouco e é o momento que o cliente lembra.
- **Termine com os ombros.** Dois minutos de massagem no fim mudam a sensação do serviço inteiro.

*No próximo episódio: Turquia, onde muito homem vai ao barbeiro toda semana.*""",
"fontes": [
    {"titulo": "QB House — história da marca (誕生ストーリー)", "url": "https://www.qbhouse.co.jp/qblab/birth/"},
    {"titulo": "QB House — como funciona e preço (ご利用案内)", "url": "https://www.qbhouse.co.jp/guidance/"},
    {"titulo": "QB House — números da rede (数字で見るQB HOUSE)", "url": "https://www.qbhouse.co.jp/qblab/number/"},
    {"titulo": "e-Gov Japão — Lei dos Barbeiros (理容師法)", "url": "https://laws.e-gov.go.jp/law/322AC0000000234"},
    {"titulo": "SoraNews24 — What it's like to get a haircut at Japan's oldest barber shop (2021)", "url": "https://soranews24.com/2021/06/04/what-its-like-to-get-a-haircut-at-japans-oldest-barber-shop/"},
],
}

TURQUIA = {
"slug": "turquia-o-barbeiro-que-cuida-de-tudo",
"titulo": "Turquia: o barbeiro que cuida de tudo, da navalha à orelha",
"resumo": "Em Istambul, muito homem vai ao barbeiro toda semana. Navalha, linha, cera, massagem e conversa: o que o barbeiro turco faz e o que dá pra aprender com ele.",
"tipo": "serie",
"serie": {"nome": "Barbearias pelo mundo", "episodio": 3},
"publicadoEm": HOJE,
"tags": ["barbearia", "barbearias pelo mundo", "turquia", "atendimento"],
"conteudo": """Se tem um país onde ir ao barbeiro é hábito, é a Turquia. Segundo uma reportagem da CNN Travel de 2021, **muitos homens lá vão ao barbeiro toda semana**, e as barbearias vão da portinha de bairro ao salão caríssimo. O barbeiro turco ficou famoso no mundo inteiro, de Londres a Berlim, por um motivo: **ele não faz só a barba**.

### Um pouco de história

A mesma reportagem conta que pouco se sabe dos barbeiros turcos antes do século 16. Com o sultão **Solimão, o Magnífico** (a partir de 1520), abriram os primeiros cafés de Istambul, e os barbeiros logo combinaram com os donos de trabalhar num canto deles, ou abriram a loja ao lado. No século 19, barbeiro também **arrancava dente**: a partir de 1840, quem fazia isso tinha que passar numa prova.

O ofício é passado de **mestre (usta) pra aprendiz**. O barbeiro **Nihat Aram**, de Istambul, entrevistado pela CNN, começou aos 14 anos e lembra do mestre treinando navalha **numa bexiga cheia**, sem estourar.

### O que o barbeiro turco faz

- **Navalha com a pele esticada.** Aram ensina que o barbeiro estica a pele com os dedos pra passar nas partes difíceis do rosto. E dá uma dica pra quem está aprendendo: treinar o movimento **sem lâmina** muitas vezes antes.
- **Lâmina nova a cada cliente**, além de esterilizar o equipamento.
- **Pelos do rosto com linha ou cera.** A linha torcida, entre os dentes e as mãos, abre e fecha como tesoura e puxa os pelinhos.
- **Pelo do nariz** com cera ou aparador.
- **Pelo da orelha com fogo.** Tradicionalmente, uma vareta com álcool acesa passava rápido pela orelha. Aram diz que isso é perigoso e **hoje proibido**, porque não dá pra controlar a chama; ele usa cera ou um isqueiro, que acende e apaga na hora.
- **Massagem no rosto e nos ombros**, e uma coisa que não está no cardápio: **ouvir**. Aram diz que aprendeu a perceber se o cliente está estressado com trabalho ou com a família, e a responder a isso.

### O barbeiro como alguém de confiança

Pra Aram, a qualidade mais importante de um barbeiro é **gostar do que faz**: "Se você não ama o que faz, o resultado vai ser muito ruim". Ele fala de dedicação, compromisso e cuidado com o cliente. E lembra que confiança é tudo: afinal, um dos dois está segurando uma navalha.

### O que dá pra trazer pra sua barbearia

- **Monte um "pacote completo" de verdade:** corte, barba na navalha, sobrancelha e pelinhos (linha ou cera), nariz e orelha, toalha quente e massagem. Dê um nome e um preço fechado.
- **Mostre a higiene.** Abra a lâmina nova na frente do cliente. É rápido e passa segurança.
- **Ofereça o retorno semanal.** Pra quem gosta de barba sempre feita, um plano de "barba toda semana" vira cliente fixo.
- **Ensine como os turcos:** se você tem aprendiz, comece pela navalha sem lâmina e por exercícios simples antes de ir pro cliente.
- **Escute.** O cliente que se sente ouvido volta. Isso não custa nada.

*Atenção: fogo na orelha é proibido por lá e arriscado aqui. Se for oferecer, use cera ou aparador.*

*No próximo episódio: Nova York.*""",
"fontes": [
    {"titulo": "CNN Travel — Turkish barbers beyond beards (2021). Série patrocinada pela Turquia, com controle editorial da CNN", "url": "https://www.cnn.com/travel/article/how-to-shave-straight-razor-turkish-barber"},
],
}

for a in (MEI, JAPAO, TURQUIA):
    with open(f"{DESTINO}/{a['slug']}.json", "w", encoding="utf-8") as f:
        json.dump(a, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("ok", a["slug"])
