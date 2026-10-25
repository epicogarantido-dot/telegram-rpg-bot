import json, sys

URL = "https://openstax.org/books/introduction-business/pages/"
AUTORES = ["Lawrence J. Gitman", "Carl McDaniel", "Amit Shah", "Monique Reece", "Linda Koffel", "Bethann Talsma", "James C. Hyatt"]
ATRIBUICAO = ("Traduzido e adaptado de “Introduction to Business”, de Lawrence J. Gitman, Carl McDaniel, Amit Shah, "
              "Monique Reece, Linda Koffel, Bethann Talsma e James C. Hyatt (OpenStax, Rice University), licenciado sob "
              "CC BY 4.0. Mudanças: tradução para o português, resumo das seções e exemplos para barbearias "
              "(trechos “Na barbearia”), que não fazem parte do original. Original grátis em openstax.org.")

licoes = [
{
"id": "cliente-no-centro",
"titulo": "O cliente no centro",
"urlOriginal": URL + "11-1-the-marketing-concept",
"conteudo": """Marketing é levar **o produto certo às pessoas certas, no lugar, na hora e pelo preço certos**, com a divulgação certa e as pessoas certas cuidando do atendimento. Os autores chamam isso de **princípio do "certo"**, a base de toda estratégia de marketing.

Em outras palavras: marketing é descobrir o que os possíveis clientes precisam e querem, e entregar algo que **atenda ou supere as expectativas** deles. É criar **trocas**: as duas partes dão algo de valor uma pra outra. Normalmente, o cliente troca dinheiro por um produto ou serviço.

### Marketing não é a mesma coisa que venda

- **Vender** é efetivamente fechar a venda com o cliente.
- **Marketing** é comunicar o valor do produto ou serviço pra que ele venda.

Pense na sua última compra: e se o preço fosse 30% maior? E se o lugar fosse mais difícil de chegar? Você teria comprado? Quem faz marketing controla muitos desses fatores.

### O conceito de marketing

As empresas de sucesso usam o **conceito de marketing**: usar informações sobre os clientes pra entender o que eles precisam e querem, e montar a estratégia a partir disso, atendendo o cliente **e** as metas do negócio. Na prática:

- Focar no que o cliente precisa e quer, pra se diferenciar dos concorrentes.
- Fazer **todas** as áreas trabalharem por isso, do atendimento à divulgação.
- Atingir as metas de longo prazo satisfazendo o cliente de forma legal e responsável.

Dois exemplos do livro: uma locadora de carros descobriu que os clientes não queriam ir até a loja e passou a **entregar o carro em casa**; a Disney viu que muita gente odiava fila e criou um **passe pra furar fila, pago à parte**. O ponto-chave: **primeiro se descobre o que o cliente quer, depois se cria o produto**, e não o contrário.

### Na barbearia (adaptação)

- O princípio do "certo" aplicado: o **corte certo**, no **horário certo** (inclusive à noite e no sábado, se é quando seu cliente pode), pelo **preço certo**, com quem atende bem.
- "Odeio esperar" é a fila da Disney da barbearia: **horário marcado** e **mostrar a fila** no site resolvem isso.
- Antes de lançar algo, pergunte. Um cliente que pede pra marcar pelo celular às 23h está dizendo do que precisa.

### Para pensar

- Qual a diferença entre marketing e venda?
- O que seus clientes mais reclamam de barbearia em geral? Você resolve isso?"""
},
{
"id": "valor-satisfacao-relacionamento",
"titulo": "Valor, satisfação e relacionamento",
"urlOriginal": URL + "11-1-the-marketing-concept",
"conteudo": """### Valor para o cliente

**Valor para o cliente** é a relação entre os **benefícios** que ele recebe e o **sacrifício** que faz pra ter esses benefícios. Quem decide quanto vale cada um é o próprio cliente.

A ideia por trás disso: **preço não é a única coisa que importa**. Muitos clientes pagam mais por um atendimento superior, ou aceitam menos serviços por um preço melhor. O livro alerta: **não baseie o seu valor só no preço**. Quem só liga pra preço vai embora assim que o concorrente cobrar menos. É melhor apostar em **relacionamento e atendimento**, que são muito mais difíceis de copiar.

Exemplo do livro: uma companhia aérea econômica não oferece lugar marcado nem refeição, mas entrega o que promete (**sair no horário**) e ganha das companhias "completas" nas pesquisas de valor.

### Satisfação do cliente

**Satisfação** é a sensação do cliente de que o produto **atendeu ou superou as expectativas**. E as expectativas vêm muito da comunicação, principalmente da divulgação: **o que você promete vira a régua do cliente**.

### Relacionamento

**Marketing de relacionamento** é construir **parcerias de longo prazo** com os clientes, entregando valor e satisfação. Quando existe relacionamento, o cliente tende a continuar comprando da mesma empresa **mesmo que o concorrente cobre menos ou faça promoção**. As pessoas compram de quem confiam.

Pra empresa, isso significa vendas repetidas e indicações. E os custos caem, porque **atender quem já é cliente custa menos do que conquistar um novo**. O livro cita estudos segundo os quais **aumentar em 5% a retenção de clientes aumenta o lucro de 25% a 95%**.

**Programas de fidelidade** são uma ótima forma de criar relacionamento: as companhias aéreas dão uma passagem grátis depois de certo número de milhas. Uma delas vai além e manda **cartão de aniversário** pros membros.

### Na barbearia (adaptação)

- **Prometa o que entrega.** Se a divulgação diz "sem espera", o cliente vai cobrar isso.
- **Cartão fidelidade:** a cada 10 cortes, 1 grátis. Simples e funciona.
- **Lembre do cliente:** nome, como ele gosta do corte, o time dele. Isso é relacionamento, e o concorrente da esquina não copia.
- **Mensagem no aniversário**, enviada por você mesmo, uma a uma, pra quem deixou o contato.
- Faça a conta: um cliente que corta a cada 3 semanas, a R$ 40, vale cerca de **R$ 700 por ano**. Perder um cliente por mau atendimento custa caro.

### Para pensar

- Qual a diferença entre valor e satisfação?
- O que faria um cliente seu continuar com você mesmo se abrisse uma barbearia mais barata do lado?"""
},
{
"id": "como-o-cliente-decide",
"titulo": "Como o cliente decide",
"urlOriginal": URL + "11-4-buyer-behavior",
"conteudo": """**Comportamento do comprador** são as ações das pessoas ao comprar e usar produtos. Entender isso ajuda a prever, por exemplo, como mudar o preço afeta a percepção do produto, ou como **uma avaliação nas redes sociais pode mudar tudo**.

### As 5 etapas da decisão

1. **Reconhecer a necessidade.** Pode ser simples (o café acabou) ou demorar meses (consertos repetidos levam alguém a decidir trocar de carro).
2. **Buscar informação.** Pesquisar opções, preços, lugares.
3. **Avaliar as alternativas.** Eliminar o que não serve (ex.: "nada a mais de 30 minutos de casa").
4. **Decidir comprar (ou não).**
5. **Avaliar depois da compra.** O cliente avalia **o produto e também a experiência de compra**.

### O que influencia a decisão

- **Cultura:** valores, ideias e costumes do grupo em que a pessoa vive.
- **Fatores sociais:** quanto maior o risco percebido, mais a pessoa **pede opinião dos outros**. Ela observa os **grupos de referência** (amigos, colegas de trabalho, time, igreja) e usa os mesmos critérios. Também ouve **formadores de opinião** e a família.
- **Fatores individuais:** características de cada um, como personalidade. O livro cita pesquisas segundo as quais homens tendem a querer **compras simples, com menos opções e mais conveniência**, e tendem a comprar quando a necessidade é imediata.
- **Fatores psicológicos:** percepção, crenças e atitudes. Mudam conforme o momento e o ambiente.

### Na barbearia (adaptação)

1. **Necessidade:** "meu cabelo está grande", "tenho casamento sábado".
2. **Informação:** o cliente procura no Google, no Instagram, pergunta pros amigos. **Fotos dos seus cortes e avaliações** pesam muito aqui.
3. **Alternativas:** perto de casa? Tem horário hoje? Quanto custa?
4. **Decisão:** quanto mais fácil marcar, menos gente desiste no caminho.
5. **Depois:** ele avalia o corte **e** a experiência (esperou? foi bem tratado?). É aí que ele decide se volta e se indica.

- Como muita gente pede opinião antes, **indicação e avaliação** são ouro.
- Pra quem quer conveniência: **poucos passos pra marcar**, horário claro, endereço com mapa.

### Para pensar

- Em qual das 5 etapas você perde mais clientes?
- Quem são os "formadores de opinião" que mandam clientes pra você?"""
},
{
"id": "quem-e-o-seu-cliente",
"titulo": "Quem é o seu cliente (e como descobrir)",
"urlOriginal": URL + "11-5-market-segmentation",
"conteudo": """Quase nenhuma empresa consegue atender o mercado inteiro, e montar uma estratégia diferente pra cada pedaço dele sairia muito caro. Por isso se faz **segmentação de mercado**: dividir o mercado em grupos e escolher aqueles em que você tem mais chance de sucesso.

### As 5 formas de segmentar

| Tipo | O que considera |
|---|---|
| **Demográfica** | idade, escolaridade, gênero, renda, tamanho da família |
| **Geográfica** | região, cidade, bairro, densidade de pessoas, clima |
| **Psicográfica** | estilo de vida, personalidade, interesses, valores |
| **Por benefício** | o que o produto faz pela pessoa |
| **Por volume** | quanto a pessoa usa (pouco ou muito) |

- A **demográfica** é a mais comum porque os dados são fáceis de conseguir, mas mostra pouco sobre as pessoas.
- A **psicográfica** completa o quadro. O livro compara dois gerentes de 35 anos com a mesma renda: um é capitão de um time de rúgbi, o outro tem assinatura de ópera. A mensagem pra cada um deveria ser diferente. "A demografia dá o esqueleto; a psicografia põe a carne nos ossos."
- **Por benefício:** uma marca de pasta de dente divide seus produtos entre "contra cárie", "contra tártaro", "pra crianças", "pra gengiva".
- **Por volume:** quase todo produto tem clientes que usam muito, pouco ou nada. **Quem usa muito costuma responder por uma parte enorme das vendas**; no fast-food, o livro cita que 1 em cada 5 clientes faz mais de 60% das visitas.

### Pesquisa: ouvir a voz do cliente

**Pesquisa de marketing** é planejar, coletar e analisar informações pra tomar uma decisão. Três métodos básicos:

- **Questionário (levantamento):** perguntar, pessoalmente, pela internet ou por telefone.
- **Observação:** acompanhar o que as pessoas fazem, sem perguntar.
- **Experimento:** mudar uma coisa (preço, divulgação) e medir o efeito nas vendas.

### Na barbearia (adaptação)

- **Benefício:** o pai quer rapidez e preço; o noivo quer o melhor dia da vida; o garoto quer o corte do jogador. Mesmo serviço, mensagens diferentes.
- **Volume:** seus clientes de 2 em 2 semanas valem muito. Conheça cada um pelo nome.
- **Geográfica:** a maioria dos clientes de barbearia mora ou trabalha perto. Divulgue no bairro.
- **Pesquisa barata:** 3 perguntas no fim do corte ("como nos achou?", "o que faria você vir mais?", "indicaria pra quem?").
- **Observação:** sua agenda online mostra os dias e horários mais procurados.
- **Experimento:** teste um combo só às terças por um mês e compare.

### Para pensar

- Descreva seu cliente que mais vem: idade, bairro, estilo, o que ele valoriza.
- Que pergunta você faria pros seus clientes esta semana?"""
},
{
"id": "atendimento-que-vende",
"titulo": "Atendimento que vende",
"urlOriginal": URL + "12-7-the-importance-of-personal-selling",
"conteudo": """**Venda pessoal** é a apresentação de venda **cara a cara** com um possível cliente. O livro aponta vantagens sobre outras formas de divulgação:

- Permite **explicar ou demonstrar** em detalhe, o que é ótimo pra serviços novos.
- A conversa se **adapta a cada cliente**, e as dúvidas são respondidas na hora.
- É dirigida só a quem tem interesse de verdade.
- O custo é controlado.
- E, talvez o mais importante, é **muito mais eficaz pra fechar a venda e deixar o cliente satisfeito**.

### O processo de venda (dá pra aprender)

1. **Encontrar e qualificar clientes.** Contatos que chegam por divulgação são chamados de **leads**. Nem todo contato é uma oportunidade real; três perguntas ajudam: a pessoa **precisa** do produto? **Pode decidir** a compra? **Pode pagar**?
2. **Abordar.** Despertar interesse com uma informação útil ou importante.
3. **Apresentar e demonstrar.** Hoje, apresentação "decorada" funciona mal. Funciona melhor uma **conversa**, mostrando benefícios e **ajudando o cliente a resolver o problema dele**, como um parceiro.
4. **Responder às objeções.** Quase todo cliente tem dúvidas. A melhor resposta é **conhecer muito bem o que você oferece**.
5. **Fechar.** A forma mais simples é **pedir**: "Posso anotar seu pedido?". Outra é agir como se estivesse decidido: "Fica pronto em duas semanas".
6. **Acompanhar depois.** A venda é só o começo. Conferir se o cliente ficou satisfeito cria **boa vontade** e traz novas vendas. **O objetivo é a venda repetida, por anos.**

### Na barbearia (adaptação)

A cadeira é o seu balcão de vendas:

- **Qualificar:** quem pergunta da barba toda vez é um cliente pra hidratação ou pro combo.
- **Abordar:** "Sua barba está com falhas aqui; tem um acabamento que resolve."
- **Demonstrar:** mostre no espelho, mostre fotos de antes e depois.
- **Objeção ("tá caro"):** explique o que está incluso e o resultado. Sem pressão.
- **Fechar:** "Já deixo marcado daqui a 3 semanas?" Marcar o próximo horário antes de o cliente sair é o fechamento mais simples que existe.
- **Acompanhar:** pergunte na próxima vez como ficou, ajuste o que for preciso.

### Para pensar

- Quais são as objeções que você mais ouve? Como você responde?
- Você já marca o próximo horário antes de o cliente ir embora?"""
},
{
"id": "boa-fama",
"titulo": "Boa fama e boca a boca",
"urlOriginal": URL + "12-9-public-relations-helps-build-goodwill",
"conteudo": """**Relações públicas** é qualquer comunicação ou atividade pensada pra **conquistar boa vontade ou prestígio** pra uma empresa ou pessoa. Inclui a **publicidade espontânea**: notícias sobre a empresa que saem na mídia **sem que ela pague** por isso. E ela pode ser boa ou ruim.

As empresas tentam gerar o máximo de notícia boa: mandam alguém falar em clubes e associações, incentivam funcionários a participar de ações da comunidade e divulgam **novidades de verdade** (um serviço novo, uma inauguração).

### Funções de relações públicas (resumo)

| Função | O que é |
|---|---|
| Relação com a imprensa | levar informações positivas e relevantes à mídia |
| Divulgação de produto | dar visibilidade a produtos ou serviços específicos |
| Comunicação | mensagens internas e externas que reforçam a boa imagem |
| Comunidade | criar e manter boas relações com a comunidade local |
| Relação com equipe | manter boa relação com funcionários e sócios |
| Gestão de crise | responder a uma notícia ruim ou um problema |

### Boca a boca

Boa parte das promoções e da publicidade busca **gerar comentário**. **Marketing de buzz (ou viral)** é o boca a boca intenso. O boca a boca comum passa de uma pessoa pra outra, em fila; o buzz acontece quando **todo mundo está falando do assunto ao mesmo tempo**. Muitas empresas acham que ele rende mais do que outras formas de divulgação.

### Na barbearia (adaptação)

- **Comunidade:** corte grátis num evento da escola do bairro, apoio ao time de várzea. Gente fala disso.
- **Novidade de verdade:** inauguração, serviço novo, um barbeiro novo na equipe. Conte pro jornal do bairro, pros grupos locais e no seu Instagram.
- **Gestão de crise:** respondeu mal uma avaliação negativa? Isso fica pior que a avaliação. Responda com calma, reconheça o erro e ofereça resolver.
- **Boca a boca:** o melhor anúncio é o cliente saindo feliz. Peça avaliação no Google pra quem gostou.

### Para pensar

- Qual a diferença entre relações públicas e anúncio pago?
- Que história boa da sua barbearia merecia ser contada no bairro?"""
},
]

curso = {
  "slug": "cliente-que-volta",
  "titulo": "Cliente que volta",
  "resumo": "Atendimento, relacionamento e boa fama: por que o cliente escolhe uma barbearia, por que volta e por que indica.",
  "area": "Atendimento",
  "nivel": "iniciante",
  "tags": ["barbearia", "atendimento", "fidelização", "clientes"],
  "idiomaOriginal": "en",
  "traducao": "automatica",
  "modulos": [
    {"id": "o-cliente", "titulo": "O cliente", "licoes": licoes[0:2]},
    {"id": "entender", "titulo": "Entender quem compra", "licoes": licoes[2:4]},
    {"id": "na-pratica", "titulo": "Na prática", "licoes": licoes[4:6]},
  ],
  "fonte": {
    "nome": "OpenStax",
    "url": "https://openstax.org/details/books/introduction-business",
    "tituloOriginal": "Introduction to Business",
    "autores": AUTORES,
    "licenca": "CC-BY-4.0",
    "atribuicao": ATRIBUICAO,
  },
  "atualizadoEm": "2026-10-25",
}
json.dump(curso, open(sys.argv[1], "w"), ensure_ascii=False, indent=2)
print("ok", sum(len(m["licoes"]) for m in curso["modulos"]), "lições")
