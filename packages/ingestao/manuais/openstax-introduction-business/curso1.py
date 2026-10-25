import json, sys

URL = "https://openstax.org/books/introduction-business/pages/"
AUTORES = ["Lawrence J. Gitman", "Carl McDaniel", "Amit Shah", "Monique Reece", "Linda Koffel", "Bethann Talsma", "James C. Hyatt"]
ATRIBUICAO = ("Traduzido e adaptado de “Introduction to Business”, de Lawrence J. Gitman, Carl McDaniel, Amit Shah, "
              "Monique Reece, Linda Koffel, Bethann Talsma e James C. Hyatt (OpenStax, Rice University), licenciado sob "
              "CC BY 4.0. Mudanças: tradução para o português, resumo das seções e exemplos para barbearias "
              "(trechos “Na barbearia”), que não fazem parte do original. Original grátis em openstax.org.")

licoes = [
{
"id": "preco-e-valor",
"titulo": "Preço é o valor que o cliente enxerga",
"urlOriginal": URL + "11-9-pricing-strategies-and-future-trends",
"conteudo": """Definir o preço certo é uma parte importante do planejamento de marketing. **Preço é o valor percebido** que se troca por alguma coisa. No dia a dia, esse valor aparece em reais: preço é o dinheiro trocado por um produto ou serviço.

Repare na palavra **percebido**: é o valor que a pessoa enxerga *na hora da compra*. Depois de usar, ela pode achar que valeu menos do que imaginava. O preço que o cliente paga se baseia na satisfação que ele **espera** ter, não necessariamente na que ele de fato tem.

O preço nem sempre é dinheiro. Quando se troca um produto por outro, isso se chama **escambo** (permuta).

### Pra que serve o preço

O preço define quanto a empresa ganha. **Preço × quantidade vendida = receita bruta.** É a receita que paga todas as atividades do negócio; o que sobra, se sobrar, é o **lucro**. Quem administra busca um preço que dê um retorno justo sobre o que foi investido.

O preço não pode ser alto nem baixo demais, e precisa bater com o valor que o seu público enxerga:

- **Caro demais** (na visão do cliente): você perde vendas, e venda perdida é receita perdida.
- **Barato demais**: o cliente acha uma pechincha, mas a empresa pode não atingir o lucro que precisa. **Em serviços, um preço baixo demais pode até tirar a credibilidade** e afastar clientes.

### Na barbearia (adaptação)

- Seu cliente não compra "30 minutos de máquina": compra o resultado, o cuidado e a experiência. É isso que forma o valor percebido.
- Um corte muito abaixo da média do bairro pode passar a ideia de serviço ruim, não de oportunidade.
- Faça a conta da receita: se o corte custa R$ 40 e você faz 8 por dia, 22 dias no mês, são **R$ 7.040 de receita bruta**. Daí ainda saem todos os custos (veja a lição 3).

### Para pensar

- O que seus clientes valorizam além do corte em si?
- Seu preço está alinhado com o que eles enxergam de valor?"""
},
{
"id": "estrategias-de-preco",
"titulo": "Estratégias de preço que funcionam pra serviço",
"urlOriginal": URL + "11-9-pricing-strategies-and-future-trends",
"conteudo": """Existem várias estratégias pra definir preço. Algumas servem pra lançar algo novo; outras valem também pra produtos que já existem.

### Desnatamento (preço alto no lançamento)

Lançar um produto com **preço alto e baixar com o tempo**, conforme aparecem concorrentes e mais gente passa a poder comprar. Vantagens apontadas pelos autores:

1. O preço alto ajuda a descobrir quanto as pessoas estão dispostas a pagar.
2. Se ficar caro demais, dá pra baixar.
3. Passa imagem de qualidade e prestígio.
4. Quando o preço cai, o cliente sente que fez um bom negócio.

A desvantagem: preço alto atrai concorrência.

### Penetração (preço baixo pra ganhar volume)

Lançar com **preço baixo** esperando vender muito. Pode fazer o cliente trocar de marca e desanimar concorrentes. Exige mais planejamento: é preciso estar pronto pra atender muita gente, e o prejuízo é grande se a procura não vier.

### Preço isca (líder de vendas)

Vender um item **abaixo da margem normal, ou até abaixo do custo**, pra atrair clientes que não viriam de outro jeito, esperando que eles comprem outras coisas. Funciona com itens conhecidos, que muita gente quer.

### Preço de serviços

Serviço é mais complexo de precificar. Pode ter **preço padrão** — o livro dá justamente o exemplo do **corte de cabelo** — ou **preço sob medida**, feito pra um cliente específico.

### Pacote (combo)

**Juntar dois ou mais itens relacionados num preço só.** A ideia é alcançar quem compraria um, mas não daria tanta importância ao outro: com um pequeno desconto no conjunto, você vende o segundo item que não venderia sozinho.

### Preço psicológico

Preços "quebrados" (ex.: 49,90) passam ideia de oferta; preços "redondos" passam ideia de qualidade.

### Preço de prestígio

**Subir o preço pra que o cliente perceba mais qualidade, status ou valor.** É muito comum em serviços: quem tem fama de excelente é mais procurado, às vezes com fila de espera. Como o serviço depende da pessoa que o faz, e ela só tem tantas horas na semana, **quando a agenda enche, a procura sobe e o preço vira preço de prestígio**.

### Na barbearia (adaptação)

- **Combo:** corte + barba por um valor menor que os dois separados. Quem só viria cortar acaba fazendo a barba também.
- **Preço isca com cuidado:** um serviço simples mais barato num dia fraco (ex.: terça) pode trazer gente que volta pra serviços completos. Nunca pague pra trabalhar sem saber o motivo.
- **Agenda cheia é sinal:** se você vive com a semana lotada, é hora de pensar em subir o preço, como explica o preço de prestígio.
- **Preço redondo** (R$ 40, R$ 70) combina com serviço de qualidade; preço quebrado combina mais com promoção.

### Para pensar

- Qual a diferença entre desnatamento e penetração?
- Que combo faria sentido na sua barbearia?
- Por que o preço de prestígio é comum em serviços?"""
},
{
"id": "quanto-entra-quanto-sobra",
"titulo": "Quanto entra e quanto sobra: o resultado do mês",
"urlOriginal": URL + "14-5-the-income-statement",
"conteudo": """A **demonstração de resultado** (no Brasil, DRE) resume as **receitas** e as **despesas** de um período e mostra se houve **lucro ou prejuízo**. Muitas empresas fazem uma por mês pra acompanhar o negócio.

### Receitas

Receita é o valor das vendas, mais outras entradas (juros, aluguéis recebidos etc.). Começa pela **venda bruta** (tudo que foi vendido); dela saem descontos e devoluções, e o que sobra é a **venda líquida**.

### Despesas

Despesa é o custo de gerar a receita. Aparecem dois tipos:

- **Custo do que foi vendido:** o gasto pra produzir ou comprar o que se vende. **Empresas de serviço não produzem mercadoria, então nelas o lucro bruto é igual à venda líquida.** (Produto revendido, como pomada, tem custo de compra.)
- **Despesas operacionais:** tudo que é preciso pra tocar o negócio e não está ligado direto à produção. Dividem-se em **despesas de venda** (comissões, propaganda, materiais de venda) e **despesas gerais e administrativas** (salários de quem administra, contas de luz e água, material de escritório, juros, contador, seguro, aluguel).

### O resultado final

Na última linha, o **lucro líquido** (ou prejuízo): receitas menos todas as despesas.

1. Venda líquida − custo do que foi vendido = **lucro bruto**.
2. Lucro bruto − despesas operacionais = **lucro antes dos impostos**.
3. Menos os impostos = **lucro líquido**.

No exemplo do livro, uma confeitaria vendeu US$ 275.000 no ano e terminou com lucro líquido de US$ 32.175.

> **Importante:** lucro não é dinheiro no caixa. A DRE resume o resultado do período; o dinheiro que entrou e saiu de verdade aparece no fluxo de caixa (próxima lição).

### Na barbearia (adaptação) — um mês de exemplo

| | R$ |
|---|---:|
| Cortes e barbas (venda bruta) | 9.000 |
| (−) Descontos dados | 300 |
| **Venda líquida** | **8.700** |
| (−) Custo das pomadas revendidas | 400 |
| **Lucro bruto** | **8.300** |
| (−) Comissão dos barbeiros | 3.000 |
| (−) Aluguel | 1.500 |
| (−) Luz, água e internet | 450 |
| (−) Produtos de uso (lâminas, toalhas, álcool) | 350 |
| (−) Contador e sistema | 300 |
| **Lucro antes dos impostos** | **2.700** |
| (−) Impostos (ex.: MEI/Simples) | 250 |
| **Lucro líquido** | **2.450** |

*Valores ilustrativos.* Faça a sua com os números reais do mês: muita gente descobre que o lucro é bem menor (ou maior) do que imaginava.

### Para pensar

- Qual a diferença entre venda bruta e venda líquida?
- Quais são as suas três maiores despesas?"""
},
{
"id": "lucro-nao-e-caixa",
"titulo": "Lucro não é dinheiro no caixa",
"urlOriginal": URL + "14-6-the-statement-of-cash-flows",
"conteudo": """Lucro ou prejuízo é **uma** forma de medir o desempenho. Mas quem empresta dinheiro e quem investe também quer saber **quanto dinheiro o negócio gera e pra onde ele vai**.

O **fluxo de caixa** (demonstração dos fluxos de caixa) resume o dinheiro que **entra e sai** da empresa num período. Ele acompanha recebimentos e pagamentos de verdade e ajuda a **identificar problemas de caixa** antes que virem crise.

O fluxo de caixa divide o dinheiro em três grupos:

- **Atividades operacionais:** ligadas ao dia a dia de produzir e vender o produto ou serviço.
- **Atividades de investimento:** compra e venda de bens duráveis (equipamentos, reformas).
- **Atividades de financiamento:** empréstimos tomados ou pagos, e dinheiro que os donos colocam ou retiram.

No exemplo do livro, a confeitaria teve lucro de US$ 32.175, mas o caixa cresceu US$ 20.215: parte do dinheiro foi usada pra comprar estoque e equipamento e pra pagar dívidas.

### Na barbearia (adaptação)

- Você pode ter lucro no mês e mesmo assim ficar sem dinheiro pra pagar o aluguel — por exemplo, se comprou uma cadeira nova (investimento) ou pagou parcela de empréstimo (financiamento).
- **Pagamento parcelado no cartão** entra no caixa depois: o corte foi feito hoje, mas o dinheiro chega em semanas.
- Separe o dinheiro da barbearia do seu dinheiro pessoal. Sem isso, não dá pra saber se o negócio está gerando caixa.

**Planilha simples de caixa (por semana):**

| Data | Entrou | Saiu | Motivo | Saldo |
|---|---:|---:|---|---:|
| seg | 1.200 | | cortes | 1.200 |
| ter | | 350 | produtos | 850 |
| qua | 900 | | cortes | 1.750 |

### Para pensar

- Por que uma empresa com lucro pode ficar sem dinheiro?
- Que gastos seus são "investimento" e quais são do dia a dia?"""
},
{
"id": "servico-novo-sem-chute",
"titulo": "Lançar um serviço novo sem chute",
"urlOriginal": URL + "11-7-creating-products-that-deliver-value",
"conteudo": """Produtos e serviços novos dão vida às vendas e ajudam o negócio a crescer. Uma versão nova de algo que você já oferece (outro sabor, tamanho, modelo) se chama **extensão de linha**.

**Empresas de serviço costumam lançar e ajustar novidades mais rápido** que fábricas, porque o serviço é flexível e dá pra mudar na hora. Por isso, o cliente também espera melhorias rápidas.

Lançar algo novo é caro e arriscado: o livro cita taxas de fracasso de até 80% em alguns tipos de produto. Pra aumentar a chance de dar certo, as empresas seguem estes passos:

1. **Definir metas.** Geralmente financeiras: por exemplo, recuperar o investimento em até três anos. Pode ter metas não financeiras, como aproveitar o equipamento que já existe.
2. **Juntar ideias.** Pequenas empresas dependem dos **funcionários, clientes, investidores e fornecedores**. Duas técnicas: **grupo de discussão** (8 a 12 pessoas conversando a fundo sobre um tema, pra entender o que pensam e por quê) e **brainstorming** (o máximo de ideias possível, sem criticar nenhuma; avaliar fica pra depois).
3. **Filtrar.** Comparar as ideias com as metas. Muitas caem porque não combinam com o que você já faz, falta equipamento ou recurso, ou a procura seria pequena.
4. **Desenvolver o conceito.** Montar e testar um protótipo e a estratégia (preço, divulgação, público).
5. **Testar no mercado.** Oferecer pra clientes de verdade e ver como se sai. É o "teste de fogo"; quem pula essa etapa corre muito risco.
6. **Lançar.** Com tudo coordenado: equipe treinada, divulgação pronta.

Para empresas de serviço o processo é parecido, mas o protótipo é mais rápido: é **criar o serviço e treinar quem vai fazer** pra testar no mercado.

### Na barbearia (adaptação)

Exemplo: lançar **sobrancelha na navalha** ou **pigmentação de barba**.

- **Meta:** pagar o material e o curso em 2 meses.
- **Ideias:** pergunte aos clientes da cadeira o que eles procuram e não acham no bairro.
- **Filtro:** você tem alguém treinado? O serviço cabe no seu horário?
- **Teste:** ofereça por algumas semanas pros clientes fiéis, com preço de lançamento, e anote quantos pedem de novo.
- **Lançamento:** fotos no seu site e no Instagram, serviço cadastrado na agenda online.

### Para pensar

- Que serviço novo seus clientes já pediram?
- Como você testaria esse serviço antes de investir pesado?"""
},
{
"id": "administrar-pequena-empresa",
"titulo": "Administrar a pequena empresa: ajuda, equipe e mudança",
"urlOriginal": URL + "5-5-managing-a-small-business",
"conteudo": """Administrar uma pequena empresa é um desafio. O dono precisa resolver problemas conforme aparecem e **agir rápido quando o mercado muda**.

### Saber a hora de mudar

O livro conta a história do MailChimp: os fundadores mudaram de público várias vezes até perceber que gostavam de atender **pequenos negócios**, que sempre pediam marketing por e-mail. Focaram nisso e cresceram. A lição: **quando aparecer uma oportunidade, não tenha medo de mudar de rumo**, ouvindo o que o mercado diz.

### O papel do dono muda

Um bom **plano de negócios** mantém o dono por dentro de todas as áreas. Contratar, treinar e liderar pessoas é outra responsabilidade importante, e o papel do dono muda com o tempo: conforme a empresa cresce, outros tomam decisões do dia a dia e o dono passa a cuidar da equipe e do planejamento.

### Ajuda de fora

- Quase toda pequena empresa precisa de um **bom contador**, pra organizar as contas, ajudar nas decisões e planejar impostos.
- Um **advogado** que entende de pequenas empresas ajuda com contratos e documentos.
- Algumas tarefas podem ser **terceirizadas** (tecnologia, marketing, folha de pagamento). Paga-se só o que usa, sem investir em estrutura cara. Revise isso conforme crescer: em algum momento pode compensar trazer pra dentro.

### Contratar e manter gente boa

- Antes de contratar, **calcule todos os custos**: o livro estima que recrutamento, espaço extra e impostos somam **10 a 15% a mais** sobre o salário, sem contar benefícios.
- Contratar também traz mais trabalho de treinamento e gestão. É um dilema: pra crescer você precisa de gente, mas deixar de trabalhar sozinho e virar chefe pode ser estressante.
- Pequenas empresas nem sempre conseguem pagar como as grandes, então precisam ser **criativas**: ambiente bom, **horário flexível**, participar das decisões, **dividir o lucro**.

O livro cita o dono de uma pequena fábrica numa cidade de 650 habitantes que, num período fraco, **reduziu as horas em vez de demitir** e ofereceu horário flexível. Tratar bem a equipe foi a base do negócio dele.

### Na barbearia (adaptação)

- **Contador:** mesmo como MEI, alguém de confiança evita multa e ajuda a saber a hora de virar ME.
- **Terceirizar:** site e agenda online, por exemplo, sem precisar contratar ninguém de tecnologia.
- **Barbeiro bom fica onde é valorizado:** comissão justa, escala combinada, voz nas decisões (preço, horário, serviços novos).
- **Mudar de rumo:** se a procura por barba cresce e a de corte infantil cai, ajuste o cardápio, a divulgação e os horários.

### Para pensar

- Que parte do negócio você poderia passar pra outra pessoa (ou pra um sistema)?
- O que faria um bom barbeiro querer ficar com você?"""
},
]

curso = {
  "slug": "preco-e-lucro-na-barbearia",
  "titulo": "Preço e lucro na barbearia",
  "resumo": "Como definir o preço do corte, montar combos, saber quanto sobra no fim do mês e cuidar do dinheiro em caixa.",
  "area": "Gestão",
  "nivel": "iniciante",
  "tags": ["barbearia", "preço", "finanças", "pequeno negócio"],
  "idiomaOriginal": "en",
  "traducao": "automatica",
  "modulos": [
    {"id": "preco", "titulo": "Preço", "licoes": licoes[0:2]},
    {"id": "numeros", "titulo": "Os números do negócio", "licoes": licoes[2:4]},
    {"id": "crescer", "titulo": "Crescer com segurança", "licoes": licoes[4:6]},
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
