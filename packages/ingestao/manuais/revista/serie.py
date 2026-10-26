"""Série "Barbearias pelo mundo". Fatos conferidos nas fontes de cada episódio (ver "fontes").

Ep. 1-3 reescritos em 26/10/2026 (mesmos fatos da primeira versão, texto novo).
Ep. 4-8 novos, conferidos em 26/10/2026:
- Milão: site oficial (história, tratamentos e loja) e Case Museo de Milão.
- Lisboa: Time Out Lisboa (20/12/2023).
- Havana: Al Jazeera (21/10/2016) e OnCuba/EFE (28/12/2017).
- Roterdã: entrevista na Böker e editora De Bezige Bij (livro "Schorem").
- Los Angeles: resumo do estudo no NEJM (2018) pelo PubMed.
"""

SERIE = "Barbearias pelo mundo"


def ep(n, **kw):
    return {"tipo": "serie", "serie": {"nome": SERIE, "episodio": n}, **kw}


LONDRES = ep(1,
slug="londres-truefitt-and-hill",
titulo="Londres: a barbearia de 1805 que vende ritual, não só corte",
resumo="Na Truefitt & Hill, a mais antiga do mundo pelo Guinness, um barbear custa £ 60 e o cliente escolhe o creme e o perfume. O que esse ritual ensina pra quem atende no Brasil.",
publicadoEm="2026-10-25",
tags=["barbearia", "barbearias pelo mundo", "londres", "atendimento"],
conteudo="""Na St James's Street, em Londres, um barbear com toalha quente custa £ 60 e leva meia hora. O preço assusta, mas a casa está de portas abertas desde 1805 e aparece no Guinness como a barbearia mais antiga do mundo. Vale olhar de perto o que a Truefitt & Hill vende, porque não é só a barba feita.

### Dois séculos, três endereços

William Francis Truefitt abriu a barbearia em 1805 e se apresentava como cabeleireiro da Corte. O primeiro Royal Warrant, o selo de fornecedor oficial da família real britânica, veio do rei George III. Em 1911, Edwin Hill abriu a dele na Old Bond Street; em 1935, H. P. Truefitt, sobrinho do fundador, se mudou pra lá e as duas viraram a Truefitt & Hill. Desde 1994 a casa fica no número 71 da St James's Street.

A revista MR PORTER faz uma ressalva honesta: o endereço atual tem trinta e poucos anos. O que atravessou dois séculos foi o nome e o jeito de atender. Entre os clientes famosos que a história da casa costuma citar estão Winston Churchill, Charles Dickens, Frank Sinatra e John Wayne, além da família real. Hoje há unidades no Canadá, nos Estados Unidos, na Austrália, na Índia e na Tailândia.

### Como é o barbear de £ 60

Pela descrição da própria casa, o serviço tem cinco tempos:

1. Cliente novo começa com uma conversa sobre a rotina de barbear dele.
2. Óleo pré-barba e toalha quente.
3. O cliente escolhe o creme de barbear entre vários.
4. O barbear, com um *Master Barber*.
5. Bálsamo no fim e um perfume, também à escolha.

Repare quantas vezes o cliente decide alguma coisa. Ele não está só sendo atendido, está participando, e é disso que a gente lembra depois. No corte a lógica se repete: lavagem com condicionador, fricção no couro cabeludo e, no fim, o barbeiro diz quais produtos usar em casa.

### O cardápio

Preços publicados no site oficial da unidade de St James's (outubro de 2026):

| Serviço | Preço | Tempo |
|---|---:|---:|
| Corte e lavagem | £ 60 | 30 min |
| Barbear tradicional com toalha quente | £ 60 | 30 min |
| Aparar barba e bigode, com barbear | £ 60 | 30 min |
| Massagem no couro cabeludo, lavagem e corte | £ 120 | 60 min |
| Aula de barbear tradicional | £ 120 | 30 min |
| Grooming Experience (corte, barbear e manicure) | £ 165 | 60 min |
| Ultimate Grooming Experience (com limpeza de pele) | £ 225 | 90 min |

Duas coisas saltam da tabela. O tempo aparece do lado do preço, então o cliente sabe exatamente o que está comprando. E existe uma aula: a casa cobra o mesmo que um corte longo pra ensinar o cliente a se barbear sozinho.

### O que dá pra trazer pra sua barbearia

**Comece com uma pergunta.** "Como você cuida da barba em casa?" leva dois minutos, não custa nada e muda a sensação do serviço inteiro: o cliente percebe que o atendimento foi pensado pra ele.

Deixe o cliente escolher alguma coisa. Duas opções de pós-barba, ou de perfume no final, já bastam. Quem escolhe lembra, e quem lembra conta pros amigos.

Escreva o tempo junto com o preço. "Barba completa, 30 minutos" ajuda o cliente a entender o valor e ajuda você a montar a agenda sem atraso.

Dê nome a um pacote. Conta de exemplo: se o corte sai a R$ 40 e a barba a R$ 30, um "Completo" com toalha quente e cinco minutos de massagem por R$ 85 vale mais pro cliente do que os R$ 70 separados, e os R$ 15 a mais pagam o tempo extra.

Ensine. Uma aula curta de "como manter a barba em casa" pode virar serviço pago ou, no mínimo, um motivo a mais pro cliente voltar.

A Truefitt & Hill não durou dois séculos por cortar melhor que todo mundo. Durou porque o cliente sai de lá com uma história pra contar, e isso cabe em qualquer cadeira.

*No próximo episódio: Japão, onde a mesma rua tem o barbear mais caprichado do mundo e o corte de 10 minutos.*""",
fontes=[
    {"titulo": "Truefitt & Hill — serviços da barbearia (site oficial)", "url": "https://www.truefittandhill.co.uk/collections/barbershop"},
    {"titulo": "Truefitt & Hill — Wikipedia (inglês)", "url": "https://en.wikipedia.org/wiki/Truefitt_%26_Hill"},
    {"titulo": "MR PORTER — Inside The Oldest Barbers In The World", "url": "https://www.mrporter.com/en-mx/journal/lifestyle/inside-the-oldest-barbers-in-the-world-534376"},
])


JAPAO = ep(2,
slug="japao-barbear-de-ritual-e-corte-de-10-minutos",
titulo="Japão: o barbear mais caprichado do mundo e o corte de 10 minutos",
resumo="No mesmo país convivem a barbearia de bairro que faz o rosto inteiro na navalha e uma rede que só corta, em 10 minutos, por ¥ 1.400. As duas ensinam algo.",
publicadoEm="2026-10-26",
tags=["barbearia", "barbearias pelo mundo", "japão", "atendimento"],
conteudo="""Em Yokohama, um repórter sentou numa cadeira de barbeiro e só levantou uma hora depois, com o rosto inteiro barbeado na navalha e os ombros massageados. Em Tóquio, numa loja de uma rede, o corte médio leva 12 minutos e não tem lavagem. O Japão tem os dois extremos da barbearia, e o mais curioso é que a rede rápida nasceu da pressa de um cliente de barbearia cara.

### O barbeiro japonês e a navalha

No Japão, o barbear está na definição legal da profissão. A Lei dos Barbeiros diz que o trabalho do barbeiro é "o corte do cabelo, o barbear do rosto e outros meios de deixar a aparência em ordem". E o barbear de lá vai além da barba: é o rosto todo.

Em 2021, o site SoraNews24 mandou um repórter à Shibagaki, em Yokohama, apontada como a barbearia de estilo ocidental mais antiga do país. Aberta em 1869, está com a mesma família há cinco gerações. O atendimento seguiu esta ordem:

1. Corte, com o mestre escolhendo o estilo pelo formato do rosto. A maioria dos clientes deixa na mão dele.
2. Lavagem com o cliente inclinado pra frente, sobre a pia, porque assim o barbeiro alcança melhor a nuca.
3. Creme massageado no rosto e toalha quente no rosto inteiro.
4. Espuma e navalha, com traços firmes.
5. Massagem nos ombros, com um aparelho de vibração antigo.

Uma hora, do começo ao fim. É o tipo de serviço que o cliente agenda porque quer, não porque precisa.

### A rede que só corta

A QB House conta a própria origem no site. O fundador, o senhor Konishi, frequentava uma barbearia cara antes de reuniões importantes. Um dia, com pressa, pediu o serviço em 30 minutos e saiu com o mesmo resultado, na metade do tempo de sempre. Ficou a pergunta: por que pagar por barbear, lavagem e massagem quando eu só quero cortar o cabelo?

A primeira loja abriu em novembro de 1996, em Kanda, Tóquio, com a promessa de "10 minutos, 1.000 ienes". O jeito de trabalhar foi todo desenhado pra não perder tempo. O cliente paga antes, numa máquina de fichas na entrada, e o barbeiro nunca mexe com dinheiro. Na porta, uma espécie de semáforo mostra se a espera está curta, média ou longa, então ninguém precisa ligar pra perguntar. Não tem lavagem: um aspirador tira os fios cortados. E não tem agendamento nem escolha de barbeiro, é ordem de chegada.

| | Japão | Fonte |
|---|---|---|
| Corte na QB House | ¥ 1.400 com imposto, só corte | site oficial, out/2026 |
| Tempo médio de corte | 12 min 15 s | site oficial |
| Lojas no Japão | 612 (jun/2026), além de outros 6 países | site oficial |
| Atendimento completo na Shibagaki | cerca de 1 hora | SoraNews24, 2021 |

### O que dá pra trazer pra sua barbearia

**Separe o rápido do ritual.** Um "só corte" bem feito e pontual pra quem tem pressa, e um "completo" com lavagem, toalha quente, barba e massagem, com preço de experiência. Cada cliente paga pelo que quer, e você para de dar de graça o que alguns nem pediram.

Mostre a espera. O semáforo da QB House se copia com um aviso na porta ou no status do WhatsApp: "fila agora: 2 pessoas". O cliente decide se vem agora ou mais tarde, em vez de chegar e desistir. Quem usa o site do Aprenda Livre tem isso pronto, pra quem atende por ordem de chegada.

Tire o caixa do meio do corte. Cobrar antes, ou deixar o QR do Pix na bancada, economiza tempo em cada cliente. Conta de exemplo: um minuto e meio a menos por cliente, num sábado com 20, devolve meia hora de agenda.

Toalha quente no rosto inteiro e dois minutos de massagem nos ombros no fim custam quase nada e são exatamente as partes que o cliente lembra.

O Japão mostra que não existe um jeito certo de atender, existem clientes diferentes. A barbearia que deixa isso claro no cardápio atende os dois sem se atrapalhar.

*No próximo episódio: Turquia, onde muito homem vai ao barbeiro toda semana.*""",
fontes=[
    {"titulo": "QB House — como a rede nasceu (site oficial)", "url": "https://www.qbhouse.co.jp/qblab/birth/"},
    {"titulo": "QB House — como funciona (site oficial)", "url": "https://www.qbhouse.co.jp/guidance/"},
    {"titulo": "QB House — números da rede (site oficial)", "url": "https://www.qbhouse.co.jp/qblab/number/"},
    {"titulo": "Japão — Lei dos Barbeiros (e-Gov)", "url": "https://laws.e-gov.go.jp/law/322AC0000000234"},
    {"titulo": "SoraNews24 — What it's like to get a haircut at Japan's oldest barber shop (2021)", "url": "https://soranews24.com/2021/06/04/what-its-like-to-get-a-haircut-at-japans-oldest-barber-shop/"},
])


TURQUIA = ep(3,
slug="turquia-o-barbeiro-que-cuida-de-tudo",
titulo="Turquia: o barbeiro que cuida de tudo, da navalha à orelha",
resumo="Em Istambul, muito homem vai ao barbeiro toda semana. Navalha, linha, cera, massagem e conversa: o que o barbeiro turco faz e o que dá pra aprender com ele.",
publicadoEm="2026-10-26",
tags=["barbearia", "barbearias pelo mundo", "turquia", "atendimento"],
conteudo="""O barbeiro Nihat Aram começou aos 14 anos, em Istambul, e lembra do primeiro treino: o mestre passava a navalha numa bexiga cheia, sem estourar, e ele tinha que fazer igual. É assim que o ofício anda na Turquia, de mestre (*usta*) pra aprendiz, num país onde, segundo uma reportagem da CNN Travel de 2021, muito homem vai ao barbeiro toda semana.

### Barbearia ao lado do café

Pouco se sabe dos barbeiros turcos antes do século 16. Com o sultão Solimão, o Magnífico, a partir de 1520, abriram os primeiros cafés de Istambul, e os barbeiros logo se acertaram com os donos pra trabalhar num canto deles ou abrir a loja ao lado. Faz sentido: os dois são lugares onde o homem senta, espera e conversa.

No século 19, o barbeiro também arrancava dente. A partir de 1840, quem fazia isso precisava passar numa prova. A mesma história, aliás, aconteceu no Brasil, como contamos em [barbeiros sangradores](/revista/barbeiros-sangradores-no-brasil-imperial).

### O que o barbeiro turco faz

O barbeiro turco ficou famoso no mundo inteiro, de Londres a Berlim, por um motivo: ele não faz só a barba. Na navalha, estica a pele com os dedos pra passar nas partes difíceis do rosto, e Aram dá uma dica pra quem está aprendendo: repetir o movimento muitas vezes sem lâmina antes de ir pro cliente. A lâmina é nova a cada cliente, e o resto do equipamento é esterilizado.

Os pelinhos do rosto saem com linha ou cera. A linha torcida, presa entre os dentes e as mãos, abre e fecha como tesoura e arranca os fios. O nariz é na cera ou no aparador. E a orelha tem uma tradição famosa: uma vareta com álcool acesa passava rápido pra queimar os pelos. Aram diz que isso é perigoso e hoje proibido lá, porque não dá pra controlar a chama; ele usa cera ou um isqueiro, que acende e apaga na hora.

No fim vem a massagem no rosto e nos ombros. E vem uma coisa que não está no cardápio: ouvir. Aram conta que aprendeu a perceber quando o cliente chega estressado com o trabalho ou com a família, e a responder a isso.

### Confiança antes da técnica

Perguntado sobre a qualidade mais importante de um barbeiro, Aram não falou de técnica. Falou de gostar do que faz: "Se você não ama o que faz, o resultado vai ser muito ruim". E lembrou que, nessa profissão, confiança é tudo. Afinal, um dos dois está segurando uma navalha.

### O que dá pra trazer pra sua barbearia

**Monte um "pacote completo" de verdade:** corte, barba na navalha, sobrancelha e pelinhos na linha ou na cera, nariz e orelha, toalha quente e massagem. Com nome e preço fechado, ele vira o serviço que o cliente dá de presente no aniversário do pai.

Abra a lâmina nova na frente do cliente. Leva três segundos e passa mais segurança do que qualquer placa de "higiene garantida".

Ofereça a barba semanal. Pra quem gosta de barba sempre feita, um plano de "barba toda semana" com preço mensal vira cliente fixo e agenda previsível.

Se você tem aprendiz, faça como os turcos: movimento sem lâmina, muitas vezes, antes de chegar perto de um rosto.

E escute. Cliente que se sente ouvido volta, e isso não custa nada.

*Um aviso: fogo na orelha é proibido por lá e arriscado aqui. Se for oferecer, use cera ou aparador.*

O barbeiro turco mostra que o serviço completo não é uma lista de procedimentos. É a sensação de sair da cadeira cuidado da cabeça aos ombros, por alguém de confiança.

*No próximo episódio: Milão, a barbearia que sobreviveu a uma guerra e virou marca.*""",
fontes=[
    {"titulo": "CNN Travel — How to shave with a straight razor, according to a Turkish barber (2021)", "url": "https://www.cnn.com/travel/article/how-to-shave-straight-razor-turkish-barber"},
])


MILAO = ep(4,
slug="milao-antica-barbieria-colla",
titulo="Milão: a barbearia de 1904 que sobreviveu à guerra e virou marca",
resumo="A Antica Barbieria Colla foi destruída por bombas em 1943 e reabriu no ano seguinte com um funcionário só. Hoje vende sabonete de barbear a € 37. O que ela ensina sobre método e produto.",
publicadoEm="2026-10-26",
tags=["barbearia", "barbearias pelo mundo", "itália", "produtos"],
conteudo="""Em 1943, as bombas que caíram sobre Milão destruíram uma barbearia na frente do Teatro alla Scala. No ano seguinte, ela reabriu em outro endereço com um único funcionário. Mais de oitenta anos depois, a Antica Barbieria Colla continua lá, na Via Gerolamo Morone, e o creme de barbear que ela usa na cadeira é vendido pelo site por € 61.

### Quatro donos em 120 anos

A casa foi aberta em 1904 por Dino Colla, primeiro na Via Manzoni e logo depois na frente do Scala. Há uma curiosidade nas fontes: o roteiro de casas-museu de Milão diz que Colla era barbeiro formado em Ferrara; o site da própria barbearia diz que ele nem era barbeiro, e sim um empreendedor que quis criar um espaço discreto, só pra cuidar dos homens. De um jeito ou de outro, virou ponto de encontro de senhores da cidade.

Depois da guerra veio a sequência que explica por que a casa durou. Colla comandou até 1949. Guido Mantovanini, o funcionário que reabriu as portas em 1944, assumiu até 1975. Franco Bompieri, mestre barbeiro e escritor, ficou de 1975 a 2018 e ajudou a divulgar a barbearia clássica italiana. Desde 2019, quem toca é a filha dele, Francesca Bompieri.

Cada um deixou alguma coisa. A última grande novidade foi de Francesca: uma linha de produtos com as fórmulas que a casa sempre usou nos atendimentos.

### O barbear em 25 minutos

O site descreve o "Metodo" passo a passo, e dá pra ver que nada é por acaso. O barbear dura cerca de 25 minutos, com navalha descartável estéril:

1. Massagem com creme pré-barba.
2. Pano quente pra relaxar a pele.
3. Sabão em creme montado com pincel de cerda natural, aplicado em movimentos circulares.
4. A navalha.
5. Pós-barba, e o pano quente outra vez.
6. Massagem final com leite pós-barba ou, se o cliente pedir, colônia.

Na barba, a sessão de 30 minutos começa com o barbeiro observando a barba, o bigode, a pele e os traços do rosto antes de pegar a tesoura. No cabelo, o fim é sempre o mesmo: algumas gotas da loção mais famosa da casa, de pimenta e mentol, massageada no couro cabeludo.

### Quanto custa

O site não publica o preço dos serviços. Publica o dos produtos, que são o outro lado do negócio (outubro de 2026):

| Produto | Preço |
|---|---:|
| Sabonete de barbear | € 37 |
| Shampoo | € 39 |
| Creme pré-barba | € 49 |
| Creme de barbear | € 61 |
| Loção de pimenta e mentol | € 73 |
| Pós-barba | € 75 |
| Colônia | € 120 |

### O que dá pra trazer pra sua barbearia

**O produto da cadeira vende sozinho.** O cliente sente o cheiro do pós-barba no rosto e pergunta qual é. Você não precisa ter marca própria pra aproveitar isso: escolha uma pomada, um óleo e um pós-barba que você confia, use sempre os mesmos e deixe à venda no balcão. Conta de exemplo: comprando a R$ 25 e vendendo a R$ 45, dez potes por mês dão R$ 200 sem ocupar um minuto de agenda.

Dê nome ao seu jeito de fazer. A Colla chama de "Metodo". Escreva em cinco passos como é a sua barba completa e coloque no Instagram. Isso transforma "fazer a barba" em um serviço que tem dono.

Pano quente duas vezes, antes e depois da navalha. É barato e é o que diferencia o serviço do barbear de casa.

Pense em quem continua. A Colla passou por quatro pessoas em 120 anos e não fechou. Se você tem um funcionário de confiança, ensine o jeito da casa, não só a técnica.

E reabra. A barbearia perdeu tudo numa guerra e voltou no ano seguinte com uma pessoa só. Poucas crises chegam perto disso.

*No próximo episódio: Lisboa, a barbearia de Fernando Pessoa que fechou por causa do aluguel.*""",
fontes=[
    {"titulo": "Antica Barbieria Colla — La nostra storia (site oficial)", "url": "https://www.anticabarbieriacolla.com/la-bottega/la-nostra-storia/"},
    {"titulo": "Antica Barbieria Colla — Rasatura (site oficial)", "url": "https://www.anticabarbieriacolla.com/trattamenti/rasatura/"},
    {"titulo": "Antica Barbieria Colla — Barba (site oficial)", "url": "https://www.anticabarbieriacolla.com/trattamenti/barba/"},
    {"titulo": "Antica Barbieria Colla — Capelli (site oficial)", "url": "https://www.anticabarbieriacolla.com/trattamenti/capelli/"},
    {"titulo": "Case Museo di Milano — Antica Barbieria Colla", "url": "https://percorsi.casemuseo.it/luogo/antica-barbieria-colla/?lang=en"},
])


LISBOA = ep(5,
slug="lisboa-barbearia-campos",
titulo="Lisboa: a barbearia de Fernando Pessoa que fechou por causa do aluguel",
resumo="A Barbearia Campos atendeu Eça de Queiroz e Fernando Pessoa e era a mais antiga de Portugal em atividade. Fechou em 2023, quando o aluguel chegou a € 2.900. A lição é sobre o ponto.",
publicadoEm="2026-10-26",
tags=["barbearia", "barbearias pelo mundo", "portugal", "gestão", "aluguel"],
conteudo="""No número 4 do Largo do Chiado, em Lisboa, a fachada ainda dizia "Cabelleireiro", com dois L, quando a Barbearia Campos entregou as chaves em dezembro de 2023. Ali tinham sentado Fernando Pessoa e Eça de Queiroz. Era a barbearia mais antiga de Portugal em atividade. O que fechou a porta foi o aluguel.

### Uma cadeira na história da cidade

A data que a casa usava, 1886, é a de uma apólice de seguro que ficava pendurada na parede, o documento mais antigo que ela tinha. Desde 1910 a barbearia estava nas mãos da família do sócio-fundador, José Augusto de Campos. A clientela é uma lista de rua com nome: além de Pessoa e Eça, Ramalho Ortigão, Aquilino Ribeiro, Almada Negreiros, António Ferro e o ator Vasco Santana. Boa parte também frequentava o café vizinho, A Brasileira, das tertúlias e da poesia.

Em 2016, o prédio foi reformado pelos novos donos, a empresa Coporgest, que abriu apartamentos turísticos no edifício. A barbearia voltou ao Chiado com cara nova, mas manteve a bancada e os lavatórios de mármore de Carrara, os móveis clássicos, a navalha e as fotografias de outro século. Já tinha o selo "Lojas com História", da Câmara Municipal de Lisboa, criado pra proteger estabelecimentos tradicionais.

### A conta que não fechou

A Time Out Lisboa reconstruiu a história do contrato. Com a mudança de dono do prédio, a barbearia assinou um aluguel de € 1.000 por mês, com reajuste todo ano. Os aumentos foram somando até chegar a € 2.900 em julho de 2023, quase o triplo do começo. Segundo a proprietária, a última renda paga foi a de julho de 2023, e já havia dívidas antes disso. O contrato terminou por falta de pagamento, e a própria barbearia devolveu as chaves.

No lugar, segundo a proprietária, entraria uma loja de artesanato português. Selo de loja histórica, clientes ilustres e mármore de Carrara não pagam o aluguel.

### O que dá pra trazer pra sua barbearia

**Leia o reajuste antes de assinar.** Pergunte qual índice corrige o aluguel e faça a conta de cinco anos, não só do primeiro mês. Um aumento que parece pequeno no ano um vira outro negócio no ano cinco.

Saiba quanto o aluguel pesa no faturamento. Conta de exemplo: se a barbearia fatura R$ 15 mil por mês e o aluguel é R$ 2.500, ele come 17% de tudo que entra. Acompanhe esse número todo ano; quando ele sobe muito, é hora de renegociar ou de pensar em outro ponto, antes de atrasar.

Conheça seu direito de renovar. No Brasil, o artigo 51 da Lei do Inquilinato garante a renovação do aluguel comercial quando três coisas se somam: contrato escrito e com prazo determinado, cinco anos ou mais de contrato (somando os seguidos) e três anos sem parar no mesmo ramo. A ação tem prazo certo: entre um ano e seis meses antes do fim do contrato. Passou disso, perde o direito. Converse com um advogado com antecedência.

Não espere a dívida crescer. Segundo a proprietária, a Campos acumulou meses de atraso e parou de responder às ligações. Negociar com o aluguel em dia é muito mais fácil do que com três meses atrasados.

E guarde a história com você. Fotos antigas, a cadeira do avô, a primeira nota fiscal: tudo isso vai junto se um dia você precisar mudar de endereço. A clientela segue a barbearia, não o ponto.

*No próximo episódio: Havana, onde um barbeiro transformou a rua mais feia da cidade.*

*Este episódio fala de contrato e de lei; não é orientação jurídica. Antes de assinar ou renovar, fale com um advogado.*""",
fontes=[
    {"titulo": "Time Out Lisboa — Lisboa perde barbearia histórica, por onde passaram Eça e Pessoa (20/12/2023)", "url": "https://www.timeout.pt/lisboa/pt/noticias/lisboa-perde-barbearia-historica-por-onde-passaram-eca-e-pessoa-122023"},
    {"titulo": "Lei nº 8.245/1991 (Lei do Inquilinato), art. 51 — texto atualizado na Câmara dos Deputados", "url": "https://www2.camara.leg.br/legin/fed/lei/1991/lei-8245-18-outubro-1991-322506-normaatualizada-pl.html"},
])


HAVANA = ep(6,
slug="havana-callejon-de-los-peluqueros",
titulo="Havana: o barbeiro que transformou a rua mais feia da cidade",
resumo="Papito abriu uma barbearia em 1999 e fez da rua dele, em Havana Velha, o Callejón de los Peluqueros: escola, museu, corte grátis todo 27 de dezembro e vizinhos ganhando junto.",
publicadoEm="2026-10-26",
tags=["barbearia", "barbearias pelo mundo", "cuba", "comunidade"],
conteudo="""Todo 27 de dezembro, desde 2005, barbeiros e cabeleireiros montam cadeiras na rua Aguiar, em Havana Velha, e cortam o cabelo de quem aparecer, de graça, com música. A festa é o dia da profissão em Cuba, e quem inventou foi Gilberto Valladares, o Papito, um cabeleireiro que um dia olhou pra própria rua e achou que dava pra fazer mais do que cortar cabelo nela.

### A rua mais feia de Havana Velha

Papito começou a trabalhar com cabelo em 1999, no salão que chamou de Arte Corte. Ao mesmo tempo, começou a colecionar tesouras antigas, navalhas, pincéis, caixas registradoras e sofás do começo do século 20. Em pouco tempo, a barbearia era também um museu.

Ele contou à Al Jazeera, em 2016, que a rua dele era "a mais feia de toda a Havana Velha". Um dia encontrou na calçada o historiador da cidade, Eusebio Leal, e apresentou a ideia ali mesmo. Leal olhou pra ele alguns segundos e perguntou: "Do que você precisa?". A rua, de uns 100 metros, foi repavimentada, as fachadas antigas foram restauradas e ganharam obras de arte sobre o ofício. Em seis anos, virou o Callejón de los Peluqueros, o Beco dos Cabeleireiros.

### Quando a barbearia puxa o bairro

O projeto não parou na fachada. Papito abriu uma escola de cabeleireiro e barbeiro pra jovens do bairro que não estudavam nem trabalhavam; alguns acabaram contratados em salões de navios de cruzeiro. Depois fez um acordo com a associação de surdos pra formar meninas com deficiência auditiva, que viraram a maior parte da turma, com a promessa de que, formadas, ensinariam o ofício de graça a outros surdos.

Com o movimento, os vizinhos abriram cafés, lojinhas de artesanato, restaurantes e pousadas. "Todo mundo no beco viu a renda subir", disse Papito. Os negócios se ajudam: na época da reportagem, eles preparavam uma pulseira que daria 15% de desconto em todas as lojas da rua pros turistas hospedados ali.

No dia 27 de dezembro, além do corte grátis, o projeto entrega um prêmio com o nome de Juan Gómez, o primeiro barbeiro e cirurgião a receber licença pra trabalhar em Havana, em 1552. Em 2017, Papito pediu a barbeiros do mundo inteiro que mandassem tesouras pra uma escultura de tesoura gigante na rua, que já tinha 350, vindas do Japão, dos Estados Unidos, da Espanha, da França, da Holanda e da América Latina.

### O que dá pra trazer pra sua barbearia

**Faça amizade comercial com os vizinhos.** A lanchonete, a loja de roupa e a barbearia atendem o mesmo cliente. Um cartão de "mostrou o comprovante daqui, ganhou desconto ali" custa pouco e faz o cliente circular pela rua.

Tenha um dia por ano. Pode ser o Dia do Cliente, o aniversário da barbearia ou um sábado de corte solidário pra crianças antes da volta às aulas. Uma data fixa vira tradição, e tradição vira notícia no jornal da cidade.

Conte a história nas paredes. Uma navalha antiga, a primeira máquina, a foto do primeiro cliente. A Arte Corte virou museu sem querer, e é por isso que turista entra pra fotografar.

Ensine alguém. Formar um aprendiz do bairro resolve sua falta de mão de obra e deixa o bairro do seu lado.

Papito poderia ter ficado só com o salão. Preferiu melhorar a rua inteira, e a rua inteira passou a trabalhar junto com ele.

*No próximo episódio: Roterdã, a barbearia que só tem 12 cortes no cardápio.*""",
fontes=[
    {"titulo": "Al Jazeera — Meet Papito, the 'Daddy' of hairdressing in Havana (21/10/2016)", "url": "https://www.aljazeera.com/features/2016/10/21/meet-papito-the-daddy-of-hairdressing-in-havana"},
    {"titulo": "OnCuba News / EFE — Corte de pelo gratis en La Habana Vieja (28/12/2017)", "url": "https://oncubanews.com/cuba/corte-pelo-gratis-la-habana-vieja"},
])


ROTERDA = ep(7,
slug="roterda-schorem",
titulo="Roterdã: a barbearia com 12 cortes no cardápio e fila desde as 6 da manhã",
resumo="A Schorem abriu em 2011 sem agendamento e com só 12 cortes pra escolher. Duas semanas depois, a espera era de cinco horas. Como um cardápio curto e um jeito próprio viraram fama.",
publicadoEm="2026-10-26",
tags=["barbearia", "barbearias pelo mundo", "holanda", "identidade"],
conteudo="""A Schorem abre às 10 da manhã. Em alguns dias, segundo uma reportagem da fabricante de navalhas Böker, tem gente na fila desde as 6. Duas semanas depois da inauguração, em Roterdã, a espera já chegava a cinco horas, e a barbearia continua sem agendamento até hoje. O curioso é o motivo da fila: uma barbearia que deixa o cliente escolher entre só 12 cortes.

### Dois sócios opostos

Bertus e Leen se conheceram em 1995, em Maastricht, no sul da Holanda, onde Leen e o irmão tinham uma barbearia, a Saloon Maastricht. Bertus apareceu procurando emprego, não tinha vaga, mas os dois viraram amigos. A editora do livro que conta a história deles os descreve como "opostos": Leen descobriu cedo que gostava de negócio e abriu filiais de uma rede de cabeleireiros; Bertus viveu sozinho desde os 16 e se apaixonou pelo ofício e pelo rock'n'roll.

Em 2011 abriram a Schorem, na Nieuwe Binnenweg. Durante a reforma, ninguém sabia o que seria a loja: as janelas estavam cobertas de papel e já havia uma placa só pra homens, provocação que fez a cidade falar da barbearia antes de ela abrir.

### Doze cortes, nenhum agendamento

A editora resume a ideia: um lugar pra homem ficar à vontade, "uma segunda casa", onde dá pra escolher entre doze cortes. Os cortes viraram dois pôsteres, "Signature Haircuts" e "Barbershop Classics", que servem de inspiração e de guia pra barbeiros do mundo inteiro.

Eles também nunca guardaram segredo. Os tutoriais de cortes clássicos estão no YouTube e, quando a procura por curso cresceu, abriram a Old School Barber Academy do outro lado da rua. Bertus diz que a Schorem sempre foi "um negócio transparente, sem segredos".

Depois veio o produto. A pomada Reuzel, com a lata de porquinho, é vendida em 85 países, segundo a editora. Repare na ordem: primeiro a barbearia ficou famosa, depois a marca.

### O que move a casa

Na entrevista à Böker, Bertus resume a regra deles em uma frase: "cliente satisfeito e funcionário satisfeito". E fala de respeito: na barbearia, todo mundo vale o mesmo, não importa quanto ganha. Isso some na porta.

Uma observação nossa: a regra de só atender homem é deles e combina com o estilo deles. Não é o que estamos sugerindo. O que vale copiar é a clareza.

### O que dá pra trazer pra sua barbearia

**Encurte o cardápio.** Escolha os cortes que você faz melhor e mais rápido, dê nome a cada um e mostre numa foto. Cliente que escolhe por foto decide em segundos, e você trabalha no que domina.

Ponha o cardápio na parede. Um pôster com seus 8 ou 12 cortes, com nome, ajuda quem tem vergonha de explicar o que quer e evita o "faz o de sempre" que vira reclamação.

Tenha um jeito que se reconhece de longe. Na Schorem, o nome, a placa, os pôsteres e a lata de pomada contam a mesma história. Não precisa ser o mesmo estilo: precisa ser o seu, sempre igual.

Ensine em público. Um vídeo curto por semana mostrando um acabamento traz cliente e respeito de colega.

Produto vem depois. Antes de pensar em pomada com seu nome, faça a barbearia ser lembrada. Quando ela for, o produto vende junto.

A Schorem prova que limitar pode ser a melhor forma de crescer: menos opções, mais identidade, e um cliente que sabe exatamente o que vai encontrar.

*No próximo episódio: Los Angeles, onde barbearias ajudaram a baixar a pressão dos clientes.*""",
fontes=[
    {"titulo": "Böker — Barber Story: Schorem Rotterdam (entrevista com Leen e Bertus)", "url": "https://boker.de/en/blogs/news/barber-story-schorem-rotterdam"},
    {"titulo": "De Bezige Bij — Floor Boogaart, \"Schorem\" (direitos estrangeiros)", "url": "https://foreignrights.debezigebij.nl/foreignrights/authors/floor-boogaart/floor-boogaart-schorem/"},
])


LOS_ANGELES = ep(8,
slug="los-angeles-barbearia-e-pressao-alta",
titulo="Los Angeles: as barbearias que ajudaram a baixar a pressão dos clientes",
resumo="Num estudo publicado no NEJM, barbeiros de 52 barbearias incentivaram clientes com pressão alta a se tratar. Em seis meses, a pressão caiu em média 27 pontos. Cadeira também é lugar de confiança.",
publicadoEm="2026-10-26",
tags=["barbearia", "barbearias pelo mundo", "estados unidos", "saúde", "comunidade"],
conteudo="""Em 52 barbearias de Los Angeles, o barbeiro virou aliado do médico. Fazia parte de um estudo publicado em 2018 no *New England Journal of Medicine*, uma das revistas de medicina mais respeitadas do mundo, e o resultado surpreendeu: com o empurrão de quem corta o cabelo deles todo mês, clientes com pressão alta descontrolada chegaram à pressão normal.

### O estudo

Pesquisadores do Cedars-Sinai, um grande hospital de Los Angeles, chamaram 52 barbearias de donos negros da região. Nelas, convidaram 319 clientes, homens negros com a pressão sistólica (a "máxima") em 14 ou mais, ou seja, alta e sem controle. Homens negros têm muita pressão alta nos Estados Unidos e pouca presença nos estudos feitos em hospital; a ideia era ir onde eles já estão, com quem eles já confiam.

As barbearias foram sorteadas em dois grupos. Num deles, os barbeiros incentivavam os clientes a conversar, ali mesmo na barbearia, com farmacêuticos treinados que podiam receitar remédio em acordo com o médico de cada um. No outro, os barbeiros incentivavam mudança de hábitos e consulta com o médico.

### O resultado

Em seis meses, no grupo com farmacêutico na barbearia, a pressão máxima caiu em média 27 pontos (de 152,8 pra 125,8 mm Hg). No outro grupo, caiu 9,3. A pressão abaixo de 13 por 8 foi alcançada por 63,6% dos clientes do primeiro grupo e por 11,7% do segundo. No grupo do farmacêutico, 95% dos participantes ficaram até o fim, uma taxa difícil de conseguir.

Os pesquisadores concluem que o incentivo do barbeiro, somado ao acompanhamento do remédio, deu uma queda maior de pressão. Repare num detalhe: até no grupo em que o barbeiro "só" conversou e mandou procurar o médico, a pressão caiu.

### Por que funcionou na barbearia

Cliente fiel vai à barbearia todo mês, às vezes por anos. Senta, conversa, confia. Poucos lugares têm essa frequência e essa intimidade com homens que quase nunca vão ao médico. O estudo usou isso a favor da saúde.

### O que dá pra trazer pra sua barbearia

**A sua cadeira é lugar de confiança. Use com cuidado.** Você não é médico e não deve diagnosticar nada. Mas um "você tem ido ao médico?" no meio da conversa, vindo de quem o cliente conhece há anos, pesa.

Abra a porta pra saúde uma vez por ano. Em novembro, o Novembro Azul fala da saúde do homem no Brasil inteiro. Converse com a UBS do bairro ou com um curso de enfermagem da cidade sobre um sábado de medição de pressão na barbearia, feita por quem é da área. Contamos a origem da campanha em [Movember e Novembro Azul](/revista/movember-e-novembro-azul).

Tenha informação certa à mão. Um cartaz com o endereço da UBS mais próxima e o horário de atendimento ajuda mais do que qualquer conselho.

Respeite o limite. Nada de vender remédio, chá ou suplemento. O papel do barbeiro no estudo foi incentivar; o tratamento ficou com quem é da saúde.

Uma barbearia não cura ninguém. Mas o estudo mostrou que ela pode ser o empurrão que faltava, e isso é um tipo de cuidado com o cliente que nenhum concorrente copia.

*A série continua: mais barbearias pelo mundo em breve.*""",
fontes=[
    {"titulo": "Victor RG et al. — A Cluster-Randomized Trial of Blood-Pressure Reduction in Black Barbershops. N Engl J Med 2018 (PubMed)", "url": "https://pubmed.ncbi.nlm.nih.gov/29527973/"},
])


ARTIGOS = [LONDRES, JAPAO, TURQUIA, MILAO, LISBOA, HAVANA, ROTERDA, LOS_ANGELES]
