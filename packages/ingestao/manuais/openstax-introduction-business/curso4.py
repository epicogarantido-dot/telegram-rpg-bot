import json, sys

URL = "https://openstax.org/books/introduction-business/pages/"
AUTORES = ["Lawrence J. Gitman", "Carl McDaniel", "Amit Shah", "Monique Reece", "Linda Koffel", "Bethann Talsma", "James C. Hyatt"]
ATRIBUICAO = ("Traduzido e adaptado de “Introduction to Business”, de Lawrence J. Gitman, Carl McDaniel, Amit Shah, "
              "Monique Reece, Linda Koffel, Bethann Talsma e James C. Hyatt (OpenStax, Rice University), licenciado sob "
              "CC BY 4.0. Mudanças: tradução para o português, resumo das seções e exemplos para barbearias "
              "(trechos “Na barbearia”), que não fazem parte do original. Original grátis em openstax.org.")

licoes = [
{
"id": "de-onde-vem-a-lideranca",
"titulo": "De onde vem a liderança",
"urlOriginal": URL + "6-4-leading-guiding-and-motivating-others",
"conteudo": """**Liderança** é guiar e motivar pessoas pra alcançar os objetivos do negócio. E o livro faz uma distinção importante: **qualquer pessoa pode ser líder**, independente do cargo, se consegue influenciar os outros a agir — muitas vezes por escolha própria. Já o gerente é líder "de nomeação", e às vezes precisa recorrer a cobrança.

Pra liderar, é preciso **influenciar**. Essa capacidade se chama **poder**, e os pesquisadores apontam cinco fontes:

| Poder | De onde vem |
|---|---|
| **Legítimo** | do cargo (você é o dono) |
| **De recompensa** | de poder dar coisas boas (aumento, bônus, folga) |
| **Coercitivo** | de poder aplicar consequências ruins |
| **De especialista** | do conhecimento e da habilidade |
| **De referência** | do carisma, do respeito e da admiração que a pessoa inspira |

Bons líderes **combinam** essas fontes. O livro cita um diretor de uma grande empresa descrito assim por uma executiva do mercado: *"é um líder de quem as pessoas gostam. As orientações dele são muito simples. Ele define uma estratégia que todo mundo entende."*

### Estilos de liderança

- **Autocrático:** decide sozinho e dá instruções detalhadas; a informação só desce. Pode parecer decidido, mas muitas vezes é visto como **fechado e pesado**. A tendência das empresas é **se afastar** desse estilo.
- **Participativo:** divide decisões e estimula a conversa. Tem três jeitos: **democrático** (todos votam), **consensual** (todos precisam concordar) e **consultivo** (ouve todo mundo, mas a decisão final é do líder).
- **Rédea solta:** entrega o trabalho e deixa a pessoa decidir como fazer. Funciona com gente muito experiente, mas **sem expectativas claras e sem retorno** a pessoa se sente abandonada.

**Nenhum estilo funciona sempre.** O bom líder usa a **liderança situacional**: um funcionário novo pode precisar de orientação firme até aprender; depois, a mesma pessoa rende mais com espaço pra decidir.

### Na barbearia (adaptação)

- O barbeiro mais respeitado da casa nem sempre é o dono. Se ele tem **poder de especialista e de referência**, use isso a favor do time (ele pode treinar os novos).
- **Barbeiro recém-chegado:** combine o padrão da casa em detalhe (atendimento, tempo, limpeza). **Barbeiro experiente:** dê espaço, ouça, combine metas.
- **Consultivo** costuma funcionar bem: ouça a equipe sobre preço, horário e serviços novos, e depois decida.

### Para pensar

- Que tipo de poder você mais usa com sua equipe? E qual você gostaria de usar mais?
- Com quem do seu time você deveria mudar de estilo?"""
},
{
"id": "dar-autonomia-e-cultura",
"titulo": "Dar autonomia e criar o jeito da casa",
"urlOriginal": URL + "6-4-leading-guiding-and-motivating-others",
"conteudo": """### Dar autonomia (empoderamento)

**Empoderar** é dar à equipe **mais liberdade pra tomar decisões** e acesso ao que precisa pra colocar essas decisões em prática. Quando o poder de decidir é dividido, as pessoas sentem que o resultado **também é delas**.

O livro conta o caso de uma ferrovia americana depois de um furacão: 8 km de trilhos caíram num lago. Um engenheiro-chefe, com autonomia, juntou centenas de trabalhadores e oito guindastes e **içou os trilhos inteiros de volta** em poucas horas, em vez de esperar semanas por trilhos novos. Autonomia e recursos na mão de quem está no lugar certo resolveram o problema.

### Cultura: o jeito da casa

**Cultura** é o conjunto de **atitudes, valores e padrões de comportamento** que diferencia uma empresa da outra. Ela se forma com o tempo, a partir da história e da visão de quem fundou, e é muito influenciada pelo **estilo de liderança** que predomina. A cultura aparece nos **heróis** da empresa, nas **histórias** que os funcionários contam uns pros outros, nos **símbolos** e nos **rituais**.

A cultura é invisível, mas pesa muito no ânimo da equipe e no sucesso do negócio. O livro cita uma grande empresa de tecnologia que percebeu que **mães estavam saindo mais** que outros grupos, melhorou a licença-maternidade e **reduziu essa saída pela metade**.

### Na barbearia (adaptação)

- **Autonomia no dia a dia:** deixe o barbeiro resolver na hora um cliente insatisfeito (refazer o acabamento, dar um desconto pequeno) sem precisar te chamar. Combine o limite antes.
- **Rituais da casa:** a forma de receber o cliente, o café, a música, a foto do corte no final. Isso é cultura.
- **Histórias:** "o cliente que veio de outra cidade só pra cortar aqui" ou "o dia em que a gente atendeu o casamento inteiro". Conte pros novos.
- **Escute por que as pessoas saem.** Se bons barbeiros vão embora, descubra o motivo e mude.

### Para pensar

- Que decisões sua equipe poderia tomar sem você?
- Como um cliente descreveria o "jeito" da sua barbearia? E um barbeiro?"""
},
{
"id": "contratar-bem",
"titulo": "Contratar bem",
"urlOriginal": URL + "8-3-employee-selection",
"conteudo": """### Onde achar gente

Existem dois "mercados" de candidatos:

- **Interno:** quem já trabalha com você. **Promoções e mudanças de função** são o resultado mais comum. Muitas empresas, pequenas e grandes, **promovem quem já é da casa**.
- **Externo:** gente de fora, atraída por anúncio, feiras de emprego, internet e redes sociais. **Indicação** e rede de contatos são muito usadas.

**Marca empregadora:** mostrar uma imagem **verdadeira e positiva** da empresa pra quem vai ser contratado, incluindo uma **prévia realista** do trabalho (como é o dia a dia, o que se espera, as chances de crescer). Assim o candidato decide melhor.

### Como escolher (em etapas)

O livro descreve a seleção como uma série de **obstáculos**: quem passa por todos recebe a proposta; dá pra reprovar em qualquer etapa.

1. **Triagem:** currículo e uma conversa curta.
2. **Teste:** prova de habilidade.
3. **Entrevista:** conversa mais funda sobre experiência e motivação, inclusive com **situações reais** ("como você lidaria com um cliente insatisfeito?").
4. **Referências:** checar com quem já trabalhou com a pessoa.
5. **Decisão:** quase sempre de quem vai liderar o novo funcionário.

O livro dá exemplos de respostas que revelam muito numa entrevista. Um candidato, perguntado sobre um problema que travava o projeto, disse que **fez sozinho o trabalho do colega** que não rendia. A entrevistadora notou: ele resolveu aquele prazo, mas **não fez nada pra impedir que acontecesse de novo**.

### Trate o candidato como cliente

A rede de hotéis Ritz-Carlton recebe candidatos como recebe hóspedes: boas-vindas, música, café, agradecimento na saída e um bilhete pra todos — até pros que não passaram. O motivo: **o candidato pode ser um futuro cliente**. Na integração, os novos funcionários são recebidos pelos líderes com aplausos. O lema da casa: *"Somos damas e cavalheiros servindo damas e cavalheiros."*

### Na barbearia (adaptação)

- **Prova prática é o teste certo:** peça pro candidato fazer um degradê e uma barba num modelo. Observe também limpeza, conversa e cuidado com o cliente.
- **Pergunte situações:** "o cliente diz que não gostou do corte; o que você faz?"
- **Prévia realista:** fale de comissão, horários, sábado, padrão de atendimento. Melhor ouvir um "não" agora do que perder o barbeiro em um mês.
- **Indicação dos seus barbeiros** costuma trazer gente boa — e quem indica se sente responsável.
- **Respeite quem não passou:** um "obrigado, não foi dessa vez" deixa a porta aberta. Esse barbeiro pode virar cliente, ou indicar outro.

### Para pensar

- Qual seria sua prova prática pra um barbeiro novo?
- Que pergunta revela se a pessoa cuida bem do cliente?"""
},
{
"id": "treinar-a-equipe",
"titulo": "Treinar a equipe",
"urlOriginal": URL + "8-4-employee-training-and-development",
"conteudo": """Treinar é criar situações em que o funcionário ganha **conhecimento ou habilidade pra trabalhar melhor**. O treinamento tem objetivos claros: melhorar o desempenho, reduzir erros, aprender algo específico.

### Treinamento no trabalho

- **Integração:** preparar o novo funcionário. Uma parte apresenta a história, os valores, as regras e os clientes da empresa. Mas **o mais importante é a orientação de quem vai liderar a pessoa**: regras do dia a dia, equipamentos e o que se espera dela. Essa parte é mais informal e pode durar dias ou semanas.
- **Instrução no posto:** aprender fazendo, com **acompanhamento de alguém experiente** (coaching), projetos especiais ou **rodízio de funções**.
- **Aprendizado de ofício:** instrução prática junto com aulas, comum em profissões manuais.
- **Mentoria:** alguém experiente orienta sobre o trabalho e a carreira. É **barata e dá retorno na hora**, e por isso está cada vez mais popular.

### Treinamento fora do trabalho

Aulas com casos, **simulação de situações (role-play)**, vídeos e cursos on-line. A tecnologia permite treinar gente espalhada sem viagem, no ritmo de cada um. **Simuladores** deixam treinar o que é arriscado sem pôr ninguém em perigo — o livro cita os simuladores de voo de pilotos.

### Na barbearia (adaptação)

- **Primeira semana do barbeiro novo:** padrão de atendimento, como usar a agenda, onde fica cada coisa, regras de limpeza. Escreva numa folha.
- **Mentoria entre barbeiros:** o mais experiente acompanha o novo nas primeiras semanas e dá retorno corte a corte.
- **Rodízio:** quem só faz corte aprende barba, e vice-versa. A casa fica mais flexível pra cobrir faltas.
- **Cabeça de manequim é o simulador da barbearia:** técnica nova se treina nela antes do cliente.
- **Simulação de atendimento:** treine em dupla o cliente que reclama, o que chega atrasado, o que pede "igual da foto".

### Para pensar

- O que todo barbeiro novo deveria saber na primeira semana?
- Quem na sua equipe poderia ser mentor?"""
},
{
"id": "pagar-e-premiar",
"titulo": "Pagar e premiar",
"urlOriginal": URL + "8-6-employee-compensation-and-benefits",
"conteudo": """### O que define quanto pagar

- **Dentro da empresa:** habilidade, experiência e nível da função. Funções de importância parecida devem ganhar parecido.
- **Fora da empresa:** o que os concorrentes pagam. **Se o concorrente paga mais, você pode perder seus melhores profissionais.** Quem paga abaixo do mercado tem dificuldade de contratar gente boa.
- E também a saúde financeira da empresa, a eficiência e a produtividade.

### Tipos de pagamento

- **Direto:** salário ou valor por hora, mais **comissão** e **incentivos** ligados ao resultado.
- **Indireto:** benefícios (alguns obrigatórios por lei, outros oferecidos pela empresa: folga paga, plano de saúde, ajuda pra aposentadoria).

O livro mostra uma **comissão escalonada**: base fixa e porcentagem que **sobe** conforme a venda cresce (3% até um valor, 4% na faixa seguinte, 5% acima disso). Quanto mais vende, mais vale a pena vender.

Outras formas de premiar:

- **Bônus** por atingir uma meta.
- **Participação nos lucros:** parte do lucro do ano dividida com a equipe. Uma construtora citada no livro dá **o mesmo valor pra todos**, do presidente ao funcionário de menor salário.

### O exemplo da Starbucks

O fundador da Starbucks decidiu dar **plano de saúde e participação na empresa até pra quem trabalhava meio período**, algo inédito. Os investidores acharam um custo desnecessário. Mas a rotatividade caiu: segundo o diretor de marketing da época, a troca de funcionários de meio período ficou em **65% ao ano**, contra **200% a 300%** em redes de fast-food — o equivalente a trocar a equipe inteira a cada quatro meses, o que derruba o atendimento.

### Na barbearia (adaptação)

- **Comissão escalonada:** por exemplo, 40% até um certo valor no mês e 45% acima. Incentiva sem mexer na base.
- **Bônus por meta de casa,** não só individual: se a barbearia bater a meta, todos ganham. Ajuda o time a se ajudar.
- **Benefícios que custam pouco:** folga no aniversário, curso pago pela casa, produtos.
- **Rotatividade custa caro:** cada barbeiro que sai leva clientes. Compare quanto custa segurar com quanto custa repor.
- **No Brasil, a relação com o barbeiro tem regras próprias** (contrato de trabalho, parceria, MEI). Existe inclusive uma lei sobre parceria entre salão e profissional (Lei nº 13.352/2016). **Combine o modelo com seu contador** antes de definir comissões.

### Para pensar

- Seu pagamento está acima, na média ou abaixo das barbearias da região?
- Que benefício barato faria diferença pra sua equipe?"""
},
{
"id": "motivar-alem-do-dinheiro",
"titulo": "Motivar além do dinheiro",
"urlOriginal": URL + "9-7-from-motivation-theory-to-application",
"conteudo": """### Mudar o próprio trabalho

- **Ampliar:** dar **mais tarefas e mais variedade**. Pode deixar o trabalho menos repetitivo, mas, se vier **sem mais responsabilidade nem mais pagamento**, a pessoa sente que só está trabalhando mais — e isso gera ressentimento.
- **Enriquecer:** dar **mais autonomia, responsabilidade e poder de decisão**. Em geral, **aumenta a satisfação e reduz faltas e saídas**.
- **Rodízio:** trocar de função pra aprender coisas novas ou sair da rotina. Dá flexibilidade pra cobrir faltas, mas custa tempo de treinamento.

### Horários flexíveis

As empresas estão oferecendo alternativas ao horário tradicional:

- **Horário flexível:** cumpre as horas combinadas, mas escolhe quando chega e quando sai.
- **Semana comprimida:** as mesmas horas em menos dias.
- **Divisão de vaga:** duas pessoas dividem as tarefas e o horário de um posto.

O livro cita o diretor de uma empresa brasileira, a Semco, Ricardo Semler: pessoas livres pra equilibrar a própria vida *"são muito mais felizes e produtivas. Se você atende uma ligação de trabalho no domingo à tarde, por que não ir ao cinema numa segunda?"*

### Reconhecimento

**Reconhecer o esforço** mostra pra pessoa o que ela fez bem e que a contribuição dela importa. Pode ser formal ou informal: dinheiro, um dia de folga, uma mensagem de parabéns, um elogio na frente da equipe. E **não precisa vir só do chefe**: uma empresa citada no livro usa um aplicativo em que os próprios colegas se agradecem e acumulam pontos trocados por prêmios.

### Incentivos em dinheiro

Bônus, participação nos lucros e pagamento por produção ligam o ganho ao resultado. Mas cuidado: o livro conta que o Google, ao dar prêmios em dinheiro de valores muito diferentes, **gerou ciúme em vez de trabalho em equipe**. Ouvindo os funcionários, trocou por **experiências** (presentes, viagens) e todo mundo ficou mais feliz.

### Na barbearia (adaptação)

- **Enriquecer:** deixe um barbeiro cuidar do Instagram, das compras de produto ou do treinamento dos novos — com reconhecimento (e, se for o caso, pagamento) por isso.
- **Escala combinada:** quem prefere começar mais cedo, quem precisa do sábado de manhã livre. Uma agenda online por profissional facilita.
- **Reconhecimento público:** "barbeiro do mês" com a foto no site ou no Instagram da casa, escolhido pelas avaliações dos clientes.
- **Prêmio que une:** se todos bateram a meta, um almoço ou um curso pra equipe pode valer mais que um bônus individual.

### Para pensar

- O que motiva cada pessoa da sua equipe? (Pergunte!)
- Que responsabilidade nova você poderia dar a quem está acomodado?"""
},
]

curso = {
  "slug": "liderar-sua-equipe",
  "titulo": "Liderar sua equipe",
  "resumo": "Estilos de liderança, contratar e treinar barbeiros, comissão e bônus, e como manter a equipe motivada.",
  "area": "Liderança",
  "nivel": "iniciante",
  "tags": ["barbearia", "liderança", "equipe", "gestão de pessoas"],
  "idiomaOriginal": "en",
  "traducao": "automatica",
  "modulos": [
    {"id": "liderar", "titulo": "Liderar", "licoes": licoes[0:2]},
    {"id": "montar-a-equipe", "titulo": "Montar a equipe", "licoes": licoes[2:4]},
    {"id": "manter-a-equipe", "titulo": "Manter a equipe", "licoes": licoes[4:6]},
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
