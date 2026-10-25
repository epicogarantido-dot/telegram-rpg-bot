"""Cursos escritos pelo Aprenda Livre (não são tradução). Gera data/cursos/<slug>.json.

Fatos e números do Brasil conferidos em fonte oficial em 2026-10-25:
- DAS-MEI 2026: Receita Federal, "MEI - atualização de valores devidos em 2026" (R$ 81,05 INSS + R$ 5,00 ISS).
- Limite do MEI: LC 123/2006 art. 18-A §1º (R$ 81 mil) e LC 238/2026 (R$ 110 mil em 2027, R$ 140 mil a partir de 2028).
"""
import json, sys, os

DESTINO = sys.argv[1] if len(sys.argv) > 1 else "data/cursos"
FONTE = {
    "nome": "Aprenda Livre",
    "tituloOriginal": "",
    "autores": ["Aprenda Livre"],
    "licenca": "CC-BY-4.0",
    "atribuicao": "Conteúdo original do Aprenda Livre, escrito em português, sob licença CC BY 4.0. "
                  "Valores e regras oficiais citados nas lições foram conferidos em outubro de 2026 e podem mudar.",
}

def curso(slug, titulo, resumo, area, tags, modulos):
    return {
        "slug": slug, "titulo": titulo, "resumo": resumo, "area": area, "nivel": "iniciante", "tags": tags,
        "idiomaOriginal": "pt", "traducao": "original", "autoria": "propria",
        "modulos": modulos, "fonte": {**FONTE, "tituloOriginal": titulo}, "atualizadoEm": "2026-10-25",
    }

# ---------------------------------------------------------------- finanças pessoais
F = [
{"id": "separar-o-dinheiro", "titulo": "Separe o dinheiro da barbearia do seu", "conteudo": """O erro mais comum de quem trabalha por conta própria: **o dinheiro da barbearia e o dinheiro da casa ficam misturados**. O cliente paga, o dinheiro vai pro bolso, e no fim do mês ninguém sabe se a barbearia deu lucro ou se você gastou demais.

### Por que separar

- Você só sabe se o negócio vai bem se enxergar o dinheiro **dele**.
- Na hora de comprar uma máquina, pagar o aluguel ou o DAS, o dinheiro **precisa estar lá**.
- Fica mais fácil pedir crédito, falar com o contador e planejar.

### Como fazer na prática

1. **Duas contas:** uma da barbearia (pode ser uma conta digital só pra isso; MEI pode abrir conta no CNPJ) e uma sua.
2. **Tudo que o cliente paga entra na conta da barbearia** — Pix, cartão e dinheiro vivo (deposite).
3. **Defina uma retirada fixa pra você** (o "pró-labore"): um valor por semana ou por mês que sai da conta da barbearia pra sua. É o seu "salário".
4. **Despesas da barbearia saem só da conta da barbearia.** Despesas da casa, só da sua.
5. **Sobrou dinheiro na barbearia?** Primeiro reserva do negócio, depois investimento (uma máquina, uma cadeira), e só então uma retirada extra.

### Quanto retirar

Comece olhando os **3 meses mais fracos** do último ano. A retirada fixa deve caber **mesmo num mês fraco**, depois de pagar as despesas da barbearia. Nos meses bons, a sobra vai pra reserva.

### Na prática

| Semana | Entrou (barbearia) | Despesas | Retirada | Sobrou na barbearia |
|---|---:|---:|---:|---:|
| 1 | 2.100 | 600 | 900 | 600 |
| 2 | 1.700 | 350 | 900 | 450 |

*Valores de exemplo.*

### Para pensar

- Hoje você sabe quanto a barbearia lucrou no mês passado?
- Qual retirada fixa caberia até num mês fraco?"""},
{"id": "pra-onde-vai-o-dinheiro", "titulo": "Pra onde vai o seu dinheiro", "conteudo": """Antes de cortar gastos ou investir, é preciso **saber pra onde o dinheiro vai**. Isso se chama orçamento, e não precisa de planilha complicada.

### Passo 1: anote tudo por 30 dias

Cada gasto, do aluguel ao café. Pode ser no bloco de notas do celular, num caderno ou numa planilha simples. No fim do mês, junte por grupo:

| Grupo | Exemplos |
|---|---|
| **Fixos** | aluguel, luz, água, internet, escola, plano de celular |
| **Variáveis essenciais** | mercado, transporte, remédio |
| **Variáveis "dá pra mexer"** | delivery, saídas, assinaturas, compras por impulso |
| **Dívidas** | parcelas, cartão |
| **Futuro** | reserva, investimento |

### Passo 2: renda que varia pede cuidado extra

Barbeiro não tem salário igual todo mês: tem mês de festa (dezembro é cheio) e mês fraco (depois das férias, por exemplo). Por isso:

- **Monte o orçamento pela renda dos meses fracos**, não pela dos meses bons.
- **No mês bom, guarde a diferença** pra cobrir o mês fraco.
- Preveja as **contas do começo do ano** (matrícula, material escolar, IPVA, IPTU) e vá guardando um pouco por mês.

### Passo 3: uma regra simples pra começar

Uma divisão muito usada como ponto de partida é separar a renda em **necessidades**, **desejos** e **futuro** — por exemplo, 50% / 30% / 20%. Não é lei: é uma referência. Se hoje sobra 0% pro futuro, comece com 5% e vá subindo.

### Passo 4: corte o que não faz falta

Olhe o grupo "dá pra mexer". Assinaturas esquecidas e pequenas compras diárias somam muito no mês. **R$ 15 por dia são R$ 450 por mês.**

### Para pensar

- Qual grupo te surpreendeu depois de 30 dias anotando?
- Qual é a sua renda num mês fraco?"""},
{"id": "reserva-de-emergencia", "titulo": "Reserva de emergência: o seu colchão", "conteudo": """Barbeiro que se machuca na mão, máquina que queima, mês de movimento fraco, problema na família. Pra quem trabalha por conta própria, **um imprevisto pode virar dívida** se não houver dinheiro guardado.

**Reserva de emergência** é um dinheiro separado **só pra imprevistos**. Não é pra viagem, nem pra comprar a máquina nova que lançou.

### Quanto guardar

Uma referência muito usada é guardar o equivalente a **3 a 6 meses dos seus gastos essenciais**. Pra quem tem renda que varia (como barbeiro autônomo), vale mirar no lado mais alto, porque um mês sem trabalhar pesa mais.

Exemplo: gastos essenciais de R$ 2.500 por mês → reserva entre **R$ 7.500 e R$ 15.000**.

Parece muito? Ninguém junta isso de uma vez. **Comece pela primeira meta: um mês de gastos.**

### Onde guardar

A reserva precisa ser:

- **Segura:** baixo risco de perder dinheiro.
- **Fácil de tirar:** você precisa conseguir sacar no mesmo dia (liquidez diária).
- **Separada:** fora da conta do dia a dia, pra não gastar sem perceber.

Por isso, a reserva **não** vai pra ações, criptomoeda ou "investimento que rende muito". **Desconfie de qualquer promessa de rendimento alto e garantido** — é o caminho mais comum dos golpes.

### Como juntar

1. **Pague-se primeiro:** no dia em que fizer a sua retirada, transfira um valor fixo pra reserva antes de gastar.
2. **Use os meses bons:** dezembro cheio, semana de feriado, um combo que vendeu muito.
3. **Usou? Reponha** antes de voltar a investir em outra coisa.

### Para pensar

- Se você ficasse 30 dias sem poder trabalhar, como pagaria as contas?
- Qual valor dá pra separar por semana a partir de agora?"""},
{"id": "dividas", "titulo": "Saindo das dívidas", "conteudo": """Dívida não é vergonha; o problema é **dívida cara sem plano**. Os juros de **cartão de crédito rotativo** e **cheque especial** estão entre os mais altos do mercado: uma dívida pequena pode dobrar rápido.

### Passo 1: coloque tudo no papel

Pra cada dívida: com quem é, quanto falta, valor da parcela e **juros por mês** (está no contrato ou no aplicativo do banco).

| Dívida | Falta pagar | Parcela | Juros/mês |
|---|---:|---:|---:|
| Cartão (rotativo) | | | |
| Empréstimo | | | |
| Máquina parcelada | | | |

### Passo 2: pare de aumentar

- Corte o uso do cartão até a situação melhorar.
- Não pague uma dívida fazendo outra mais cara.

### Passo 3: ataque a mais cara primeiro

Pague o mínimo em todas e **jogue todo o dinheiro extra na de juros mais alto**. Quando ela acabar, vá pra próxima. Matematicamente, é o jeito de pagar menos juros no total.

### Passo 4: negocie

- Ligue ou use o aplicativo do banco e **peça pra trocar a dívida cara por uma mais barata** (um empréstimo pessoal com juros menores pra quitar o rotativo, por exemplo).
- Bancos e lojas fazem **mutirões e feirões de renegociação**; fique de olho.
- **Leia o novo contrato:** veja o custo total, não só o valor da parcela.

### Dívida do MEI

Se você é MEI e ficou com o DAS atrasado, procure regularizar: o DAS é o que garante sua cobertura no INSS. Em outubro de 2026, a **Lei Complementar nº 238/2026** trouxe perdão de alguns débitos do MEI com a União, com condições; **confirme com seu contador** se o seu caso se encaixa.

### Para pensar

- Qual das suas dívidas tem os juros mais altos?
- Quanto extra por mês dá pra jogar nela?"""},
{"id": "mei-o-que-paga-o-que-garante", "titulo": "MEI: o que você paga e o que ganha com isso", "conteudo": """Barbeiro e cabeleireiro podem se formalizar como **MEI (Microempreendedor Individual)**. É o jeito mais simples de ter CNPJ, emitir nota e contribuir pro INSS.

### Quanto custa por mês (2026)

O MEI paga um boleto mensal fixo, o **DAS**. Segundo a Receita Federal, em 2026 ele é:

| Parte | Valor |
|---|---:|
| INSS (5% do salário mínimo de R$ 1.621,00) | R$ 81,05 |
| ISS (pra quem presta serviço, como barbeiro) | R$ 5,00 |
| **Total pra serviços** | **R$ 86,05** |

*O valor muda quando o salário mínimo muda.*

### Até quanto pode faturar

- **2026: até R$ 81 mil por ano** (Lei Complementar nº 123/2006).
- **2027: até R$ 110 mil por ano** e **a partir de 2028: até R$ 140 mil por ano** (Lei Complementar nº 238, de 21 de outubro de 2026).

Quem abre o MEI no meio do ano tem um limite proporcional aos meses. Passou do limite? **Fale com um contador antes do fim do ano**: as regras pra quem ultrapassa mudam conforme o tamanho do excesso.

A mesma lei de 2026 também muda regras sobre **quantos empregados o MEI pode ter, a partir de 2027**. Confirme com o contador antes de contratar.

### O que o DAS garante

Pagando o DAS em dia, você contribui pro INSS e passa a ter acesso a benefícios da Previdência, como **aposentadoria por idade**, **auxílio por incapacidade temporária** (afastamento por doença), **salário-maternidade** e **pensão por morte** pra família, cumprindo os prazos mínimos de contribuição de cada um.

Pra um barbeiro, que depende das mãos, ter cobertura em caso de afastamento faz muita diferença.

### Obrigações que não podem faltar

- **Pagar o DAS todo mês** (gerado no portal do Simples Nacional, o PGMEI).
- **Entregar a declaração anual do MEI** (DASN-SIMEI).
- **Guardar** o registro do que faturou no mês.

### Para pensar

- Você está em dia com o DAS?
- Seu faturamento está perto do limite? Se a barbearia cresce, quando vai valer a pena virar ME?"""},
{"id": "fazer-o-dinheiro-trabalhar", "titulo": "Fazer o dinheiro trabalhar", "conteudo": """Com a casa arrumada (dinheiro separado, orçamento, reserva e sem dívida cara), dá pra pensar em **fazer o dinheiro render**.

### A ordem certa

1. **Reserva de emergência completa.**
2. **Investir no próprio negócio, com conta feita:** uma cadeira a mais rende quanto por mês? Em quanto tempo se paga? (Veja o curso [Preço e lucro na barbearia](/cursos/preco-e-lucro-na-barbearia).)
3. **Aposentadoria:** o INSS do MEI garante o básico. Pra viver melhor lá na frente, é preciso guardar mais por conta própria.
4. **Metas com prazo:** reforma, carro, casa. Cada meta com seu valor e sua data.

### Princípios que protegem você

- **Prazo define o investimento.** Dinheiro que você vai usar logo deve ficar onde não oscila. Dinheiro pra daqui a muitos anos pode aceitar mais risco.
- **Entenda antes de investir.** Se você não consegue explicar em uma frase como aquilo gera dinheiro, não invista.
- **Desconfie de rendimento alto garantido**, de "oportunidade única" e de quem pede pra trazer amigos. Pirâmide financeira e golpes usam exatamente isso.
- **Diversifique:** não coloque tudo num lugar só.
- **Custos importam:** taxas altas comem o rendimento ao longo dos anos.

### O hábito que mais importa

Mais do que escolher o "melhor investimento", o que faz diferença é **guardar todo mês, sem falhar**. Um valor pequeno guardado por anos, rendendo juros sobre juros, vira muito.

Exemplo de hábito: **todo dia de retirada, 10% vão direto pra uma conta de investimento**, antes de qualquer gasto.

### Para pensar

- Qual a sua primeira meta com prazo? Quanto precisa guardar por mês pra chegar lá?
- Que oferta de "investimento" já chegou até você e parecia boa demais?"""},
]

# ---------------------------------------------------------------- marketing pra barbearia
M = [
{"id": "seja-encontrado", "titulo": "Seja encontrado: Google e mapa", "conteudo": """Quando alguém procura "barbearia perto de mim", quem aparece **no mapa** leva a maior parte dos clientes novos. Por isso, o primeiro passo do marketing de uma barbearia é ser **encontrada**.

### Perfil da Empresa no Google

O Google oferece de graça o **Perfil da Empresa** (o cartão que aparece na busca e no Google Maps). Mantenha completo:

- **Nome** igual ao da placa (sem encher de palavras-chave).
- **Endereço** certinho e o pino no lugar certo do mapa.
- **Horário de funcionamento**, incluindo feriados.
- **Telefone/WhatsApp** e **link do seu site ou de agendamento**.
- **Categoria** (barbearia) e **serviços** com preço, se você mostra preço.
- **Fotos de verdade:** fachada (pra pessoa reconhecer na rua), ambiente, equipe e muitos cortes. Atualize sempre.

### Fachada também é marketing

A placa, a vitrine e a porta são vistas todo dia por quem passa. Uma fachada limpa, iluminada e com o nome legível de longe trabalha por você de graça. Coloque o **horário** e o **@ do Instagram** na porta.

### Site com agenda

Um site seu (não só rede social) passa confiança, aparece no Google e deixa o cliente **marcar sozinho a qualquer hora**. Coloque o link no Perfil da Empresa, na bio do Instagram e no WhatsApp.

### Para pensar

- Pesquise "barbearia" no mapa do seu bairro. Você aparece? Como estão as suas fotos comparadas às dos concorrentes?
- Seu horário no Google está certo?"""},
{"id": "avaliacoes", "titulo": "Avaliações: peça, responda e aprenda", "conteudo": """Antes de ir a uma barbearia nova, a maioria das pessoas olha **as avaliações**. Nota alta ajuda, mas **quantidade e avaliações recentes** pesam tanto quanto.

### Como conseguir mais avaliações

- **Peça sempre, no mesmo momento:** no fim do corte, quando o cliente se olha no espelho e gosta. "Se curtiu, deixa uma avaliação pra gente no Google? Ajuda demais."
- **Facilite:** tenha o link (ou um QR code) da página de avaliação no balcão e pronto pra mandar no WhatsApp.
- **Nunca compre avaliação nem invente.** Além de antiético, as plataformas removem e podem punir o perfil.
- **Não ofereça desconto em troca de nota boa.** Peça avaliação sincera.

### Como responder

- **Responda todas**, boas e ruins. Mostra que tem alguém cuidando.
- **Elogio:** agradeça pelo nome e cite algo do atendimento.
- **Reclamação:** responda com calma, sem brigar. Reconheça, explique o que vai melhorar e chame pra resolver no privado. Quem lê a resposta é o próximo cliente — e ele vai julgar **como você trata quem reclama**.

Exemplo: *"Oi, Carlos. Sentimos muito pela espera de sábado. Estamos ajustando a agenda pra não acontecer de novo. Chama a gente no WhatsApp que queremos te atender do jeito certo."*

### Aprenda com elas

Leia as avaliações a cada mês. Se três pessoas reclamam da mesma coisa (espera, limpeza, preço), é um recado.

### Para pensar

- Quantas avaliações você ganhou no último mês?
- Qual foi a última reclamação? Ela foi respondida?"""},
{"id": "instagram-que-agenda", "titulo": "Instagram que vira agendamento", "conteudo": """O Instagram é a **vitrine** da barbearia. Mas seguidor não paga conta: o objetivo é **transformar quem vê em quem marca**.

### Perfil

- **Foto:** logo ou a fachada, legível pequenininha.
- **Bio em 3 linhas:** o que você faz, onde fica e como marcar. Ex.: *"Degradê e barba · Centro de Campinas · Marque pelo link 👇"*
- **Link na bio:** direto pro agendamento (o seu site com agenda).
- **Destaques:** Cortes, Barba, Preços (se mostra), Como chegar, Avaliações.

### O que postar

- **Antes e depois:** o conteúdo que mais mostra o seu trabalho. Peça autorização do cliente.
- **Vídeo curto do processo:** degradê sendo feito, toalha quente, acabamento na navalha.
- **Dica rápida:** como pentear, como cuidar da barba entre os cortes.
- **Bastidores e equipe:** o cliente escolhe o barbeiro; mostre quem são.
- **Avisos úteis:** horários livres hoje, feriado, serviço novo.

### Frequência e qualidade

- Melhor **poucas vezes por semana com constância** do que um mês todo dia e depois sumir.
- **Luz boa e fundo limpo** valem mais que câmera cara. Reserve um cantinho da barbearia pra fotos.
- **Mesmo estilo nas fotos** ajuda o perfil a ter cara própria.

### Sempre com um próximo passo

Termine os posts com um convite: *"Marque pelo link da bio"*, *"Tem horário amanhã às 10h"*. Quem gostou precisa saber **o que fazer agora**.

### Para pensar

- Quem entra no seu perfil hoje sabe, em 5 segundos, onde fica e como marcar?
- Qual foi o seu post que mais trouxe gente? Por quê?"""},
{"id": "whatsapp-sem-spam", "titulo": "WhatsApp sem virar spam", "conteudo": """O WhatsApp é onde o cliente da barbearia conversa. Usado bem, aproxima. Usado mal (mensagem em massa, todo dia, pra quem não pediu), **irrita e queima a marca** — e ainda pode levar ao bloqueio do número.

### WhatsApp Business

O aplicativo gratuito **WhatsApp Business** tem recursos úteis:

- **Perfil comercial:** endereço, horário, descrição e link do site.
- **Respostas rápidas:** textos prontos pras perguntas de sempre (preço, endereço, como marcar).
- **Mensagem de ausência:** resposta automática fora do horário, com o link de agendamento.
- **Etiquetas:** organizar conversas (novo cliente, retorno, aniversário).
- **Catálogo:** serviços com foto e descrição.

### Regras de ouro

1. **Só mande pra quem pediu ou é cliente e aceitou receber.** E respeite quem pedir pra parar.
2. **Mensagem pessoal vale mais que mensagem em massa:** "Fala, Marcos! Faz 3 semanas do seu corte, quer que eu deixe um horário pra sexta?"
3. **Poucas mensagens, todas úteis:** lembrete, horário vago, novidade de verdade.
4. **Lista de transmissão** (recurso do próprio WhatsApp) só chega em quem **salvou o seu número**; use pra avisos importantes, com moderação.
5. **Status** é um bom lugar pra mostrar cortes do dia sem incomodar ninguém.

### LGPD em uma frase

O telefone do cliente foi dado pra marcar horário; **pra usar em promoção, peça autorização** e guarde esses dados com cuidado.

### Para pensar

- Quais são as 5 perguntas que você mais responde? Elas já viraram respostas rápidas?
- Quantas mensagens por mês um cliente seu recebe de você?"""},
{"id": "indicacao-e-parcerias", "titulo": "Indicação e parcerias no bairro", "conteudo": """Cliente que vem por **indicação** já chega confiando, costuma ficar mais e indica outros. E parcerias com negócios do bairro trazem gente que **já está perto**.

### Programa de indicação simples

- **Indique um amigo:** quando o amigo vem pela primeira vez, **os dois ganham** algo (acabamento, sobrancelha, desconto no próximo corte).
- **Combine regras claras:** vale só pra cliente novo, um benefício por amigo.
- **Lembre o cliente** no fim do corte e coloque um cartão no balcão.

### Parcerias que fazem sentido

Pense em quem atende o **mesmo público**:

- **Academias:** desconto pros alunos; um cartaz no mural.
- **Lojas de roupa masculina:** quem compra roupa pra uma festa também quer cortar o cabelo.
- **Fotógrafos e cerimoniais de casamento:** pacote "dia do noivo".
- **Escolas e times do bairro:** corte infantil, apoio ao time de várzea.
- **Tatuadores e lojas de barba e cosméticos.**

Uma boa parceria é **boa pros dois lados**: ofereça algo pro cliente do parceiro e peça o mesmo.

### Eventos e presença

- **Corte solidário** num evento do bairro.
- **Dia especial** (Dia dos Pais, volta às aulas) com horários extras.
- **Participação em feiras** e encontros de barbeiros: você aprende e aparece.

### Medir

Pergunte **"como nos achou?"** pra todo cliente novo e anote. Em poucos meses você sabe quais parcerias e canais trazem gente de verdade, e onde vale investir mais.

### Para pensar

- Quais 3 negócios do seu bairro atendem o mesmo público que você?
- Que benefício de indicação caberia no seu preço?"""},
]

for c in [
    curso("seu-dinheiro-em-ordem", "Seu dinheiro em ordem", "Finanças pessoais pra quem vive de barbearia: separar contas, orçamento com renda que varia, reserva, dívidas, MEI e investir com segurança.",
          "Finanças", ["barbearia", "finanças pessoais", "MEI", "dinheiro"],
          [{"id": "organizar", "titulo": "Organizar", "licoes": F[0:2]}, {"id": "proteger", "titulo": "Proteger", "licoes": F[2:5]}, {"id": "crescer", "titulo": "Crescer", "licoes": F[5:6]}]),
    curso("marketing-pra-barbearia", "Marketing pra barbearia", "Google e mapa, avaliações, Instagram que vira agendamento, WhatsApp sem spam, indicação e parcerias no bairro.",
          "Marketing", ["barbearia", "marketing", "instagram", "google"],
          [{"id": "ser-encontrado", "titulo": "Ser encontrado", "licoes": M[0:2]}, {"id": "redes", "titulo": "Redes e conversas", "licoes": M[2:4]}, {"id": "bairro", "titulo": "No bairro", "licoes": M[4:5]}]),
]:
    json.dump(c, open(os.path.join(DESTINO, c["slug"] + ".json"), "w"), ensure_ascii=False, indent=2)
    print("ok", c["slug"], sum(len(m["licoes"]) for m in c["modulos"]), "lições")
