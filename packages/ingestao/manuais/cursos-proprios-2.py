"""Cursos próprios do Aprenda Livre, segunda leva (26/10/2026). Gera data/cursos/<slug>.json.

- "Atendimento que vira ritual": os exemplos e números vêm das matérias da Revista, que têm as
  fontes conferidas (Truefitt & Hill, QB House, Antica Barbieria Colla, CNN/barbeiro turco,
  Schorem, relatórios SQUIRE e Zenoti de 2026, estudo do NEJM de 2018). Cada lição linka a matéria.
- "Foto e vídeo da barbearia com o celular": técnica prática, sem números de terceiros.
"""
import json, os, sys

DESTINO = sys.argv[1] if len(sys.argv) > 1 else "data/cursos"
FONTE = {
    "nome": "Aprenda Livre",
    "tituloOriginal": "",
    "autores": ["Aprenda Livre"],
    "licenca": "CC-BY-4.0",
    "atribuicao": "Conteúdo original do Aprenda Livre, escrito em português, sob licença CC BY 4.0. "
                  "Exemplos de outros países vêm das matérias da Revista, com as fontes no fim de cada uma. "
                  "Leis citadas conferidas no texto atualizado da Câmara dos Deputados em 26/10/2026; regras mudam, confirme com seu contador.",
}


def curso(slug, titulo, resumo, area, tags, modulos):
    return {
        "slug": slug, "titulo": titulo, "resumo": resumo, "area": area, "nivel": "iniciante", "tags": tags,
        "idiomaOriginal": "pt", "traducao": "original", "autoria": "propria",
        "modulos": modulos, "fonte": {**FONTE, "tituloOriginal": titulo}, "atualizadoEm": "2026-10-26",
    }


# ---------------------------------------------------------------- atendimento
A = [
{"id": "a-chegada", "titulo": "A chegada: os primeiros dois minutos", "conteudo": """O cliente decide se gostou da barbearia antes de sentar na cadeira. Nos primeiros dois minutos ele repara se alguém olhou pra ele, se sabe quanto vai esperar e se o lugar está limpo. Nada disso depende de técnica de corte, e tudo isso pesa na volta.

### Olhe, cumprimente, diga o nome

Mesmo com a máquina na mão, levante o olho e cumprimente quem entra. "Boa tarde, já te atendo" vale mais do que qualquer decoração. Se o cliente já veio antes, chame pelo nome. Se é novo, pergunte e use o nome dali em diante.

### Diga a verdade sobre a espera

Cliente não se irrita com espera, se irrita com espera que ninguém avisou. "Tem dois na frente, uns 40 minutos" deixa ele decidir se fica, se vai tomar um café ou se volta mais tarde. Prometer "já, já" e demorar meia hora é o jeito mais rápido de perder alguém.

A rede japonesa QB House colocou na porta uma espécie de semáforo que mostra se a espera está curta ou longa, e ninguém precisa entrar pra perguntar ([a história está na Revista](/revista/japao-barbear-de-ritual-e-corte-de-10-minutos)). Você faz o mesmo com um aviso na porta ou no status do WhatsApp: "fila agora: 2 pessoas".

### A espera também é atendimento

Uma cadeira confortável, água ou café, Wi-Fi com a senha à vista e uma música no volume certo transformam a espera em parte do serviço. Revistas velhas e TV alta fazem o contrário.

Nos Estados Unidos do século 19, quem esperava a vez na barbearia cantava em quatro vozes, e daí nasceu um estilo de música inteiro ([quarteto de barbearia](/revista/quarteto-de-barbearia)). Ninguém precisa cantar, mas a lição fica: o lugar onde é bom esperar vira lugar onde é bom voltar.

### Quem agenda espera menos

Se você atende com horário marcado, o respeito ao horário é a chegada. Atrasou dez minutos, avise antes pelo WhatsApp. Atrasou sempre, a agenda está errada: aumente o tempo de cada serviço até ela caber no dia.

### Na prática

| O cliente repara em | O que fazer amanhã |
|---|---|
| Se alguém olhou pra ele | Cumprimentar sempre, mesmo ocupado |
| Quanto vai esperar | Dizer o tempo de verdade, ou mostrar a fila |
| Onde vai esperar | Cadeira, água, senha do Wi-Fi |
| Se o horário vale | Avisar atraso antes de acontecer |

### Para pensar

- Quanto tempo leva hoje, na sua barbearia, até alguém falar com quem entra?
- O que um cliente novo vê nos primeiros dois minutos que você gostaria que ele não visse?"""},

{"id": "a-conversa-antes", "titulo": "A conversa antes da tesoura", "conteudo": """O corte começa antes da máquina ligar. Os dois ou três minutos de conversa antes do serviço evitam a maior fonte de reclamação da barbearia: o cliente queria uma coisa e saiu com outra.

### Pergunte antes de supor

A barbearia mais antiga do mundo, a Truefitt & Hill, em Londres, começa o barbear de todo cliente novo com uma conversa sobre a rotina dele ([episódio 1](/revista/londres-truefitt-and-hill)). Em Milão, a Antica Barbieria Colla abre a sessão de barba observando a barba, o bigode, a pele e o rosto antes de pegar a tesoura ([episódio 4](/revista/milao-antica-barbieria-colla)).

Você não precisa de cerimônia, só de três perguntas:

1. "Como você quer hoje? Igual da última vez ou quer mudar algo?"
2. "Como você arruma o cabelo em casa?" (Quem não usa pomada nenhuma não vai manter um topete.)
3. "Tem algum compromisso?" (Casamento no sábado muda tudo.)

### Use imagem, não adjetivo

"Curtinho dos lados" significa uma coisa pra você e outra pro cliente. Peça uma foto de referência no celular, mostre a numeração da máquina com os dedos ou aponte no cardápio da parede.

A Schorem, em Roterdã, tem só 12 cortes, com nome e foto em dois pôsteres ([episódio 7](/revista/roterda-schorem)). O cliente aponta e pronto. Um quadro com os seus 8 ou 10 cortes mais pedidos faz o mesmo trabalho e ajuda quem tem vergonha de explicar.

### Repita antes de começar

Antes de ligar a máquina, resuma o combinado em uma frase: "Então, máquina 2 dos lados, degradê baixo e só tirar as pontas em cima, certo?". Se ele disser "isso", você está protegido. Se disser "não, peraí", você acabou de evitar um cliente bravo.

### Quando o pedido não vai funcionar

Às vezes o cliente pede um corte que não combina com o cabelo dele, com o rosto ou com a rotina. Diga com respeito e ofereça uma alternativa: "Com esse redemoinho, o topete vai ficar caindo. Que tal um texturizado? Fica parecido e dura mais". Quem dá conselho sincero vira o barbeiro de confiança. Quem só obedece vira o barbeiro que errou.

### Para pensar

- Qual reclamação você mais ouviu no último mês? Uma pergunta antes do corte teria evitado?
- Quais seriam os 8 cortes do seu cardápio na parede?"""},

{"id": "etapas-que-o-cliente-lembra", "titulo": "Etapas que o cliente lembra", "conteudo": """Ninguém lembra de um corte "normal". O cliente lembra de momentos: a toalha quente, o cheiro do pós-barba, a massagem no fim. Organizar o serviço em etapas claras é o que transforma um atendimento em ritual, e ritual é o que se conta pros amigos.

### Começo, meio e fim

Um barbear em Milão, na Antica Barbieria Colla, tem seis passos bem definidos: massagem com creme pré-barba, pano quente, espuma montada no pincel, navalha, pós-barba com o pano quente de novo e massagem final ([episódio 4](/revista/milao-antica-barbieria-colla)). Em Yokohama, no Japão, o atendimento completo na Shibagaki, apontada como a barbearia de estilo ocidental mais antiga do país, leva uma hora e termina com massagem nos ombros ([episódio 2](/revista/japao-barbear-de-ritual-e-corte-de-10-minutos)).

Repare que o começo e o fim são os momentos de cuidado. A técnica fica no meio.

### Escreva o seu método

Pegue papel e escreva, em até seis passos, como é a sua barba completa ou o seu corte completo. Por exemplo:

1. Conversa rápida e escolha do corte.
2. Lavagem com massagem no couro cabeludo.
3. Corte.
4. Toalha quente no rosto.
5. Finalização com o produto que o cliente escolheu.
6. Dois minutos de massagem nos ombros.

Com o método escrito, todo barbeiro da casa faz igual, o cliente sabe o que esperar e você consegue cobrar pelo pacote.

### Deixe o cliente escolher alguma coisa

Na Truefitt & Hill o cliente escolhe o creme de barbear e o perfume do final ([episódio 1](/revista/londres-truefitt-and-hill)). Escolher é participar, e o cliente lembra do que ajudou a decidir. Duas opções de pós-barba ou de pomada já bastam.

### Rápido ou ritual: os dois têm lugar

Nem todo mundo quer uma hora de cuidado. A QB House, no Japão, só corta, em uns 12 minutos, sem lavagem. O segredo é deixar claro no cardápio: um "só corte" pontual pra quem tem pressa e um "completo" com preço de experiência pra quem quer se cuidar. Cada cliente paga pelo que quer.

### Na prática

| Serviço | Tempo | O que inclui |
|---|---:|---|
| Só corte | 30 min | Conversa, corte, finalização |
| Completo | 60 min | Lavagem, corte, toalha quente, barba, massagem |

*Tempos de exemplo; use os seus.*

### Para pensar

- Qual momento do seu atendimento o cliente comenta com os outros? E se não tiver nenhum?
- Quais seriam os seis passos do seu método?"""},

{"id": "higiene-e-conversa", "titulo": "Higiene que se vê e conversa que acolhe", "conteudo": """Duas coisas fazem o cliente confiar em quem segura uma navalha perto do pescoço dele: ver que tudo está limpo e sentir que está sendo ouvido. As duas são baratas e quase ninguém faz direito.

### Higiene que aparece

Higiene que o cliente não vê não conta pra ele. O barbeiro turco Nihat Aram, entrevistado pela CNN, usa lâmina nova a cada cliente e esteriliza o resto do equipamento ([episódio 3](/revista/turquia-o-barbeiro-que-cuida-de-tudo)). Na Milão da Antica Barbieria Colla, a navalha é descartável e estéril.

O que fazer na frente do cliente:

- Abrir a lâmina nova na hora, à vista.
- Limpar a máquina e o pente antes de começar.
- Usar capa limpa e papel no pescoço.
- Varrer o cabelo do cliente anterior antes de ele sentar.

Leva menos de um minuto e passa mais segurança do que qualquer placa de "higiene garantida". Siga também as regras da vigilância sanitária da sua cidade.

### A conversa certa

O mesmo barbeiro turco diz que aprendeu a perceber quando o cliente chega estressado com o trabalho ou com a família, e a responder a isso. Às vezes responder é conversar. Às vezes é ficar quieto.

Algumas regras simples:

- Siga o ritmo do cliente. Quem responde curto quer silêncio; quem puxa assunto quer conversa.
- Pergunte e escute mais do que fala.
- Evite temas que dividem (política, religião, futebol com torcedor rival nervoso), a não ser que o cliente traga e você conheça bem a pessoa.
- Guarde o que ele contou. "E aí, o filho passou na prova?" no mês seguinte vale ouro.

### O limite da confiança

O cliente às vezes conta coisas de saúde. Em Los Angeles, um estudo publicado no *New England Journal of Medicine* mostrou que barbeiros que incentivaram clientes com pressão alta a se tratar ajudaram a pressão deles a cair ([episódio 8](/revista/los-angeles-barbearia-e-pressao-alta)). Repare no papel do barbeiro ali: incentivar a procurar quem é da saúde, nunca diagnosticar nem receitar.

O mesmo vale pra tudo: você é alguém de confiança, não médico, nem advogado, nem psicólogo. Ouvir e indicar quem pode ajudar já é muito.

### Para pensar

- O que o cliente vê de higiene na sua bancada hoje?
- Qual cliente seu você sabe que prefere silêncio? E qual adora conversar?"""},

{"id": "a-saida", "titulo": "A saída: pagamento, próximo horário e produto", "conteudo": """O atendimento não acaba quando a máquina desliga. Os três minutos da saída decidem se o cliente volta, quanto ele gasta e se ele lembra de você antes de procurar outro.

### Pagamento sem atrito

Ninguém gosta de esperar o troco. Deixe o QR do Pix visível na bancada, aceite cartão e, se der, cobre antes de começar o serviço, como faz a QB House no Japão. Quanto menos tempo no caixa, mais tempo pra atender.

### Marque o próximo antes dele levantar

Este é o hábito que mais muda o faturamento. Um relatório de 2026 sobre barbearias americanas, feito por uma empresa de sistema de agendamento, mostrou que cerca de 48% dos clientes vão uma vez e não voltam ([a matéria está na Revista](/revista/barbearias-eua-2026-clientes-fieis)). Quem sai com o próximo horário marcado já é meio caminho de cliente fixo.

Faça a pergunta de um jeito simples: "Daqui a três semanas, sábado de manhã, fica bom pra você?". Se ele não puder marcar agora, pergunte se pode mandar uma mensagem quando estiver perto da data.

### Indique o produto certo, sem empurrar

O cliente sentiu o cheiro do pós-barba e gostou. Na Truefitt & Hill, no fim do corte, o barbeiro indica quais produtos usar em casa, e a Antica Barbieria Colla vende pelo site os mesmos cremes e loções que usa na cadeira ([episódio 4](/revista/milao-antica-barbieria-colla)).

A regra é recomendar o que você usa e confia, com a explicação de por que serve pra ele: "Seu cabelo é fino, essa pomada segura sem pesar". Recomendação é serviço. Empurrar o produto do mês é o contrário.

### Planos e pacotes

Na mesma pesquisa americana, outra empresa do setor viu as vendas de planos de assinatura das barbearias crescerem 20%. Um plano mensal com dois cortes, ou uma barba toda semana, dá previsibilidade pra você e economia pro cliente.

### Na prática

| Na saída, sempre | Por quê |
|---|---|
| Pix visível | Ninguém espera troco |
| "Quando a gente marca o próximo?" | Metade dos clientes some se ninguém pergunta |
| Dizer o produto que usou | O cliente quer repetir o resultado em casa |
| Oferecer o plano a quem vem sempre | Agenda e receita previsíveis |

### Para pensar

- Quantos clientes saíram da sua barbearia na última semana com o próximo horário marcado?
- Qual produto você usa e indicaria de olhos fechados?"""},

{"id": "pos-atendimento", "titulo": "Depois que ele foi embora: avaliação, reclamação e volta", "conteudo": """O cliente saiu satisfeito. Agora é a hora em que a maioria das barbearias esquece dele, e é justamente aí que dá pra transformar uma visita em fama e em retorno.

### Peça avaliação sempre, do mesmo jeito

O relatório americano de 2026 encontrou que barbearias que pedem avaliação automaticamente no fim de todo atendimento têm, em média, 84% mais avaliações do que as que pedem quando lembram ([na Revista](/revista/barbearias-eua-2026-clientes-fieis)). A diferença não está na qualidade do corte, está na constância.

Tenha o link da sua página do Google pronto no celular. No fim do atendimento, com o cliente satisfeito: "Se você gostou, me ajuda muito deixar uma avaliação no Google. Te mando o link?". Peça pra todos, não só pros que você acha que vão elogiar.

### Responda a todas as avaliações

Agradeça as boas com o nome do cliente. Nas ruins, responda com calma, sem brigar em público: reconheça, explique o que vai mudar e convide pra conversar no privado. Quem lê a resposta vê como você trata problema, e isso conta mais do que uma estrela a menos.

### Reclamação é presente

O cliente que reclama está te dando uma chance de consertar. O que vai embora calado não volta. Quando alguém reclamar:

1. Escute até o fim, sem interromper.
2. Peça desculpa pelo que não ficou bom, mesmo que você ache que fez certo.
3. Ofereça arrumar na hora ou num retorno sem custo.
4. Anote o que aconteceu pra não repetir.

### Chame de volta quem sumiu, um por um

Passou o tempo normal de retorno e o cliente não apareceu? Uma mensagem individual, com o nome, resolve muitas vezes: "Oi, João! Faz um mês do seu último corte. Quer que eu reserve um horário essa semana?". Uma pessoa, uma mensagem, sem lista de transmissão e sem mandar pra quem pediu pra não receber.

### Datas que aproximam

Aniversário do cliente, o Novembro Azul ([Movember e Novembro Azul](/revista/movember-e-novembro-azul)), o aniversário da barbearia, um dia de corte solidário como faz o barbeiro Papito em Havana todo 27 de dezembro ([episódio 6](/revista/havana-callejon-de-los-peluqueros)). Datas fixas dão motivo pra falar com o cliente sem parecer propaganda.

### Para pensar

- Quantas avaliações sua barbearia ganhou no último mês? Quantos clientes você atendeu?
- Quem são os três clientes que sumiram e que você poderia chamar hoje?"""},
]


# ---------------------------------------------------------------- foto e vídeo
FV = [
{"id": "luz", "titulo": "Luz: o segredo que não custa nada", "conteudo": """A diferença entre uma foto de corte que vende e uma que passa batido quase nunca é o celular. É a luz. Com a luz certa, um celular simples faz foto melhor que um celular caro com a luz errada.

### A melhor luz é a da janela

Luz natural, vindo de lado, mostra a textura do cabelo e o desenho do degradê. Leve o cliente pra perto da janela ou da porta, de lado pra ela, e fotografe com a luz batendo na lateral da cabeça. Evite sol direto: ele estoura o branco e faz sombra dura. Dia nublado é o melhor fotógrafo que existe.

### Fuja da luz de cima

A lâmpada no teto, bem em cima da cadeira, faz sombra embaixo dos olhos e deixa o topo da cabeça brilhando. Se a foto tem que ser na cadeira, gire o cliente até a luz da janela ou de uma luminária bater de lado.

### Cuidado com luz misturada

Lâmpada amarela com luz da janela deixa a pele com duas cores. Desligue a lâmpada mais quente ou use só uma fonte de luz. Se a barbearia tem pouca luz natural, uma luminária de LED branca, presa num tripé simples ou na parede ao lado do espelho, resolve e serve pra todas as fotos.

### Toque na tela antes de fotografar

Toque no rosto ou no corte, na tela, antes de bater a foto: o celular foca e acerta o brilho naquele ponto. Se ficou escuro ou claro demais, a maioria dos celulares deixa ajustar o brilho arrastando o dedo pra cima ou pra baixo depois do toque.

### Na prática

| Situação | O que fazer |
|---|---|
| Janela na barbearia | Cliente de lado pra ela, sem sol direto |
| Só luz de teto | Girar o cliente pra luz bater de lado |
| Duas cores na pele | Desligar uma das luzes |
| Barbearia escura | Luminária de LED branca ao lado do espelho |

### Para pensar

- Onde, na sua barbearia, a luz é mais bonita às 10 da manhã? E às 4 da tarde?
- Pegue as últimas 5 fotos que você postou: qual era a luz de cada uma?"""},

{"id": "fundo-e-angulo", "titulo": "Fundo, ângulo e o antes e depois", "conteudo": """Com a luz resolvida, sobram três coisas: o que aparece atrás do cliente, de que lado você fotografa e como mostrar a transformação. Acertando as três, o seu Instagram vira um cardápio que convence.

### Fundo limpo

O cabelo no chão, a vassoura, a garrafa de água e o cliente da cadeira ao lado roubam a atenção do corte. Escolha um pedaço de parede lisa, de cor neutra, e faça todas as fotos ali. Se não tiver, um painel de cor escura ou clara atrás da cadeira já resolve. Fundo sempre igual também deixa o perfil com cara de profissional.

### Os quatro ângulos do corte

Um corte bem feito merece mais de uma foto. Faça sempre a mesma sequência:

1. Frente, com o cliente olhando reto.
2. Perfil, de lado, pra mostrar o degradê.
3. Três quartos, meio de lado, que é o ângulo mais bonito pra maioria dos rostos.
4. Nuca, pra mostrar o acabamento.

Fotografe na altura da cabeça do cliente, não de cima pra baixo. De cima, o rosto fica menor e o corte perde forma.

### Antes e depois que funciona

O antes e depois é o post que mais mostra o seu trabalho, e só funciona se as duas fotos forem iguais em tudo, menos no cabelo: mesma luz, mesmo fundo, mesmo ângulo, mesma distância. Faça a foto do antes já no lugar das fotos, antes de começar, e repita a posição no fim.

### Peça licença

Antes de fotografar o rosto de alguém pra postar, pergunte. Muita gente adora, mas tem quem não queira aparecer, e a decisão é dele. Falamos disso na lição sobre autorização, no fim do curso.

### Sem filtro pesado

Filtro que muda a cor do cabelo ou alisa a pele demais engana o cliente: ele chega esperando um resultado que não existe. Ajuste só brilho e contraste, e deixe o corte como ele é.

### Para pensar

- Onde fica o seu "cantinho das fotos"?
- Seus três últimos antes e depois têm a mesma luz e o mesmo ângulo nas duas fotos?"""},

{"id": "video-curto", "titulo": "Vídeo curto: 15 a 30 segundos", "conteudo": """Vídeo curto mostra o que a foto não mostra: a mão firme, o movimento da navalha, o cliente se olhando no espelho. E não precisa de produção. Precisa de um começo que prenda e de um final que mostre o resultado.

### Sempre na vertical

Quem vê o vídeo está com o celular em pé. Grave na vertical, com o celular apoiado num suporte ou num tripé simples. Mão tremendo é o defeito que mais faz o vídeo parecer amador, e um tripé barato resolve.

### O roteiro de três partes

1. **Gancho, nos primeiros 2 segundos.** O cabelo bem grande, um "olha o que esse cliente pediu" escrito na tela, o barulho da máquina começando. Se os primeiros segundos não prendem, a pessoa passa pro próximo.
2. **O processo, rápido.** Pedaços curtos do trabalho: a máquina subindo, a tesoura, a toalha quente. Ninguém quer ver 20 minutos; quer ver os melhores 10 segundos deles.
3. **O resultado, com calma.** O cliente se virando, o espelho, o antes e depois lado a lado. É a parte que vende.

### Grave em pedaços

Em vez de filmar o corte inteiro, grave trechos de 3 a 5 segundos nos momentos bons. Fica muito mais fácil de editar e você não enche a memória do celular.

### O som

O som da máquina, da tesoura e da conversa dá vida ao vídeo. Se for pôr música, use a biblioteca de músicas do próprio aplicativo onde vai postar: ela já tem as autorizações pra aquele uso. Música baixada da internet e colada no vídeo pode fazer o aplicativo tirar o som ou derrubar o post.

### Ideias que sempre funcionam

- Transformação: cabelo grande pra corte curto.
- Detalhe: o desenho na navalha, o acabamento da nuca em câmera bem perto.
- Bastidor: a barbearia abrindo de manhã, a bancada sendo arrumada.
- Pergunta do cliente respondida: "quanto tempo dura um degradê?".

### Para pensar

- Qual foi o corte mais bonito da sua semana? Você gravou?
- Que pergunta os clientes mais fazem e que daria um vídeo de 20 segundos?"""},

{"id": "editar-no-celular", "titulo": "Editar no celular sem complicar", "conteudo": """Editar não é transformar a foto em outra coisa. É corrigir o que a câmera errou e cortar o que sobra. Dá pra fazer tudo no editor que já vem no celular, em menos de dois minutos por foto.

### Foto: quatro ajustes e pronto

1. **Cortar e endireitar.** Tire o que distrai nas bordas e deixe a linha dos ombros reta.
2. **Brilho.** Clareie um pouco se a foto ficou escura; não estoure o branco.
3. **Contraste.** Um toque a mais deixa o desenho do degradê mais visível.
4. **Nitidez, com cuidado.** Pouco já basta; demais deixa a foto com cara de falsa.

Faça os mesmos ajustes em todas as fotos de uma sessão, pra elas ficarem parecidas entre si. Se o editor deixar copiar os ajustes de uma foto pra outra, use.

### Vídeo: corte, ordem e texto

- Corte o começo e o fim de cada trecho: o momento de pegar e de largar o celular nunca é bom.
- Coloque os pedaços na ordem do roteiro: gancho, processo, resultado.
- Escreva um texto curto na tela no começo ("Do grande ao degradê em 30 segundos") e o nome da barbearia no fim.
- Legende as falas, se houver. Muita gente assiste sem som.

### O que não fazer

- Filtro que muda a cor do cabelo ou alisa a pele.
- Texto demais na tela: ninguém lê parágrafo em vídeo de 20 segundos.
- Música alta por cima da conversa.
- Marca d'água enorme cobrindo o corte. O nome da barbearia pequeno no canto, ou só no fim, já identifica.

### Organize o que gravou

Crie um álbum no celular só pra barbearia e apague o que não presta no mesmo dia. No fim do mês, você vai ter um banco de fotos e vídeos bons pra usar quando faltar ideia de post.

### Para pensar

- Quanto tempo você leva hoje pra preparar um post? Dá pra fazer em cinco minutos?
- Suas fotos parecem da mesma barbearia, ou cada uma tem um jeito?"""},

{"id": "onde-postar", "titulo": "Onde postar e com que frequência", "conteudo": """A foto boa só trabalha por você se alguém vê. Cada lugar tem um papel diferente, e o mesmo material pode ser usado em vários deles sem dar trabalho dobrado.

### Instagram: a vitrine

O perfil da barbearia funciona como cardápio: quem chega ali quer ver se você faz o corte que ele quer. Por isso:

- Fixe no topo três posts: os cortes mais pedidos, o antes e depois mais bonito e um post com endereço, horário e como marcar.
- Mantenha um ritmo que você consegue cumprir. Três posts bons por semana valem mais que um por dia durante uma semana e depois nada.
- Use os destaques dos stories como pastas: "Cortes", "Barba", "Preços", "Como chegar".

### Status do WhatsApp: quem já é cliente

O status é visto por quem tem o seu número, ou seja, quem já é cliente. É o lugar ideal pra avisar horário livre ("sábado tem vaga às 14h"), mostrar o corte do dia e lembrar datas. Não precisa ser bonito como o Instagram; precisa ser frequente.

### Google: quem ainda não te conhece

Quem procura "barbearia perto de mim" vê as fotos da sua página no Google antes de qualquer outra coisa. Coloque lá fotos da fachada (pra pessoa reconhecer na rua), do ambiente por dentro e dos cortes. Fotos novas de vez em quando mostram que a barbearia está ativa. O curso [Marketing pra barbearia](/cursos/marketing-pra-barbearia) mostra como cuidar dessa página.

### Seu site

Se a barbearia tem site, as melhores fotos vão pra lá também, separadas por tipo de serviço. É o lugar onde o cliente vê o trabalho e já marca o horário sem precisar mandar mensagem.

### Um material, vários lugares

Uma sessão de fotos de 10 minutos rende:

| Material | Onde vai |
|---|---|
| Foto do corte, 4 ângulos | Carrossel no Instagram e no site |
| Vídeo de 20 segundos | Reels e status do WhatsApp |
| Foto da fachada e do ambiente | Página do Google |
| Horário livre do dia | Status do WhatsApp |

### Para pensar

- Se alguém abrir seu Instagram agora, entende em 5 segundos que cortes você faz e como marcar?
- Quando foi a última foto nova na sua página do Google?"""},

{"id": "autorizacao", "titulo": "Autorização e cuidado com a imagem do cliente", "conteudo": """A foto do corte é do seu trabalho, mas o rosto é do cliente. Pedir licença antes de postar é respeito, evita constrangimento e protege a barbearia.

### Pergunte sempre, antes

"Posso fotografar o corte pra postar no Instagram da barbearia?" Simples assim, antes da foto. A maioria aceita com prazer, e muitos ainda compartilham. Quem disser não tem esse direito, e a resposta tem que ser respeitada sem cara feia.

Se a pessoa topar só sem o rosto, fotografe a nuca, o perfil de costas ou só o detalhe do degradê. Dá pra mostrar o trabalho sem mostrar quem é.

### Deixe registrado

Uma mensagem no WhatsApp resolve: "Oi, João! Posso postar as fotos do seu corte de hoje no Instagram da barbearia?", e a resposta dele fica guardada. Se um dia alguém perguntar, você tem como mostrar que pediu.

### Criança só com o responsável

Foto de criança, só com autorização de quem é responsável por ela, e de preferência sem mostrar o rosto. Na dúvida, não poste.

### Quando pedirem pra tirar

Se um cliente pedir pra apagar uma foto, apague no mesmo dia, sem discussão, e agradeça por ele ter avisado. A foto de uma pessoa é informação pessoal dela, e a lei brasileira protege a imagem e os dados de cada um.

### O que não postar nunca

- Cliente dormindo, de boca aberta ou em situação que ele não aprovaria.
- Conversa de WhatsApp com nome e número de cliente aparecendo.
- Tela da agenda com nomes e telefones de outras pessoas.
- Foto tirada na rua de alguém que não é cliente, sem pedir.

### Para pensar

- Você tem como mostrar que pediu licença pras fotos que estão no seu perfil hoje?
- Existe alguma foto antiga no seu perfil que o cliente talvez não aprovasse?"""},
]


# ---------------------------------------------------------------- abrir e organizar
# Conferido em 26/10/2026 no texto atualizado da Câmara dos Deputados:
# - LC 123/2006, art. 18-A §4º (MEI: um estabelecimento, sem participar de outra empresa) e
#   art. 18-C (um único empregado, com salário mínimo ou piso). Limites pela LC 238/2026.
# - Lei 12.592/2012: reconhece a profissão (art. 1º), esterilização (art. 4º), dia nacional
#   na data da promulgação, 18 de janeiro (art. 5º); arts. 1º-A a 1º-D (salão-parceiro, Lei 13.352/2016).
# - STF, ADI 5625 (28/10/2021): parceria constitucional; nula se disfarçar emprego.
# - Lei 8.245/1991, art. 51 (renovatória). DAS do MEI 2026: Receita Federal.
CAMARA_12592 = "https://www2.camara.leg.br/legin/fed/lei/2012/lei-12592-18-janeiro-2012-612301-normaatualizada-pl.html"
CAMARA_LC123 = "https://www2.camara.leg.br/legin/fed/leicom/2006/leicomplementar-123-14-dezembro-2006-548099-normaatualizada-pl.html"
CAMARA_8245 = "https://www2.camara.leg.br/legin/fed/lei/1991/lei-8245-18-outubro-1991-322506-normaatualizada-pl.html"

AB = [
{"id": "mei-ou-me", "titulo": "MEI, ME ou parceiro: o formato certo pra começar", "conteudo": f"""Antes de pintar a parede ou comprar a cadeira, vale decidir como a barbearia vai existir no papel. O formato muda quanto você paga de imposto, quem pode trabalhar com você e quanto pode faturar.

### MEI: o caminho mais comum

A maioria dos barbeiros que trabalha sozinho começa como MEI, o microempreendedor individual. Pra quem presta serviço, o imposto é um valor fixo por mês, o DAS: em 2026, R$ 86,05 (R$ 81,05 de INSS e R$ 5,00 de ISS), segundo a Receita Federal. Com ele você tem CNPJ, emite nota e contribui pra aposentadoria.

Mas o MEI tem regras que pesam numa barbearia, todas na Lei Complementar 123 ([texto atualizado]({CAMARA_LC123})):

- **Limite de faturamento:** R$ 81 mil em 2026, R$ 110 mil em 2027 e R$ 140 mil a partir de 2028 ([veja a matéria](/revista/mei-vai-poder-faturar-mais-2027-2028)).
- **Um empregado só,** recebendo um salário mínimo ou o piso da categoria.
- **Um estabelecimento só.** Abrir a segunda unidade não cabe no MEI.
- **Sem sociedade:** quem é MEI não pode ser titular, sócio ou administrador de outra empresa.

### Quando passar pra microempresa (ME)

Se a barbearia vai ter sócio, mais de um funcionário, segunda unidade, ou faturar acima do limite, o caminho é a microempresa, normalmente no Simples Nacional. O imposto deixa de ser fixo e passa a ser uma porcentagem do faturamento, e você vai precisar de contador.

Não é bicho de sete cabeças: é o passo natural de quem cresceu. O erro é crescer como ME funcionando como MEI, sem perceber.

### E o barbeiro que trabalha na barbearia de outro?

Ele pode ser empregado (com carteira), ou trabalhar como parceiro, pelo contrato de salão-parceiro previsto em lei. Esse formato tem regras próprias e é o assunto do módulo 2.

### Na prática

| Situação | Formato mais comum |
|---|---|
| Trabalho sozinho, fatura até o limite | MEI |
| Tenho um ajudante com salário mínimo | MEI (um empregado) |
| Vou ter sócio, segunda unidade ou equipe | Microempresa, com contador |
| Trabalho na cadeira da barbearia de outro | Empregado ou profissional-parceiro |

*Este curso explica as regras gerais. Antes de abrir ou mudar de formato, converse com um contador.*

### Para pensar

- Quanto sua barbearia faturou nos últimos 12 meses? Cabe no limite do MEI?
- Daqui a dois anos, você imagina a barbearia com quantas cadeiras?"""},

{"id": "profissao-e-higiene", "titulo": "Profissão reconhecida e as regras de higiene", "conteudo": f"""Desde 2012, barbeiro é profissão reconhecida em todo o Brasil pela Lei 12.592 ([texto atualizado]({CAMARA_12592})). A lei é curta, mas tem três pontos que todo dono de barbearia precisa conhecer.

### O que a lei diz

O artigo 1º reconhece as atividades de cabeleireiro, barbeiro, esteticista, manicure, pedicure, depilador e maquiador, e define esses profissionais como quem trabalha com "higiene e embelezamento capilar, estético, facial e corporal".

O artigo 4º é o mais importante pro dia a dia: os profissionais "deverão obedecer às normas sanitárias, efetuando a esterilização de materiais e utensílios utilizados no atendimento a seus clientes". Ou seja, esterilizar não é capricho, é obrigação.

E o artigo 5º criou o Dia Nacional do Cabeleireiro, Barbeiro, Esteticista, Manicure, Pedicure, Depilador e Maquiador, comemorado na data da promulgação da lei: 18 de janeiro. Uma boa data pro calendário da sua barbearia.

### Higiene na prática

As regras detalhadas de higiene são da vigilância sanitária, e cada estado e município tem as suas. Em geral, elas cobram:

- Lâmina descartável, trocada a cada cliente.
- Material que não é descartável (tesoura, pente, pinça) limpo e esterilizado entre um cliente e outro.
- Bancada, cadeira e lavatório limpos, e lixo com tampa.
- Toalhas e capas lavadas, separadas das usadas.

Procure a vigilância sanitária da sua cidade, ou o site da prefeitura, e pergunte quais são as exigências pra barbearia. Ter isso por escrito evita surpresa na fiscalização.

### Alvará e licença de funcionamento

Também depende da prefeitura. Algumas atividades de baixo risco foram dispensadas de alvará pela lei federal de liberdade econômica, mas a classificação e o procedimento variam de cidade pra cidade. O caminho seguro é consultar a prefeitura (ou o contador) antes de abrir as portas e guardar o comprovante.

### Mostre que segue as regras

Como vimos em [atendimento](/cursos/atendimento-que-vira-ritual), higiene que o cliente vê vale dobrado: abrir a lâmina na frente dele e manter o esterilizador à vista transforma uma obrigação em argumento de venda.

### Para pensar

- Você sabe quais são as exigências da vigilância sanitária da sua cidade pra barbearia?
- Como o cliente percebe, hoje, que seu material é esterilizado?"""},

{"id": "salao-parceiro", "titulo": "Barbeiro parceiro: o que diz a lei do salão-parceiro", "conteudo": f"""Muita barbearia trabalha com barbeiros que ficam com uma porcentagem de cada serviço. Desde 2016, a Lei 13.352 colocou esse arranjo dentro da Lei 12.592, com o nome de salão-parceiro e profissional-parceiro ([texto atualizado]({CAMARA_12592})). Feito do jeito certo, é seguro pros dois lados. Feito de qualquer jeito, pode virar processo trabalhista.

### Como funciona

- O salão-parceiro centraliza os pagamentos dos clientes.
- Ele retém a sua parte (a cota-parte combinada) e também os impostos e contribuições que o profissional deve sobre a parte dele.
- A parte do salão é a título de aluguel de bens e de serviços de gestão; a parte do barbeiro, de prestação de serviços de beleza.
- O profissional-parceiro pode ser MEI, micro ou pequeno empresário.
- Enquanto durar a parceria, não há relação de emprego nem de sociedade entre eles.

### O contrato tem que ter

A lei exige contrato **escrito**, homologado pelo sindicato da categoria (ou, sem sindicato, pelo órgão local do Ministério do Trabalho), com duas testemunhas. E lista cláusulas obrigatórias:

1. O percentual que o salão retém de cada serviço.
2. A obrigação do salão de reter e recolher os tributos do parceiro.
3. Condições e prazo de pagamento do parceiro, por tipo de serviço.
4. Os direitos do parceiro sobre o uso dos materiais e o acesso ao local.
5. Rescisão por qualquer um dos lados, com aviso de pelo menos 30 dias.
6. Responsabilidades de cada um com a higiene, o funcionamento e o bom atendimento.
7. A obrigação do parceiro de manter o cadastro dele em dia.

### Quando vira emprego

A própria lei diz que há vínculo de emprego quando não existe o contrato formalizado desse jeito, ou quando o parceiro faz funções diferentes das do contrato (por exemplo, atender caixa ou limpar a barbearia como tarefa).

Em 2021, o Supremo Tribunal Federal julgou a lei e decidiu que ela é constitucional, com uma ressalva: o contrato de parceria é nulo quando usado pra disfarçar uma relação de emprego que existe de fato (ADI 5625). Ou seja: horário imposto, ordens como de patrão e exclusividade forçada podem pesar mais do que o papel assinado.

### Na prática

- Combine a porcentagem e o resto por escrito, antes de começar.
- Leve o contrato pra homologar no sindicato.
- Trate o parceiro como parceiro: ele tem a agenda e os clientes dele.
- Retenha e recolha os tributos como a lei manda.

*Este é um resumo da lei, não orientação jurídica. Monte o primeiro contrato com um contador ou advogado.*

### Para pensar

- Os barbeiros que trabalham com você hoje têm contrato escrito?
- Na rotina, a sua relação com eles parece mais de parceria ou de emprego?"""},

{"id": "montar-a-equipe", "titulo": "Montar a equipe: empregado, parceiro ou sozinho", "conteudo": """Mais cadeiras não quer dizer mais lucro. Cada formato de equipe tem custos, riscos e um tipo de relação diferente. Vale escolher olhando o número, não só a vontade de crescer.

### Os três caminhos

**Sozinho.** Menos custo, mais controle, e o teto é a sua agenda. Funciona muito bem como MEI e com agenda online bem organizada.

**Com empregado.** Você paga salário, encargos e férias, e em troca define horário, tarefas e jeito de atender. O MEI pode ter um empregado só, com salário mínimo ou o piso da categoria. Mais que isso, é microempresa.

**Com parceiros.** O barbeiro fica com uma porcentagem de cada serviço, tem a própria agenda e os próprios clientes, e o salão retém a parte dele e os tributos, como vimos na lição anterior. Exige contrato escrito e homologado.

### Compare antes de decidir

| | Empregado | Profissional-parceiro |
|---|---|---|
| Quem define o horário | O dono | Combinado no contrato |
| Como recebe | Salário fixo | Porcentagem dos serviços |
| Custo num mês fraco | Igual | Cai junto com o movimento |
| Contrato | Carteira assinada | Contrato escrito, homologado no sindicato |
| Risco de processo | Baixo, se tudo em dia | Alto se a parceria for só no papel |

### Faça a conta da cadeira

Antes de pôr mais uma cadeira, calcule quanto ela precisa render. Conta de exemplo: se a cadeira nova custa R$ 1.500 por mês (espaço, energia, produtos, parte da reforma) e o corte médio deixa R$ 20 pra barbearia depois de pagar o barbeiro, ela só se paga a partir de 75 cortes por mês. Abaixo disso, a cadeira está dando prejuízo.

### Escolher quem

Técnica se ensina; jeito de tratar o cliente é mais difícil. Na entrevista, além do corte de teste, observe como a pessoa conversa, como cuida da bancada e se chega no horário. Uma semana de experiência paga, combinada por escrito, mostra mais que qualquer currículo.

O curso [Liderar sua equipe](/cursos/liderar-sua-equipe) aprofunda como treinar, motivar e dar retorno pra quem trabalha com você.

### Para pensar

- Quantos cortes por mês a sua próxima cadeira precisaria fazer pra se pagar?
- O que você mais valoriza num barbeiro, além da técnica?"""},

{"id": "o-ponto", "titulo": "O ponto: aluguel, reforma e contrato", "conteudo": f"""O lugar certo traz cliente sozinho; o contrato errado pode fechar a barbearia, mesmo cheia. Em Lisboa, a barbearia mais antiga de Portugal em atividade fechou em 2023 porque o aluguel subiu de € 1.000 pra € 2.900 ([episódio 5](/revista/lisboa-barbearia-campos)).

### Escolher o ponto

- **Passagem de gente do seu público.** Fique meia hora na calçada, num sábado de manhã e num dia de semana à tarde, contando quem passa.
- **Visibilidade.** A fachada aparece de longe? Dá pra colocar placa?
- **Acesso.** Perto de ponto de ônibus, com lugar pra parar o carro ou a moto.
- **Vizinhos.** Academia, escola e comércio de rua trazem movimento. Outra barbearia na porta ao lado não é proibido, mas exige um diferencial claro.

### O contrato

Leia antes de assinar, de preferência com alguém que entenda:

- **Reajuste:** qual índice corrige o aluguel e quando. Faça a conta de cinco anos, não só do primeiro mês.
- **Prazo:** contrato curto deixa você sem garantia de ficar depois de investir na reforma.
- **Reforma:** quem paga e o que acontece com ela se você sair.
- **Destinação:** o contrato tem que permitir uso comercial pra barbearia.

### O direito de renovar

O artigo 51 da Lei do Inquilinato ([texto atualizado]({CAMARA_8245})) garante a renovação do aluguel comercial quando três coisas se somam: contrato escrito e com prazo determinado, cinco anos ou mais de contrato (somando os seguidos) e três anos sem parar no mesmo ramo. A ação tem prazo: tem que ser proposta entre um ano e seis meses antes do fim do contrato. Por isso, contratos curtos e renovados de boca deixam o inquilino desprotegido.

### Quanto o aluguel pode pesar

Acompanhe o aluguel como porcentagem do faturamento. Conta de exemplo: faturando R$ 15 mil por mês com aluguel de R$ 2.500, ele leva cerca de 17% de tudo que entra. Quando esse número sobe ano após ano, é hora de renegociar antes de atrasar.

### Reforma com cabeça

Gaste primeiro no que o cliente sente: cadeira boa, luz boa, lavatório funcionando, ar fresco, banheiro limpo. Decoração cara pode esperar o caixa crescer.

*Contrato de aluguel é assunto jurídico. Antes de assinar ou renovar, fale com um advogado.*

### Para pensar

- O seu contrato atual dá direito à renovatória? Quando ele vence?
- Quanto o aluguel representa hoje do seu faturamento?"""},

{"id": "primeiros-30-dias", "titulo": "Os primeiros 30 dias", "conteudo": """A barbearia abriu. O primeiro mês define o ritmo dos próximos: se os primeiros clientes saem satisfeitos e voltam, o boca a boca começa a trabalhar por você.

### Antes de abrir a porta

- **Página do Google pronta,** com endereço, horário, telefone e fotos. Quem passa na frente e procura no celular tem que te achar.
- **Instagram com pelo menos 9 posts:** fachada, ambiente, você trabalhando e alguns cortes. Perfil vazio não passa confiança.
- **Agenda organizada,** de preferência online, pra ninguém ficar sem resposta.

O curso [Marketing pra barbearia](/cursos/marketing-pra-barbearia) mostra cada um desses passos, e o [Foto e vídeo com o celular](/cursos/foto-e-video-com-o-celular) ensina a fazer as fotos.

### Avise quem você conhece, um por um

Faça uma lista de 50 pessoas: amigos, ex-clientes, vizinhos, colegas. Mande uma mensagem pessoal pra cada um, com o nome, contando que abriu e convidando pra conhecer. Mensagem individual, não lista de transmissão. Peça também que indiquem um amigo.

### Inauguração simples

Um sábado de portas abertas, com café, música e um desconto de inauguração com data pra acabar, já movimenta. Convide os vizinhos de comércio: eles vão indicar você se te conhecerem.

### Parcerias no bairro

Em Havana, o barbeiro Papito transformou a rua inteira juntando forças com os vizinhos ([episódio 6](/revista/havana-callejon-de-los-peluqueros)). Comece pequeno: um cartão de desconto cruzado com a academia, a lanchonete ou a loja de roupa da esquina.

### Cada cliente novo é uma semente

No primeiro mês, cada atendimento conta em dobro:

- Pergunte o nome e anote.
- Pergunte como ele conheceu a barbearia, e anote também. Em poucas semanas você sabe o que funciona.
- Marque o próximo horário antes dele sair.
- Peça a avaliação no Google pra todos.

### Meça

No fim dos 30 dias, olhe três números: quantos clientes atendeu, quantos voltaram ou já marcaram o retorno e quantas avaliações recebeu. Eles dizem mais sobre o futuro da barbearia do que o faturamento do primeiro mês.

### Para pensar

- Quem são as 50 pessoas da sua lista?
- Qual vizinho de comércio seria o melhor parceiro pra você?"""},
]


# ---------------------------------------------------------------- agenda
AG = [
{"id": "montar-a-agenda", "titulo": "Montar uma agenda que cabe no dia", "conteudo": """Agenda que atrasa todo dia não é azar, é agenda montada errado. Antes de pensar em encher, vale arrumar a forma: quanto tempo cada serviço leva de verdade e onde ficam as folgas.

### Cronometre uma semana

Durante uma semana, anote quanto tempo cada serviço levou do cliente sentar até ele levantar, incluindo a conversa, a limpeza da bancada e o pagamento. Quase todo barbeiro descobre que o "corte de 30 minutos" leva 40.

Com os números na mão, ajuste a agenda pelo tempo real, não pelo tempo ideal. Se o corte leva 40 minutos, marque de 45 em 45. Atender seis clientes no horário vale mais do que marcar oito e atrasar todos.

### Serviço longo tem horário certo

Barba completa, platinado, pacote do noivo: serviços longos atrapalham quando caem no meio do pico. Reserve pra eles os horários mais calmos (manhã de dia de semana, por exemplo) e deixe os horários de pico pros serviços rápidos.

### Deixe uma folga por turno

Uma janela de 15 a 30 minutos no meio da manhã e outra no meio da tarde absorvem atrasos, um encaixe ou um café. Agenda sem folga nenhuma transforma o primeiro atraso do dia em atraso de todos os outros.

### Mostre só o que você consegue cumprir

Se você usa agenda online, configure o tempo de cada serviço e os intervalos de acordo com o que mediu. O cliente vê apenas os horários livres de verdade e marca sozinho, e você para de responder "tem horário amanhã?" o dia inteiro.

### Na prática

| Antes | Depois |
|---|---|
| Corte marcado de 30 em 30 | Corte marcado pelo tempo real (ex.: 45 min) |
| Barba completa no sábado à tarde | Barba completa na terça de manhã |
| Nenhuma folga | Uma folga de 20 min por turno |

### Para pensar

- Quanto tempo o seu corte mais pedido leva de verdade, do sentar ao levantar?
- Em qual dia e horário a sua agenda sempre atrasa?"""},

{"id": "faltas-e-atrasos", "titulo": "Faltas e atrasos: como diminuir sem perder o cliente", "conteudo": """Cliente que marca e não aparece é cadeira vazia num horário que outra pessoa queria. Não dá pra zerar as faltas, mas dá pra diminuir bastante, e sem tratar o cliente como culpado.

### Lembrete na véspera

A maioria das faltas é esquecimento. Uma mensagem no dia anterior, com o horário e um jeito fácil de desmarcar, resolve boa parte: "Oi, Carlos! Lembrando do seu horário amanhã às 15h. Se não puder vir, me avisa que eu libero pra outra pessoa". O tom importa: é um lembrete, não uma cobrança.

### Facilite desmarcar

Parece contraditório, mas quanto mais fácil desmarcar, menos gente falta. Quem não consegue avisar some; quem consegue, avisa e libera o horário. Um link pra remarcar ou cancelar, ou um simples "me responde aqui", já ajuda.

### Uma regra clara, dita antes

Defina uma regra simples e conte pro cliente na hora de marcar, não depois que ele faltou. Por exemplo: "Tolerância de 10 minutos; depois disso, a gente tenta encaixar, mas pode precisar remarcar". Regra dita antes é combinado; regra inventada depois é briga.

Com quem falta sempre, dá pra conversar com respeito e pedir confirmação no dia, ou só marcar com ele em horários menos disputados.

### Atraso seu também conta

O cliente que espera 30 minutos depois do horário marcado não acha que a barbearia é cheia; acha que ela é desorganizada. Se vai atrasar, avise antes do horário dele, com uma estimativa honesta. Ele pode decidir chegar mais tarde em vez de esperar sentado.

### Anote e meça

Conte, todo mês, quantos horários foram perdidos por falta. Conta de exemplo: 12 faltas num mês, com corte a R$ 45, são R$ 540 que poderiam ter entrado. Ver o número ajuda a decidir se vale apertar a regra ou mandar o lembrete com mais antecedência.

### Para pensar

- Quantas faltas você teve no último mês? Quanto isso deu em reais?
- Qual seria a sua regra de tolerância, dita em uma frase?"""},

{"id": "encaixes-e-fila", "titulo": "Encaixes, fila e quem chega sem marcar", "conteudo": """Muita barbearia vive das duas coisas ao mesmo tempo: horário marcado e cliente que chega na porta. Misturar sem regra vira confusão; misturar com regra aumenta o faturamento sem atrasar ninguém.

### Decida o seu modelo

- **Só agenda:** previsível, sem fila na porta. Funciona bem com clientela fiel.
- **Só ordem de chegada:** simples, bom pra ponto de muito movimento, ruim pra quem não pode esperar.
- **Os dois:** a agenda garante o fixo e quem chega preenche os buracos.

No modelo misto, escreva a regra e diga pro cliente: quem marcou tem prioridade no horário dele; quem chega entra nas folgas, na ordem.

### Mostre a fila

Quem passa na frente e vê três pessoas esperando vai embora sem saber que o próximo horário livre era em 15 minutos. Mostrar a fila no status do WhatsApp, numa plaquinha ou no site (como faz a rede japonesa QB House com um semáforo na porta, [na Revista](/revista/japao-barbear-de-ritual-e-corte-de-10-minutos)) deixa o cliente decidir com informação.

### O encaixe que não estraga o dia

Encaixar é ótimo quando não atrasa ninguém. Antes de dizer sim, olhe a próxima hora: se o encaixe cabe na folga ou numa falta, entra. Se vai empurrar quem marcou, ofereça o próximo horário livre em vez de "dá um jeito".

### Lista de espera

Quando um horário disputado (sábado de manhã) é desmarcado, quem fica sabendo primeiro ganha. Mantenha uma lista curta de clientes que pediram aquele horário e avise um por vez, por mensagem individual.

### Feche quando precisar

Imprevisto acontece. Se precisar fechar mais cedo ou bloquear um horário, avise os clientes marcados o quanto antes e ofereça outro horário, em vez de deixar o cliente descobrir na porta.

### Para pensar

- Na sua barbearia, quem marcou sabe que tem prioridade? Quem chega sabe como funciona?
- Qual é o horário mais disputado da sua semana? Quem estaria na lista de espera dele?"""},

{"id": "agenda-que-se-enche", "titulo": "A agenda que se enche sozinha", "conteudo": """O melhor cliente é o que já volta marcado. Quando a maior parte da agenda é de retorno, os horários vazios ficam fáceis de preencher e a semana deixa de depender da sorte.

### Marque o próximo na saída

Antes do cliente levantar, ofereça o próximo horário pelo ritmo dele: "Seu degradê fica bom por umas três semanas. Sábado, dia 14, às 10h?". Como vimos no curso [Atendimento que vira ritual](/cursos/atendimento-que-vira-ritual), quem sai com o retorno marcado volta muito mais.

### Conheça o ritmo de cada cliente

Cada cliente tem um intervalo: o do degradê baixo volta em 15 dias, o do social em 30. Anote. Quando o intervalo passar e ele não tiver marcado, uma mensagem individual traz de volta: "Faz três semanas do último corte. Quer que eu guarde um horário?".

### Preencha a semana fraca com motivo

Toda barbearia tem dia fraco, geralmente no começo da semana. Em vez de desconto pra todo mundo, dê motivo pra quem pode vir nesses dias: um combo de corte e barba com preço especial só na terça, o horário mais calmo pro serviço longo, o atendimento das crianças.

### Plano mensal

Um plano com dois cortes por mês, ou barba toda semana, transforma cliente frequente em agenda garantida. Ele paga antes, você sabe com quanto conta, e ele economiza. Nos Estados Unidos, as vendas de planos de assinatura de barbearia cresceram 20% em 2025, segundo uma empresa do setor ([na Revista](/revista/barbearias-eua-2026-clientes-fieis)).

### Olhe os números uma vez por mês

Três números bastam:

| Número | O que mostra |
|---|---|
| Ocupação (horários atendidos ÷ horários disponíveis) | Se falta cliente ou sobra agenda |
| Clientes que voltaram no mês | Se o atendimento está segurando a clientela |
| Faltas | Se o lembrete e a regra estão funcionando |

Com esses três, você sabe se precisa de cliente novo, de retorno ou de organização, e para de tentar resolver tudo com promoção.

### Para pensar

- Quantos dos clientes desta semana já saíram com o próximo horário marcado?
- Qual é o seu dia mais fraco? Que motivo faria alguém escolher vir nele?"""},
]


for c in [
    curso("atendimento-que-vira-ritual", "Atendimento que vira ritual",
          "Do \"bom dia\" ao próximo horário marcado: chegada, conversa antes do corte, etapas que o cliente lembra, higiene, saída e pós-atendimento, com exemplos de barbearias do mundo.",
          "Atendimento", ["barbearia", "atendimento", "fidelização", "experiência"],
          [{"id": "antes", "titulo": "Antes do corte", "licoes": A[0:2]},
           {"id": "durante", "titulo": "Durante", "licoes": A[2:4]},
           {"id": "depois", "titulo": "Depois", "licoes": A[4:6]}]),
    curso("foto-e-video-com-o-celular", "Foto e vídeo da barbearia com o celular",
          "Luz, fundo, ângulos, antes e depois, vídeo curto, edição no próprio celular, onde postar e como pedir licença ao cliente. Tudo com o celular que você já tem.",
          "Marketing", ["barbearia", "fotografia", "vídeo", "instagram"],
          [{"id": "foto", "titulo": "Foto que vende", "licoes": FV[0:2]},
           {"id": "video", "titulo": "Vídeo curto", "licoes": FV[2:4]},
           {"id": "usar", "titulo": "Usar as fotos", "licoes": FV[4:6]}]),
    curso("abrir-e-organizar-sua-barbearia", "Abrir e organizar sua barbearia",
          "MEI ou microempresa, a lei da profissão e as regras de higiene, barbeiro parceiro (Lei do Salão-Parceiro), montar a equipe, escolher o ponto e o contrato, e os primeiros 30 dias.",
          "Gestão", ["barbearia", "abrir negócio", "MEI", "salão-parceiro", "aluguel"],
          [{"id": "formalizar", "titulo": "Formalizar", "licoes": AB[0:2]},
           {"id": "equipe", "titulo": "Equipe", "licoes": AB[2:4]},
           {"id": "ponto", "titulo": "Ponto e primeiros clientes", "licoes": AB[4:6]}]),
    curso("agenda-cheia", "Agenda cheia: faltas, atrasos e encaixes",
          "Montar a agenda pelo tempo real, diminuir faltas e atrasos, misturar horário marcado com quem chega, e fazer a agenda se encher com clientes que voltam.",
          "Gestão", ["barbearia", "agenda", "atendimento", "organização"],
          [{"id": "organizar", "titulo": "Organizar", "licoes": AG[0:2]},
           {"id": "encher", "titulo": "Encher", "licoes": AG[2:4]}]),
]:
    json.dump(c, open(os.path.join(DESTINO, c["slug"] + ".json"), "w"), ensure_ascii=False, indent=2)
    print("ok", c["slug"], sum(len(m["licoes"]) for m in c["modulos"]), "lições",
          sum(len(l["conteudo"].split()) for m in c["modulos"] for l in m["licoes"]), "palavras")
