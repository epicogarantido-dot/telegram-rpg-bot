"""Matérias "Curiosidade" da Revista. Fatos conferidos em 26/10/2026 nas fontes de cada uma.

- Poste: RCP Edimburgo (2026), Snopes (2023), Worshipful Company of Barbers (reescrita).
- Imposto da barba: Futility Closet, The Orkney News, E-Sylum (Numismatic Bibliomania Society).
  As fontes divergem no ano (1698 x 1705) e na taxa do camponês; o texto mostra as versões.
- Sangradores: Revista da ABPN (Pimenta e Dantas, 2014) e Pesquisa FAPESP.
- Gillette: Lemelson-MIT e Pennsylvania Military Museum.
- Quarteto de barbearia: Carnegie Hall, Timeline of African American Music.
- Movember e Novembro Azul: site do Movember e Meio & Mensagem (entrevista com Marlene Oliveira).
- Cadeira: The Ringling (museu), ficha da cadeira Koken.
"""


def cur(**kw):
    return {"tipo": "curiosidade", **kw}


POSTE = cur(
slug="por-que-o-poste-da-barbearia-e-listrado",
titulo="Por que o poste da barbearia é listrado de vermelho e branco",
resumo="Barbeiro já foi cirurgião, tirava sangue e arrancava dente. O poste listrado na porta é o que sobrou dessa história, e ela rende uma boa conversa na cadeira.",
publicadoEm="2026-10-26",
tags=["barbearia", "curiosidade", "história"],
conteudo="""O poste listrado que gira na porta da barbearia é, na origem, uma propaganda de sangria. Durante séculos, o mesmo homem que fazia a sua barba abria a veia do seu braço quando você estava doente, e o poste era o jeito de avisar a cidade que ali se fazia isso.

### Quando o barbeiro era cirurgião

Por centenas de anos, os barbeiros-cirurgiões cortavam cabelo, tiravam piolho, arrancavam dente e faziam sangria: um corte na veia pra "tirar o sangue ruim". Era a medicina da época, baseada na ideia de que o corpo tinha quatro líquidos que precisavam ficar em equilíbrio, e o sangue era um deles.

O site de checagem Snopes explica por que essa tarefa caía no colo do barbeiro. Na Europa medieval, os médicos se viam como estudiosos e achavam a cirurgia um trabalho menor. Sangria, dente e até amputação ficavam com quem tinha mão firme e navalha afiada.

### O poste era a vara da sangria

O museu do Royal College of Physicians de Edimburgo, na Escócia, guarda um poste de barbeiro dos anos 1930 e explica de onde ele vem: é um modelo da vara que o cliente apertava com a mão, pra veia saltar na hora do corte.

Antes do poste, diz o mesmo museu, quem fazia sangria anunciava o serviço de um jeito bem menos discreto: deixava na vitrine uma tigela com o sangue dos clientes.

### E as cores?

Aqui ninguém tem certeza, e vale contar as versões. A mais popular diz que o vermelho é o sangue e o branco são as faixas que enrolavam o braço depois. Outra diz que cada cor era um serviço, sangria de um lado e dente do outro. Um livro citado pela Snopes descreve um código usado em Amsterdã no século 17: vermelho pra quem fazia sangria, branco pra quem arrancava dente e colocava osso no lugar, azul pra quem só fazia a barba. E o azul dos postes americanos também é explicado como patriotismo, as cores da bandeira, mas é só mais uma versão.

### Barbeiros e cirurgiões, juntos e separados

Em Londres, a guilda dos barbeiros aparece em registros desde 1308. Em 1540, uma lei juntou barbeiros e cirurgiões numa companhia só, e, segundo o museu de Edimburgo, a lei inglesa mandava o barbeiro usar poste azul e branco e o cirurgião, vermelho e branco. Em 1745 os cirurgiões saíram e fundaram o que virou o Royal College of Surgeons. A Worshipful Company of Barbers existe até hoje, agora como entidade beneficente ligada à medicina.

Sobrou um vestígio curioso. Segundo a Snopes, no Reino Unido o cirurgião é chamado de "Mister", e não de "Doutor", herança do tempo em que cirurgia era ofício de barbeiro.

No Brasil a história foi parecida, com um capítulo só nosso: aqui, quem fazia sangria eram sobretudo africanos escravizados e libertos. Contamos em [barbeiros sangradores](/revista/barbeiros-sangradores-no-brasil-imperial).

### Como usar isso na sua barbearia

**Conte na cadeira.** É curta, surpreende e o cliente repete em casa. Conversa boa é parte do motivo pra voltar.

Cuide do poste, se você tem um. Mesmo quem nunca entrou numa barbearia reconhece o desenho. Limpo e aceso, ele trabalha por você à noite.

Vire post. "Você sabia que o poste da barbearia era propaganda de sangria?", com uma foto do seu poste, funciona no Instagram e no status do WhatsApp.

E lembre do ofício. O barbeiro já foi o cirurgião da cidade. Mão firme, higiene e confiança continuam sendo o centro do trabalho, só que hoje sem tigela na vitrine.""",
fontes=[
    {"titulo": "Royal College of Physicians of Edinburgh — Bloodletting (exposição Rag: A History of Blood, 2026)", "url": "https://www.rcpe.ac.uk/heritage/heritage-blog/bloodletting"},
    {"titulo": "Snopes — The Surprisingly Bloody History of the Barber Pole (2023)", "url": "https://www.snopes.com/articles/465529/origin-of-barber-poles/"},
    {"titulo": "Wikipedia — Worshipful Company of Barbers", "url": "https://en.wikipedia.org/wiki/Worshipful_Company_of_Barbers"},
])


IMPOSTO = cur(
slug="o-imposto-da-barba-da-russia",
titulo="O czar que cobrava imposto de quem tinha barba",
resumo="Na Rússia de Pedro, o Grande, quem quisesse manter a barba pagava uma taxa e andava com uma ficha de cobre no bolso. A história mais estranha da barba, e o que ela rende na sua barbearia.",
publicadoEm="2026-10-26",
tags=["barbearia", "curiosidade", "história", "barba"],
conteudo="""Imagine pagar imposto pra ter barba e ter que provar no meio da rua que pagou. Foi o que aconteceu na Rússia do czar Pedro, o Grande, no fim do século 17. Quem quisesse continuar barbudo pagava uma taxa por ano e recebia uma ficha de metal, com uma barba desenhada, pra mostrar à polícia.

### Um czar que voltou da Europa decidido

Pedro I tinha viajado pela Europa Ocidental e voltou decidido a deixar a Rússia parecida com ela. Mandar os homens tirarem a barba fazia parte do pacote, e foi uma ordem tão impopular que ele trocou a proibição por uma cobrança. Em 1698, segundo a maioria dos relatos, começou a cobrar pelo direito de usar barba. Quem não pagasse podia ser barbeado à força pela polícia.

O valor dependia de quem você era. Comerciantes ricos pagavam 100 rublos por ano. Na outra ponta, o camponês pagava uma moedinha cada vez que entrava na cidade, e aqui as fontes não batem: umas falam em um copeque, outras em dois meios-copeques.

### A ficha da barba

Quem pagava recebia um comprovante: uma ficha de cobre ou prata, com a águia russa de um lado e, do outro, a parte de baixo de um rosto com nariz, boca, bigode e barba. As fichas mais conhecidas são de 1705. A revista de numismática E-Sylum registra as duas frases gravadas nelas: "o imposto da barba foi pago" e "a barba é um peso inútil".

Hoje essas fichas são raras e valem dinheiro em leilão. Em 1845, um colecionador já reclamava que era difícil achar uma, mesmo na Rússia. Ninguém tinha vontade de guardar a prova de um imposto que todo mundo odiava.

### Funcionou?

Como imposto, não muito. Entre 1705 e 1708, a arrecadação ficou em uns 3.588 rublos por ano, e os relatos tratam o imposto como um fracasso financeiro. O governo superestimou a capacidade de fiscalizar, e pouca gente preferiu pagar a raspar. O imposto foi revogado oficialmente em 1772, pela imperatriz Catarina, a Grande.

### Como usar isso na sua barbearia

**Conte na cadeira, com a pergunta certa.** "Se tivesse imposto da barba hoje, você pagava ou raspava?" rende cinco minutos de conversa com qualquer barbudo.

Faça a sua ficha da barba. Um cartão fidelidade com cara de ficha antiga, carimbado a cada barba feita, com a décima de graça, é um jeito divertido de fazer o cliente voltar. A história vem junto com o cartão.

Vire post. "Em 1698, barba pagava imposto. Aqui, ela só paga a manutenção" funciona bem com a foto de uma barba bem feita.

Ainda bem que hoje quem cobra pela barba é o barbeiro, e o cliente paga feliz.""",
fontes=[
    {"titulo": "Futility Closet — The Beard Tax (2022)", "url": "https://www.futilitycloset.com/2022/03/04/the-beard-tax/"},
    {"titulo": "The Orkney News — Beard tax, on this day (2021)", "url": "https://theorkneynews.scot/2021/09/05/beard-tax-onthisday/"},
    {"titulo": "The E-Sylum (Numismatic Bibliomania Society) — Russian beard tax token counterstamps", "url": "https://www.coinbooks.org/esylum_v15n46a19.html"},
])


SANGRADORES = cur(
slug="barbeiros-sangradores-no-brasil-imperial",
titulo="Os barbeiros sangradores do Brasil: africanos que cuidavam da saúde da cidade",
resumo="No Rio do século 19, quem fazia sangria, arrancava dente e cortava cabelo eram sobretudo africanos escravizados e libertos. Uma história da nossa profissão que pouca gente conhece.",
publicadoEm="2026-10-26",
tags=["barbearia", "curiosidade", "história", "brasil"],
conteudo="""Em agosto de 1820, no Rio de Janeiro, um homem chamado Vicente fez uma prova diante da Fisicatura-mor, o órgão que fiscalizava quem cuidava da saúde. Tinha vindo de Angola, era escravizado e tinha aprendido o ofício com o próprio senhor. Respondeu certo às perguntas de prática e de teoria e recebeu a carta que o autorizava a trabalhar como sangrador e dentista. Vicente era o retrato do barbeiro brasileiro daquele tempo.

### Quem cuidava da saúde da cidade

No Rio do século 19, médicos, cirurgiões e boticários eram, na maioria, brancos e de famílias com dinheiro. Já os sangradores, as parteiras e os curandeiros eram, na maioria, escravizados, libertos e gente pobre, como mostra o trabalho da historiadora Tânia Salgado Pimenta, da Fiocruz. Eram eles que atendiam as urgências de quem precisasse, rico ou pobre, nas ruas, nas praças e nas lojas de barbeiro.

A sangria era um dos tratamentos mais usados da época. A medicina ainda acreditava que doença era desequilíbrio entre os "humores" do corpo, e tirar sangue seria um jeito de reequilibrar. Por ser um trabalho manual e perto do sangue, era visto como inferior e ficava com quem estava na base da sociedade.

### Os números de uma profissão africana

Entre 1808 e 1828, a Fisicatura-mor fiscalizava as "artes de curar" e dava as licenças. Nos pedidos de brasileiros analisados pela pesquisadora, 84% (164 de 193) eram de libertos ou escravizados. Entre os sangradores com origem conhecida, 61,3% tinham nascido na África, com leve maioria vinda do centro-oeste do continente. O pintor francês Jean-Baptiste Debret, que retratou essas lojas, contou que elas costumavam pertencer a negros libertos, que ensinavam o ofício a aprendizes escravizados.

O sangrador raramente fazia só uma coisa. Viajantes estrangeiros descreveram homens que sangravam, aplicavam sanguessugas, arrancavam dentes, cortavam cabelo e barba, tocavam música, vendiam casco de tartaruga pra fazer pente e até remendavam meias de seda.

### A carta de homem livre

A história de Vicente tem continuação. Em 1824, já liberto, ele voltou à Fisicatura com um pedido: queria uma carta nova, porque achava "indecoroso conservar uma Carta do tempo de escravo". Foi atendido em novembro daquele ano. Um pedido curto que diz muito sobre dignidade no trabalho.

### Da sangria à estética

Em 1828 a Fisicatura acabou e a fiscalização passou às câmaras municipais. Muitos sangradores ficaram sem registro e continuaram trabalhando sem licença, sem perder a confiança da população. Com a medicina baseada em micróbios, a partir das descobertas de Louis Pasteur, a sangria foi saindo de moda. O barbeiro-sangrador, aos poucos, largou a parte de curar e ficou com o cabelo e a barba. É dessa mudança que nasce a barbearia como a gente conhece.

### Como usar isso na sua barbearia

**Conte essa história.** O barbeiro brasileiro tem uma origem que pouca gente conhece, ligada à resistência e ao trabalho de africanos e seus descendentes. É uma conversa que valoriza a profissão e quem está na cadeira.

Leve pro Instagram em novembro. No mês da Consciência Negra, um post sobre os barbeiros sangradores ensina e mostra que a sua barbearia conhece a própria história.

Valorize o ofício e o aprendiz. Vicente aprendeu, fez prova e fez questão de ter a carta certa. Ensinar direito e reconhecer quem aprende continua sendo o que faz a profissão andar.

O poste listrado conta a história da sangria na Europa, como mostramos em [por que o poste é listrado](/revista/por-que-o-poste-da-barbearia-e-listrado). No Brasil, essa história tem nome, sobrenome e sotaque africano.""",
fontes=[
    {"titulo": "Pimenta, T. S.; Dantas, R. A. — Barbeiros-sangradores no Rio de Janeiro oitocentista. Revista da ABPN, v. 6, n. 14, 2014", "url": "https://abpnrevista.org.br/site/article/download/127/127"},
    {"titulo": "Pesquisa FAPESP — A saúde entre dois mundos", "url": "https://revistapesquisa.fapesp.br/a-saude-entre-dois-mundos/"},
])


GILLETTE = cur(
slug="a-lamina-que-tirou-a-barba-da-barbearia",
titulo="A lâmina descartável que tirou a barba da barbearia",
resumo="Em 1904, King Gillette patenteou o barbeador de lâmina descartável. Com a Primeira Guerra, milhões de homens aprenderam a se barbear sozinhos. Como a barbearia perdeu a barba e como ela pode reconquistar.",
publicadoEm="2026-10-26",
tags=["barbearia", "curiosidade", "história", "barba"],
conteudo="""Até o começo do século 20, fazer a barba com navalha em casa era coisa pra quem tinha mão firme e paciência pra afiar a lâmina no couro. Muita gente preferia ir ao barbeiro. Aí apareceu um vendedor ambulante americano com uma ideia que parecia impossível, e o barbear foi morar no banheiro de casa.

### A ideia de um vendedor

King Camp Gillette vendia de tudo pelos Estados Unidos e se barbeava todo dia no trem, com um tipo de barbeador "de segurança" que já existia. O problema era a lâmina: precisava ser afiada sempre e, um dia, gastava de vez. Em 1895, morando em Boston, ele teve a ideia: uma lâmina fina de aço, tão barata que dava pra jogar fora quando perdesse o fio.

Os especialistas em metal do MIT disseram que era impossível. Gillette levou seis anos pra achar um engenheiro, William Nickerson, que conseguisse fabricar a lâmina. Em 1901 os dois abriram a empresa, a produção começou em 1903 e a patente saiu em 1904.

### O cabo uma vez, a lâmina pra sempre

O pulo do gato não foi só a lâmina. Pela primeira vez, lâminas eram vendidas em pacotes, e o cabo era comprado uma vez só. O cliente voltava pra loja toda vez que a lâmina acabava. É o modelo que até hoje se chama de "cabo e lâmina", copiado por impressora e cartucho, máquina de café e cápsula.

[[foto:a-lamina-que-tirou-a-barba-da-barbearia-2]]

### A guerra que ensinou o homem a se barbear

O empurrão final veio na Primeira Guerra Mundial. O exército americano distribuiu kits de barbear da Gillette aos soldados; o Museu Militar da Pensilvânia estima mais de três milhões de kits. O museu resume o efeito: o barbeador dava um barbear de qualidade profissional sem precisar ir ao barbeiro, e o hábito voltou pra casa com os soldados.

Uma curiosidade sobre o homem: King Gillette escreveu livros contra o capitalismo e sonhava com cidades gigantes cobertas por cúpulas de vidro. Perdeu boa parte da fortuna na quebra da bolsa de 1929 e morreu em 1932.

### Como usar isso na sua barbearia

**Venda o que a lâmina de casa não faz.** Toalha quente, navalha, pele preparada, desenho da barba e massagem no fim. O cliente se barbeia em casa há cem anos; o que ele não consegue sozinho é a experiência.

Use o modelo "cabo e lâmina" a seu favor. O primeiro corte, bem feito, é o cabo. A manutenção a cada 15 ou 20 dias é a lâmina. Um plano mensal de barba ou de pezinho transforma visita solta em cliente fixo.

Ensine o cliente a manter a barba entre uma visita e outra. Parece dar o ouro, mas é o contrário: quem aprende a cuidar valoriza mais o trabalho do barbeiro e volta pra fazer o que não consegue sozinho.

A Gillette tirou a barba da barbearia. A barbearia de hoje tem a chance de trazer de volta, não como obrigação, mas como prazer.""",
fontes=[
    {"titulo": "Lemelson-MIT — King Gillette: Disposable-Blade Safety Razor", "url": "https://lemelson.mit.edu/resources/king-gillette"},
    {"titulo": "Pennsylvania Military Museum — A Close Shave (PDF)", "url": "https://www.pamilmuseum.org/s/A-Close-Shave.pdf"},
])


QUARTETO = cur(
slug="quarteto-de-barbearia",
titulo="Quarteto de barbearia: a música que nasceu esperando a vez",
resumo="O estilo de canto em quatro vozes chamado \"barbershop\" foi desenvolvido por afro-americanos no fim do século 19, nas barbearias. W. C. Handy e Scott Joplin cantaram nesses quartetos.",
publicadoEm="2026-10-26",
tags=["barbearia", "curiosidade", "história", "música"],
conteudo="""Nos Estados Unidos do fim do século 19, quem esperava a vez na barbearia não ficava mexendo no celular. Cantava. Quatro homens, quatro vozes, sem instrumento, procurando de ouvido o acorde que fazia o salão inteiro arrepiar. Esse jeito de cantar ficou com o nome do lugar: *barbershop harmony*, a harmonia de barbearia.

### Uma música negra

A linha do tempo da música afro-americana do Carnegie Hall, uma das salas de concerto mais famosas do mundo, é clara: o canto em quatro vozes chamado "barbershop" foi amplamente praticado e desenvolvido por afro-americanos no fim do século 19 e começo do 20, como profissão e como diversão. O escritor James Weldon Johnson, um dos fundadores da NAACP, escreveu em 1929 que, no Sul, "numa época em que barbeiro branco era praticamente desconhecido, toda barbearia tinha um quarteto".

O historiador Lynn Abbott foi além e chamou o quarteto de "passatempo nacional negro". O coração da brincadeira era improvisar a harmonia, "rachar um acorde", como diziam.

### Quem cantou

A lista impressiona. Por volta de 1888, W. C. Handy, que viria a ser chamado de "pai do blues", cantava como tenor num quarteto que se reunia numa barbearia de Florence, no Alabama, pra testar músicas novas. Scott Joplin, o compositor do ragtime, cantou em quarteto desde menino. Jelly Roll Morton, pioneiro do jazz de Nova Orleans, também, e lembrava das harmonias "malucas" que inventavam pra ninguém conseguir entrar no meio.

De onde veio o nome? Há quem ligue à "música de barbeiro" da Inglaterra de Shakespeare, quando as barbearias tinham instrumentos pendurados pra clientes tocarem enquanto esperavam. Mas, segundo o Carnegie Hall, aquela música tinha pouco a ver com a harmonia americana. Pode ser que só o nome, e o costume de fazer música na barbearia, tenha atravessado o oceano.

### E no Brasil?

Aqui a barbearia também foi lugar de música. Viajantes do século 19 contavam que os barbeiros sangradores do Rio, em sua maioria africanos e seus descendentes, também eram músicos. Está na nossa matéria sobre os [barbeiros sangradores](/revista/barbeiros-sangradores-no-brasil-imperial).

### Como usar isso na sua barbearia

**Pense na música como parte do atendimento.** O som da barbearia diz quem ela é tanto quanto a decoração. Monte uma playlist que combine com o seu público e com o seu estilo, e cuide do volume pra não atrapalhar a conversa.

Atenção à regra do som ambiente. No Brasil, a Lei de Direitos Autorais considera estabelecimento comercial um "local de frequência coletiva": tocar música ali é execução pública, e o direito autoral é recolhido pelo escritório central, o Ecad. Antes de ligar a caixa de som, consulte o Ecad sobre o valor pro seu caso.

Faça da espera um momento. Um café, uma boa música e assunto na roda transformam a fila em parte da experiência, como era nas barbearias de cem anos atrás.

Uma barbearia cheia de gente esperando e conversando já foi berço de blues e jazz. A sua pode, no mínimo, ser o lugar onde o cliente gosta de ficar.""",
fontes=[
    {"titulo": "Carnegie Hall — Timeline of African American Music: African Americans and Barbershop Harmony", "url": "https://timeline.carnegiehall.org/stories/african-americans-and-barbershop-harmony"},
    {"titulo": "Lei nº 9.610/1998 (Direitos Autorais), art. 68 — texto atualizado na Câmara dos Deputados", "url": "https://www2.camara.leg.br/legin/fed/lei/1998/lei-9610-19-fevereiro-1998-365399-normaatualizada-pl.html"},
])


MOVEMBER = cur(
slug="movember-e-novembro-azul",
titulo="Movember e Novembro Azul: o mês em que o bigode vira causa",
resumo="Em 2003, dois amigos num bar de Melbourne resolveram trazer o bigode de volta. Virou o Movember, que inspirou o Novembro Azul no Brasil. Ideias pra barbearia participar em novembro.",
publicadoEm="2026-10-26",
tags=["barbearia", "curiosidade", "saúde", "novembro azul", "datas"],
conteudo="""Em 2003, dois amigos tomavam uma cerveja no Gypsy Bar, em Fitzroy, um bairro de Melbourne, na Austrália, e repararam numa coisa: o bigode, que já tinha sido moda tantas vezes, tinha sumido. De brincadeira, decidiram trazer de volta. A brincadeira virou o Movember, um movimento mundial pela saúde do homem, e chegou ao Brasil com outro nome: Novembro Azul.

### Do bar pro mundo

A história está no site do próprio Movember. Travis Garone e Luke Slattery decidiram convencer os amigos a deixar o bigode crescer durante novembro. Inspirados pela mãe de um amigo, que arrecadava dinheiro contra o câncer de mama, resolveram que a campanha seria pela saúde do homem e contra o câncer de próstata. Criaram as regras, que valem até hoje, e cobraram dez dólares de quem quisesse participar.

O convite foi por e-mail, com um título difícil de recusar: "Você é homem o bastante pra ser meu homem?". Trinta amigos toparam. No ano seguinte, em 2004, a ideia foi formalizada: Adam Garone abriu uma empresa e criou um site, e Justin Coghlan levou a campanha pra outros estados. O nome junta *moustache* (bigode) e *November* (novembro).

[[foto:movember-e-novembro-azul-2]]

### O Novembro Azul brasileiro

Por aqui, a campanha nasceu em 2008, com o Instituto Lado a Lado pela Vida, criado pela jornalista Marlene Oliveira com o incentivo do urologista Eric Roger Wroclawski. A primeira ação se chamava "Um Toque, Um Drible" e distribuía informação nas ruas e nas redes sociais. Em 2011 veio o nome Novembro Azul, inspirado em duas coisas: o sucesso do Outubro Rosa e a ideia australiana de usar o mês inteiro.

Hoje o Novembro Azul é abraçado por empresas, hospitais, governos e escolas. E é, de longe, a data do calendário que mais combina com barbearia.

### Como usar isso na sua barbearia

**Entre no clima com o bigode.** Um "concurso do bigode de novembro", com foto no primeiro e no último dia e um prêmio simples (um corte grátis, um kit de barba), faz o cliente voltar no fim do mês pra mostrar o resultado.

Doe uma parte. Anuncie que um valor de cada barba feita em novembro vai pra uma instituição de saúde da sua cidade, e preste contas no fim do mês com um post. Gente gosta de saber que o dinheiro chegou.

Fale de saúde sem bancar o médico. O recado certo é simples: "vá ao médico e converse sobre a sua saúde". Exame e tratamento são assunto do médico; o seu papel é lembrar o cliente de ir. Em Los Angeles, um estudo mostrou que [o barbeiro pode fazer diferença](/revista/los-angeles-barbearia-e-pressao-alta).

Decore de azul e poste. Fita azul no espelho e um post explicando de onde veio o Movember mostram que a barbearia está ligada ao que acontece fora dela.

Uma brincadeira de bar virou um movimento mundial porque juntou humor e causa. Barbearia é o lugar perfeito pras duas coisas.""",
fontes=[
    {"titulo": "Movember — Movember's origin story", "url": "https://us.movember.com/story/view/id/11213"},
    {"titulo": "Meio & Mensagem — Novembro Azul: uma história sem tabus (entrevista com Marlene Oliveira)", "url": "https://www.meioemensagem.com.br/comunicacao/novembro-azul-uma-historia-sem-tabus"},
])


CADEIRA = cur(
slug="a-cadeira-hidraulica-de-barbeiro",
titulo="A cadeira de barbeiro que sobe no pedal nasceu pra salvar as costas",
resumo="A Koken, de St. Louis, foi a primeira a fazer cadeira de barbeiro com elevação hidráulica. Num museu da Flórida, uma delas foi presente de uma banda pro barbeiro que sofria das costas.",
publicadoEm="2026-10-26",
tags=["barbearia", "curiosidade", "história", "saúde do barbeiro"],
conteudo="""No museu The Ringling, em Sarasota, na Flórida, há uma cadeira de barbeiro com uma história que todo barbeiro entende. Acredita-se que um músico da banda que tocava na mansão do empresário de circo John Ringling cortava o cabelo dele toda semana, e que isso estava acabando com as costas do músico. A banda fez uma vaquinha e deu a Ringling uma cadeira moderna, que subia com o pé, pra poupar o colega.

### A cadeira que sobe

Essa cadeira foi feita pela Koken Barbers' Supply, de St. Louis, nos Estados Unidos, empresa que funcionou de 1881 a 1969. Segundo o museu The Ringling, a Koken foi a primeira a desenhar uma cadeira de barbeiro com elevação hidráulica: o barbeiro bombeava um pedal e a cadeira subia, suave, até a altura certa.

Pode parecer detalhe, mas mudou o trabalho. Numa cadeira fixa, é o barbeiro que se adapta, curvando as costas pra alcançar um cliente baixo ou esticando os braços pra um alto. Com a elevação, a cadeira passa a se adaptar ao barbeiro. Somada ao encosto que deita pra barba e à base que gira, ela permite alcançar todos os lados do cliente sem se torcer.

[[foto:a-cadeira-hidraulica-de-barbeiro-2]]

### Por que isso importa hoje

O barbeiro passa o dia em pé, de braço levantado, inclinando o tronco. Ao fim de anos, quem não cuida sente nas costas, no pescoço e nos ombros. A história da cadeira de Ringling é antiga, mas a dor do barbeiro é a mesma.

### Como usar isso na sua barbearia

**Ajuste a cadeira pra você, não o contrário.** Antes de cada cliente, suba ou desça até trabalhar com as costas retas e os cotovelos perto do corpo. São dois segundos de pedal que você agradece daqui a dez anos.

Na hora de comprar, pense em você. Uma cadeira com elevação, encosto reclinável e giro firme custa mais, mas é ferramenta de trabalho, como a máquina. Compare pelo tempo que você vai passar em volta dela.

Cuide do chão e do calçado. Tapete antifadiga no posto e um tênis confortável ajudam quem passa oito horas em pé.

Pare entre um cliente e outro. Um minuto alongando ombro e pescoço não atrasa a agenda e alivia o corpo.

Se as dores não passam, procure um médico ou fisioterapeuta. Ninguém faz bom corte com as costas doendo, e a banda de Ringling já sabia disso há cem anos.""",
fontes=[
    {"titulo": "The Ringling — Congress Pedestal Hydraulic Chair (Koken Barbers' Supply Co.)", "url": "https://emuseum.ringling.org/objects/14368/congress-pedestal-hydraulic-chair"},
])


ARTIGOS = [POSTE, IMPOSTO, SANGRADORES, GILLETTE, QUARTETO, MOVEMBER, CADEIRA]
