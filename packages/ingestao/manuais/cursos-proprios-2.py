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
                  "Exemplos de outros países vêm das matérias da Revista, com as fontes no fim de cada uma.",
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
]:
    json.dump(c, open(os.path.join(DESTINO, c["slug"] + ".json"), "w"), ensure_ascii=False, indent=2)
    print("ok", c["slug"], sum(len(m["licoes"]) for m in c["modulos"]), "lições",
          sum(len(l["conteudo"].split()) for m in c["modulos"] for l in m["licoes"]), "palavras")
