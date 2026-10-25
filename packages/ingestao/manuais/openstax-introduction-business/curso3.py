import json, sys

URL = "https://openstax.org/books/introduction-business/pages/"
AUTORES = ["Lawrence J. Gitman", "Carl McDaniel", "Amit Shah", "Monique Reece", "Linda Koffel", "Bethann Talsma", "James C. Hyatt"]
ATRIBUICAO = ("Traduzido e adaptado de “Introduction to Business”, de Lawrence J. Gitman, Carl McDaniel, Amit Shah, "
              "Monique Reece, Linda Koffel, Bethann Talsma e James C. Hyatt (OpenStax, Rice University), licenciado sob "
              "CC BY 4.0. Mudanças: tradução para o português, resumo das seções e exemplos para barbearias "
              "(trechos “Na barbearia”), que não fazem parte do original. Original grátis em openstax.org.")

licoes = [
{
"id": "pra-que-divulgar",
"titulo": "Pra que serve divulgar",
"urlOriginal": URL + "12-5-promotion-strategy",
"conteudo": """**Divulgar (promoção)** é tentar **informar, convencer ou lembrar** as pessoas pra influenciar a opinião delas ou provocar uma ação. Numa empresa, a ação desejada normalmente é a compra.

### Os objetivos da divulgação

- **Ser conhecido.** Muitas empresas fecham **porque as pessoas não sabem que elas existem** ou o que fazem. O livro cita os pequenos restaurantes: **pôr uma placa e abrir a porta raramente basta**. Anúncio nas redes, rádio local, cupons e panfletos criam conhecimento.
- **Fazer experimentar.** Amostra grátis, cupom, tamanho de teste. Pessoas conhecidas também ajudam: trazem confiança e familiaridade.
- **Informar.** Explicar o que o produto faz, por que é melhor, o preço novo, onde comprar. As pessoas não compram o que não sabem pra que serve.
- **Segurar quem já é cliente.** Lembrar da marca e avisar quando algo melhorou.
- **Fazer usar mais e mais vezes.** Programas de pontos e fidelidade são o exemplo mais conhecido.
- **Achar os clientes certos.** Pôr o endereço do site na divulgação pra quem tem interesse de verdade chegar até você.
- **Ensinar o cliente.** Em serviços, o cliente participa do serviço junto com quem atende (os autores chamam isso de **cocriação**). Às vezes é preciso **ensinar** como o serviço funciona.

### Na barbearia (adaptação)

- **Ser conhecido:** placa na rua, perfil no Google Maps com fotos e horário, Instagram ativo. Uma barbearia boa e desconhecida perde pra uma média e famosa.
- **Experimentar:** primeiro corte com desconto pra quem nunca veio.
- **Informar:** "agora com pigmentação", "aberto até 21h às sextas", "marque pelo link".
- **Segurar:** "faz 3 semanas do seu corte, quer marcar?" (mandado por você, pra quem deixou o contato).
- **Ensinar:** como manter o degradê em casa, que produto usar. Cliente que entende o serviço valoriza mais.

### Para pensar

- Qual desses objetivos é o mais urgente pra sua barbearia hoje?
- Quantas pessoas do seu bairro sabem que você existe?"""
},
{
"id": "uma-mensagem-so",
"titulo": "Todos os canais, uma mensagem só",
"urlOriginal": URL + "12-5-promotion-strategy",
"conteudo": """A combinação de canais que uma empresa usa pra divulgar se chama **mix de promoção**. Os elementos, segundo o livro:

- **Anúncio tradicional:** divulgação paga, impessoal, por um anunciante identificado (TV, rádio, jornal, outdoor).
- **Venda pessoal:** apresentação cara a cara.
- **Promoção de vendas:** cupons, amostras, demonstrações, eventos.
- **Relações públicas:** ações que ligam a empresa ao interesse do público e conquistam boa vontade (eventos, notícias, comunidade).
- **Redes sociais:** gerar comentário ("buzz") sobre a empresa — e saber se defender quando algo ruim viraliza.
- **Site e vendas online:** **ter um site é obrigatório hoje**, e saber usá-lo pra gerar vendas é essencial.

### Comunicação integrada

O ideal é que **a mensagem seja a mesma** venha de onde vier: anúncio, conversa na cadeira, post, cupom. Isso se chama **comunicação integrada de marketing**: coordenar todos os canais pra passar **uma mensagem só, coerente e focada no cliente**, combinando o momento de cada ação e **acompanhando os resultados** pra melhorar as próximas.

O livro cita uma companhia aérea que fez uma campanha sobre **não cobrar taxas escondidas**, repetida no site, nos anúncios e nas placas dos aeroportos. Funcionou porque os concorrentes cobravam extras.

### Na barbearia (adaptação)

Escolha **uma ideia** e repita em todo lugar. Exemplos:

- "**Hora marcada, sem espera**" — no Instagram, na placa, no site, na fala do barbeiro.
- "**Especialista em degradê**" — fotos de degradê no site, no Google e nos stories.

Depois confira o que funcionou: pergunte "como nos achou?" e veja de onde vêm os agendamentos.

| Canal | Exemplo barato |
|---|---|
| Venda pessoal | marcar o próximo horário antes do cliente sair |
| Promoção | combo de terça, cartão fidelidade |
| Relações públicas | corte solidário num evento do bairro |
| Redes sociais | antes e depois toda semana |
| Site | portfólio + agenda online + mapa |

### Para pensar

- Se um cliente descrevesse sua barbearia numa frase, qual seria? É a mesma que você divulga?
- Que canal você usa hoje e qual está faltando?"""
},
{
"id": "anuncio-pago",
"titulo": "Anúncio pago: quando vale a pena",
"urlOriginal": URL + "12-6-the-huge-impact-of-advertising",
"conteudo": """**Anúncio tradicional** é qualquer divulgação **paga e impessoal** de um anunciante identificado: TV, rádio, jornal, revista, mala direta, outdoor. As grandes empresas gastam bilhões com isso, mas a tecnologia mudou o jogo: **a audiência se espalhou** por internet, celular e streaming, e ficou mais difícil alcançar todo mundo num lugar só.

### Como escolher onde anunciar

Os canais por onde o anúncio chega são as **mídias**. Dois fatores principais pra escolher: **o custo** e **o público que ela alcança**.

- **Custo por contato:** quanto custa alcançar **uma** pessoa do seu público. Serve pra comparar mídias (rádio x TV, uma página x outra). Às vezes aparece como custo por mil contatos.
- **Alcance:** quantas pessoas **diferentes** do seu público viram o anúncio pelo menos uma vez num período (normalmente 4 semanas). Lançamentos e campanhas pra ficar conhecido priorizam alcance.
- **Frequência:** quantas vezes a mesma pessoa vê a mensagem. Anúncio é rápido e esquecido, por isso se repete.
- **Seletividade:** a capacidade de atingir **um público bem definido**. Uma revista de noivas fala com noivas; um jornal geral fala com todo mundo. Também vale escolher **qual rede social** chega no seu público.

O livro cita até o anúncio no **cardápio de restaurante**: público parado lendo, bem selecionado e barato por pessoa.

### Na barbearia (adaptação)

- **Calcule o custo por cliente, não por clique.** Se R$ 100 em anúncio trouxeram 5 clientes novos, cada um custou R$ 20. Se cada cliente fiel vale centenas de reais por ano, pode valer a pena.
- **Seletividade local:** anúncio que aparece só pra quem está a poucos quilômetros da barbearia desperdiça menos.
- **Frequência:** uma vez só não fica na memória. Melhor pouco dinheiro por várias semanas do que tudo num dia.
- **Mídia local barata:** cartaz na academia, no bar do bairro, parceria com a loja de roupa vizinha.
- **Antes de pagar, faça o grátis:** perfil no Google Maps completo e Instagram com fotos boas.

### Para pensar

- Qual a diferença entre alcance e frequência?
- Onde seu cliente passa o tempo (on-line e no bairro)?"""
},
{
"id": "promocoes",
"titulo": "Promoções que trazem (e seguram) cliente",
"urlOriginal": URL + "12-8-sales-promotion",
"conteudo": """**Promoção de vendas** são ações que estimulam a compra, fora anúncio, venda pessoal e relações públicas: cupons, amostras, brindes, sorteios, programas de fidelidade. O objetivo costuma ser **a compra imediata**, e funciona melhor quando você pensa **em que tipo de cliente** quer atingir.

| Tipo de cliente | O que você quer | Exemplos |
|---|---|---|
| **Fiel** (compra sempre de você) | reforçar o hábito, fazer usar mais | programas e cartões de fidelidade, bônus por compra repetida |
| **Do concorrente** | quebrar a fidelidade e trazer pra você | sorteios, concursos, brindes que despertem interesse |
| **Que troca muito** | fazer escolher você mais vezes | amostras pra mostrar que o seu é melhor |
| **Que só olha preço** | atrair com preço baixo ou dar valor extra | cupons, desconto, reembolso |

### Promoção em serviços

O livro diz que **serviços ao consumidor, como cabeleireiros, usam muito promoção**, e dá o exemplo de **metade do preço do corte pra idosos às segundas**. Já serviços profissionais (médico, advogado) quase não usam. O alerta: **empresas de serviço precisam tomar cuidado pra não exagerar nas promoções, porque isso pode tirar a credibilidade**.

O livro também cita uma pesquisa em que quem usava cupom no supermercado **gastava 8% a mais** do que quem não usava.

### Influenciadores: atenção à ética

Empresas pagam pessoas com muitos seguidores pra falar dos seus produtos. O livro levanta dois problemas: nem sempre o seguidor sabe que é publicidade paga, e **alguns influenciadores usam seguidores falsos** pra parecer maiores e cobrar mais.

### Na barbearia (adaptação)

- **Fiel:** a cada 10 cortes, 1 grátis. Não dê desconto pra quem já vem: dê **recompensa** por continuar vindo.
- **Do concorrente:** "traga um amigo e os dois ganham a barba". Quem vem por indicação já chega confiando.
- **Dia fraco:** desconto na terça ou pra quem tem mais de 60 anos (como no exemplo do livro) enche horário vazio sem baixar o preço da semana toda.
- **Não exagere:** promoção toda semana ensina o cliente a só vir com desconto e passa imagem de barbearia barata.
- **Influenciador local:** prefira alguém do bairro, de verdade, e combine que ele diga que é parceria.

### Para pensar

- Quem você quer atrair agora: cliente novo, do concorrente, ou fazer o fiel vir mais?
- Qual promoção sua poderia estar tirando valor do seu serviço?"""
},
{
"id": "redes-sociais-e-video",
"titulo": "Redes sociais e vídeo",
"urlOriginal": URL + "12-10-trends-in-social-media",
"conteudo": """Hoje quase toda empresa está nas redes sociais. **Uma única postagem pode gerar milhares de impressões**, boas ou ruins. As redes são uma ferramenta muito poderosa, com desafios:

- As plataformas **mudam o tempo todo**.
- As pessoas costumam **acreditar no que veem sem conhecer o contexto**.
- **Uma postagem que viraliza pode fechar um negócio, mesmo que não seja verdade.**

Por isso, quem quer construir imagem precisa de um jeito de **usar** as redes e também de **se defender** de problemas que nascem nelas.

### Conteúdo próprio (blog e afins)

Empresas mantêm blogs e canais próprios porque assim:

1. recebem a opinião de clientes e interessados em tempo real;
2. criam e mantêm relacionamentos;
3. conversam continuamente com clientes fiéis e futuros clientes;
4. focam em objetivos específicos.

Os bons canais **focam num assunto só** e trazem novidade e conhecimento constante sobre ele.

### Vídeo e podcast

Muita gente entra no YouTube pra ver **como um produto funciona e como usar**. O livro destaca que **pequenos empreendedores usam muito vídeos informativos** pra entregar valor aos clientes e mostrar seus produtos. Podcasts e vídeos também servem pra criar fidelidade com uma **venda leve**, dando dicas úteis (o exemplo do livro é uma marca de ração mandando dicas semanais pra donos de cachorro).

### Na barbearia (adaptação)

- **Um assunto só:** seu perfil é sobre cortes, barba e cuidados. Antes e depois, transformações, dicas.
- **Vídeo curto que ensina:** "como pentear o topete", "como manter a barba entre um corte e outro". É a "venda leve" do livro.
- **Mostre a pessoa:** o cliente escolhe o barbeiro, não só a barbearia. Apresente a equipe.
- **Converse:** responda comentários e mensagens. Rede social é diálogo.
- **Defenda-se:** avaliação negativa ou postagem injusta? Responda com calma, em público, e resolva no privado. Nunca brigue nos comentários.
- **Leve pro agendamento:** o link na bio deve levar direto pra marcar horário.

### Para pensar

- Que pergunta seus clientes fazem sempre? Ela daria um vídeo de 30 segundos.
- O que você faria se uma postagem falsa sobre a barbearia começasse a circular?"""
},
]

curso = {
  "slug": "divulgue-sua-barbearia",
  "titulo": "Divulgue sua barbearia",
  "resumo": "Ser conhecido no bairro, escolher onde divulgar, fazer promoções que não desvalorizam e usar as redes sociais a seu favor.",
  "area": "Marketing",
  "nivel": "iniciante",
  "tags": ["barbearia", "marketing", "instagram", "promoção"],
  "idiomaOriginal": "en",
  "traducao": "automatica",
  "modulos": [
    {"id": "base", "titulo": "A base da divulgação", "licoes": licoes[0:2]},
    {"id": "canais", "titulo": "Canais", "licoes": licoes[2:5]},
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
