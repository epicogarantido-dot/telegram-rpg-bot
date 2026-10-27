"""Guias da Revista. Conferidos em 26/10/2026:
- Google: Central de Ajuda do Perfil da Empresa (inscrição, fotos, diretrizes) e política de
  conteúdo do Google Maps (avaliações com incentivo).
- Salão-parceiro: Lei 12.592/2012 com os arts. 1º-A a 1º-D da Lei 13.352/2016 (texto atualizado
  da Câmara) e o julgamento da ADI 5625 no STF (28/10/2021, resumos da Trilhante e da ContNews).
- Dia do barbeiro: Lei 12.592/2012, art. 5º.
"""

CAMARA_12592 = "https://www2.camara.leg.br/legin/fed/lei/2012/lei-12592-18-janeiro-2012-612301-normaatualizada-pl.html"


def guia(**kw):
    return {"tipo": "guia", **kw}


GOOGLE = guia(
slug="google-perfil-da-empresa-pra-barbearia",
titulo="Perfil da Empresa no Google: o passo a passo pra barbearia aparecer no mapa",
resumo="Quem procura \"barbearia perto de mim\" vê primeiro o mapa. Como criar e verificar o perfil, que fotos pôr, o nome certo e o erro que pode tirar suas avaliações do ar.",
publicadoEm="2026-10-26",
tags=["barbearia", "google", "marketing", "guia"],
conteudo="""Quando alguém digita "barbearia perto de mim" no celular, o que aparece primeiro não é o Instagram de ninguém: é o mapa, com três ou quatro barbearias, nota, fotos e o botão de rota. Estar ali é de graça. Neste guia, o passo a passo segundo a própria Central de Ajuda do Google, e os cuidados pra não ter o perfil suspenso.

### O que é

O Perfil da Empresa no Google (antigo Google Meu Negócio) é a ficha da sua barbearia na Pesquisa e no Maps: endereço, horário, telefone, fotos, avaliações. Um detalhe importante da ajuda oficial: os clientes só encontram o perfil depois que ele é verificado.

### Criar e verificar

1. No computador, entre na sua Conta do Google, ou crie uma. O Google sugere usar o e-mail da empresa, se você tiver.
2. Digite o nome da barbearia e escolha a categoria. Se aparecer que outra pessoa já verificou a empresa, dá pra pedir a propriedade do perfil.
3. Diga se tem um local que os clientes podem visitar. Barbearia com porta aberta: "Sim", e informe o endereço ou marque no mapa. Se você atende na casa do cliente, informe a área de cobertura.
4. Coloque telefone e site.
5. Escolha a forma de verificação. O Google recomenda revisar tudo antes de pedir.

Uma regra que derruba muita gente: só pode haver um perfil por empresa. Perfil repetido pode levar à suspensão da conta.

### O nome certo

O nome tem que ser o nome real da barbearia, o mesmo da fachada. Nada de "Barbearia do Zé - Corte Degradê Barato Centro". A ajuda do Google diz que informação desnecessária no nome pode suspender o perfil, e proíbe, por exemplo, palavras em maiúsculas e horário no nome. Serviço, bairro e horário vão nos campos próprios.

### Horário: um detalhe pra quem só atende com hora marcada

Coloque o horário normal e use o horário especial pra feriados. Mas atenção: segundo as diretrizes do Google, empresas que funcionam somente com hora marcada não devem informar horário de funcionamento. Se a sua barbearia atende quem chega, informe o horário. Se é só com agendamento, siga essa regra.

### Fotos: o que o Google pede

A Central de Ajuda recomenda fotos de 720 x 720 pixels, nítidas, bem iluminadas e sem filtro ou edição pesada, porque "a imagem deve representar a realidade". E sugere, pra cada tipo:

- **Fachada:** pelo menos três fotos de fora, de cada direção por onde o cliente chega e em horários diferentes, pra ele reconhecer a barbearia na rua.
- **Interior:** pelo menos três, mostrando como é estar lá dentro.
- **Trabalho:** fotos que mostram o tipo de serviço que você faz, ou seja, os cortes.
- **Logotipo e capa:** a capa é a foto que mais representa a barbearia.

O curso [Foto e vídeo da barbearia com o celular](/cursos/foto-e-video-com-o-celular) ensina a fazer essas fotos sem equipamento.

### Descrição

Use a descrição pra contar o que a barbearia faz e a história dela. As diretrizes não permitem links, preços nem promoções nesse campo ("tudo com 50% de desconto" não pode).

### Avaliações: o erro que tira tudo do ar

Peça avaliação pra todos os clientes, sempre. Mas nunca ofereça nada em troca. A política do Google Maps proíbe dar desconto, serviço grátis, produto ou dinheiro em troca de avaliação, ou pra retirar uma avaliação negativa, e avaliações assim são removidas. Peça uma avaliação sincera, e responda a todas, como mostramos no curso [Marketing pra barbearia](/cursos/marketing-pra-barbearia).

### Na prática

| Hoje | Esta semana | Todo mês |
|---|---|---|
| Criar e pedir a verificação | 3 fotos de fachada, 3 de dentro, 3 de cortes | Fotos novas e responder avaliações |

Uma barbearia bem cuidada no mapa trabalha 24 horas por dia, de graça. É o primeiro lugar onde o cliente novo vai te conhecer, então capriche nele como capricha na fachada.""",
fontes=[
    {"titulo": "Google — Fazer a inscrição no Perfil da Empresa (Central de Ajuda)", "url": "https://support.google.com/business/answer/10514137?hl=pt-BR"},
    {"titulo": "Google — Dicas para fotos específicas da empresa (Central de Ajuda)", "url": "https://support.google.com/business/answer/6123536?hl=pt-BR"},
    {"titulo": "Google — Gerenciar fotos e vídeos do Perfil da Empresa (Central de Ajuda)", "url": "https://support.google.com/business/answer/6103862?hl=pt-BR"},
    {"titulo": "Google — Diretrizes para representar sua empresa no Google", "url": "https://support.google.com/business/answer/3038177?hl=pt-BR"},
    {"titulo": "Google Maps — Conteúdo proibido e restrito (avaliações com incentivo)", "url": "https://support.google.com/contributionpolicy/answer/7400114?hl=pt-BR"},
])


PARCEIRO = guia(
slug="barbeiro-parceiro-lei-do-salao-parceiro",
titulo="Barbeiro parceiro: o que diz a Lei do Salão-Parceiro e o que o STF decidiu",
resumo="Trabalhar por porcentagem é comum nas barbearias. A lei permite, com contrato escrito e homologado. O STF confirmou em 2021, com um aviso: parceria de fachada vira vínculo de emprego.",
publicadoEm="2026-10-26",
tags=["barbearia", "salão-parceiro", "equipe", "lei", "guia"],
conteudo=f"""Na maioria das barbearias com mais de uma cadeira, o combinado é antigo e de boca: o barbeiro fica com uma porcentagem de cada corte e a casa com o resto. Desde 2016 existe uma lei pra esse arranjo, e em 2021 o Supremo Tribunal Federal disse como ela deve ser usada. Quem segue as regras fica protegido; quem só imita o nome corre risco de processo.

### De onde vem a lei

A Lei 12.592, de 2012, reconheceu a profissão de barbeiro em todo o país. Em 2016, a Lei 13.352 acrescentou a ela os artigos 1º-A a 1º-D, criando o salão-parceiro e o profissional-parceiro. A lei fala em "salões de beleza" e vale pra cabeleireiro, barbeiro, esteticista, manicure, pedicure, depilador e maquiador ([texto atualizado na Câmara]({CAMARA_12592})).

### Como funciona o dinheiro

O salão-parceiro recebe o pagamento dos clientes e retém duas coisas: a cota-parte combinada e os tributos e contribuições que o profissional deve sobre a parte dele. Pra lei, a parte do salão é aluguel de bens e serviço de gestão, e a parte do barbeiro é prestação de serviço de beleza. A parte do barbeiro não entra no faturamento do salão, mesmo com nota fiscal única pro cliente.

O profissional-parceiro pode ser MEI, micro ou pequeno empresário, e não pode assumir as responsabilidades da administração do salão.

### O contrato

Tem que ser escrito, homologado pelo sindicato da categoria (ou, sem sindicato, pelo órgão local do Ministério do Trabalho) e assinado diante de duas testemunhas. E precisa ter, obrigatoriamente:

1. O percentual retido pelo salão em cada serviço.
2. A obrigação do salão de reter e recolher os tributos do parceiro.
3. Condições e prazo de pagamento do parceiro, por tipo de serviço.
4. Os direitos do parceiro sobre o uso dos materiais e o acesso ao local.
5. A possibilidade de qualquer um encerrar, com aviso de pelo menos 30 dias.
6. As responsabilidades de cada um com higiene, funcionamento e bom atendimento.
7. A obrigação do parceiro de manter o cadastro dele em dia.

Enquanto durar a parceria, não existe relação de emprego nem de sociedade. Mas o salão continua responsável pelas condições de trabalho, equipamentos e instalações.

### Quando vira emprego

A lei diz que há vínculo de emprego em dois casos: quando não existe o contrato formalizado como ela manda, e quando o parceiro faz funções diferentes das previstas no contrato.

Em 28 de outubro de 2021, o STF julgou a ação que questionava a lei (ADI 5625) e decidiu, por maioria, que ela é constitucional. A tese aprovada tem duas partes: o contrato de parceria entre salões e profissionais é válido; e é nulo quando usado pra disfarçar uma relação de emprego que existe de fato, que deve ser reconhecida sempre que os elementos dela estiverem presentes.

Em palavras de balcão: o papel não basta. Se na rotina o barbeiro cumpre horário imposto, recebe ordens como empregado e não tem autonomia sobre a própria agenda, o contrato pode ser anulado.

### O que fazer, se você é o dono

- Coloque por escrito o que hoje é de boca, com as sete cláusulas.
- Leve o contrato pro sindicato homologar.
- Retenha e recolha os tributos da parte do parceiro.
- Deixe a agenda e os clientes do parceiro com ele, e não dê a ele tarefas fora do contrato.

### O que conferir, se você é o barbeiro

- Peça o contrato escrito, com a sua porcentagem e o prazo de pagamento.
- Confira se os tributos sobre a sua parte estão sendo recolhidos.
- Mantenha o seu MEI em dia, se for o caso.

O curso [Abrir e organizar sua barbearia](/cursos/abrir-e-organizar-sua-barbearia) compara parceria e emprego e mostra a conta de quanto cada cadeira precisa render.

*Resumo da lei e da decisão, não orientação jurídica. Monte o contrato com um contador ou advogado.*""",
fontes=[
    {"titulo": "Lei nº 12.592/2012, com os arts. 1º-A a 1º-D da Lei nº 13.352/2016 — texto atualizado na Câmara dos Deputados", "url": CAMARA_12592},
    {"titulo": "Trilhante — STF, ADI 5625 (julgado em 28/10/2021): teses", "url": "https://informativos.trilhante.com.br/julgados/stf-adi-5625-df"},
    {"titulo": "ContNews — STF decide que contrato de parceria entre salões e profissionais de beleza é constitucional", "url": "https://www.portalcontnews.com.br/stf-decide-que-contrato-de-parceria-entre-saloes-e-profissionais-de-beleza-e-constitucional/"},
])


DIA = {
"tipo": "curiosidade",
"slug": "dia-nacional-do-barbeiro-18-de-janeiro",
"titulo": "18 de janeiro: o Dia Nacional do Barbeiro existe, e está na lei",
"resumo": "A mesma lei de 2012 que reconheceu a profissão criou o Dia Nacional do Cabeleireiro e do Barbeiro, na data em que foi assinada. Ideias pra sua barbearia aproveitar a data.",
"publicadoEm": "2026-10-26",
"tags": ["barbearia", "curiosidade", "datas", "lei"],
"conteudo": f"""Pouca gente sabe, mas o barbeiro tem um dia oficial no Brasil, e ele não foi escolhido por acaso: é 18 de janeiro, a data em que a lei que reconheceu a profissão foi assinada, em 2012.

### Uma lei curta

A Lei 12.592, de 18 de janeiro de 2012, tem poucos artigos ([texto atualizado na Câmara]({CAMARA_12592})). O primeiro reconhece, em todo o território nacional, as profissões de cabeleireiro, barbeiro, esteticista, manicure, pedicure, depilador e maquiador, e define esses profissionais como quem faz a "higiene e embelezamento capilar, estético, facial e corporal" das pessoas.

O quarto artigo cobra o básico do ofício: obedecer às normas sanitárias e esterilizar materiais e utensílios usados no atendimento.

E o quinto é o da data: institui o Dia Nacional do Cabeleireiro, Barbeiro, Esteticista, Manicure, Pedicure, Depilador e Maquiador, "a ser comemorado em todo o País, a cada ano, no dia e mês coincidente com a data da promulgação desta Lei". A lei foi assinada em Brasília em 18 de janeiro de 2012. Pronto: 18 de janeiro.

Dois artigos da lei original foram vetados. Anos depois, em 2016, ela ganhou o capítulo do salão-parceiro, que explicamos no guia [Barbeiro parceiro](/revista/barbeiro-parceiro-lei-do-salao-parceiro).

### Outras datas pelo mundo

Em Havana, os cabeleireiros e barbeiros festejam o dia deles todo 27 de dezembro, cortando o cabelo de graça na rua, como contamos em [Havana](/revista/havana-callejon-de-los-peluqueros). Lá, a festa entrega até um prêmio com o nome do primeiro barbeiro licenciado da cidade, em 1552.

### Como usar a data na sua barbearia

**Ponha no calendário.** Uma data com motivo, logo depois das festas de fim de ano, dá assunto pra falar com o cliente sem parecer propaganda.

Faça uma homenagem pra equipe. Um café da manhã, um reconhecimento pro barbeiro mais antigo da casa, um post contando a história de cada um.

Conte a história pro cliente. "Hoje é o Dia Nacional do Barbeiro, desde 2012, por lei" é um assunto pronto na cadeira e no Instagram, junto com a história dos [barbeiros sangradores](/revista/barbeiros-sangradores-no-brasil-imperial), a origem da profissão no Brasil.

Faça um gesto pro bairro. Uma manhã de corte solidário pra crianças ou idosos de uma instituição da cidade, no estilo de Havana, vira notícia local e mostra que a barbearia faz parte da comunidade.

Uma profissão que já foi dos barbeiros-sangradores, muitos deles africanos escravizados e libertos, ganhou reconhecimento em lei há pouco mais de uma década. A data merece ser lembrada.""",
"fontes": [
    {"titulo": "Lei nº 12.592, de 18 de janeiro de 2012 — texto atualizado na Câmara dos Deputados", "url": CAMARA_12592},
],
}


# ---------- 27/10/2026 ----------
# Pix Automático: FAQ do BC para participantes, Agência Brasil (16/06/2025 e 13/10/2025) e slides
#   do Fórum Pix do BC (Resolução BCB nº 482/2025: CNPJ ativo há mais de 6 meses).
# Nota do MEI: Perguntão MEI da Receita (atualizado em 29/04/2025, art. 106 da Res. CGSN 140) e a
#   Nota Técnica 2023.001 da NFS-e (emissor nacional obrigatório desde 01/09/2023).
# Preços: Lei 10.962/2004 (texto atualizado na Câmara, com o art. 5º-A), Decreto 5.903/2006 e
#   Lei 13.455/2017.
# LGPD: Lei 13.709/2018 (texto atualizado na Câmara) e Resolução CD/ANPD nº 2/2022.

BC_FAQ_PIX = "https://www.bcb.gov.br/content/estabilidadefinanceira/pix/pix-automatico-FAQ-participantes.pdf"

PIX_AUTOMATICO = guia(
slug="pix-automatico-plano-mensal-da-barbearia",
titulo="Pix Automático: o plano mensal da barbearia sem cobrar o cliente todo mês",
resumo="O cliente autoriza uma vez no app do banco e a mensalidade sai sozinha. Quem pode receber, quanto custa, o que o cliente controla e o passo a passo pra montar o seu plano.",
publicadoEm="2026-10-27",
tags=["barbearia", "pix", "plano mensal", "dinheiro", "guia"],
conteudo="""Muita barbearia já vende plano mensal: o cliente paga um valor fixo e corta duas, três, quatro vezes no mês. O plano é bom pros dois lados, mas tem um ponto fraco: todo mês alguém precisa lembrar de cobrar, e o cliente precisa lembrar de pagar. Desde 16 de junho de 2025 existe um jeito de tirar essa conversa do caminho, criado pelo próprio Banco Central: o **Pix Automático**.

### O que é

O cliente autoriza uma vez, no aplicativo do banco dele, e a partir daí a cobrança sai sozinha na data combinada, sem ele ter que fazer um Pix a cada mês. É o mesmo princípio do débito automático da conta de luz, só que pelo Pix. O Banco Central diz que ele serve pra cobranças periódicas: semanais, mensais, trimestrais, semestrais ou anuais. Plano de barbearia cabe certinho aí.

Lançado como opcional em junho de 2025, ele virou obrigatório em 13 de outubro: pelas regras do Banco Central, toda instituição que oferece conta com Pix tem que deixar o cliente pagar com Pix Automático. Ou seja, praticamente qualquer cliente seu consegue autorizar, pelo app do banco que ele já usa.

### Quem pode receber

Aqui está o detalhe que mais pega o barbeiro: **só recebe pelo Pix Automático quem tem CNPJ, e ativo há mais de seis meses**. A regra veio da Resolução BCB nº 482, de junho de 2025, pra dificultar golpe com empresa recém-aberta. O MEI tem CNPJ, então serve. Quem atende só como pessoa física, com chave no CPF, fica de fora. Pra isso existe o Pix agendado, que o próprio cliente programa, mas aí o controle fica todo com ele.

O outro detalhe: pro lado de quem recebe, oferecer o produto é opcional. O seu banco pode ter ou não, e pode cobrar uma tarifa de você. Pro cliente, cobrar tarifa é proibido.

### O que o cliente controla

É isso que faz o cliente topar. Na autorização, ele pode pôr um valor máximo: se a cobrança vier acima, ela simplesmente não acontece. Ele vê todas as autorizações num menu próprio do app, chamado "Pix Automático", e pode cancelar quando quiser. E cada débito é agendado de 2 a 10 dias antes da data, justamente pra ele se programar.

Se faltar saldo no dia, o banco do cliente tenta de novo à noite e manda uma notificação pra ele. Novas tentativas nos dias seguintes só acontecem se a autorização previr isso. E se não der, nada impede de vocês acertarem aquele mês por outro meio, como um Pix comum. A autorização continua valendo pros meses seguintes.

### Passo a passo pra montar o seu plano

1. **Pergunte no seu banco** (o da conta da barbearia) se ele oferece Pix Automático pra recebedor e quanto cobra. Se não oferecer, vale comparar com outro banco digital.
2. **Feche as regras do plano no papel.** Quantos cortes por mês, se barba entra, se passa pro mês seguinte o que não usou, em que dias vale. Conta de exemplo: corte a R$ 40; plano de 2 cortes por R$ 70. O cliente economiza R$ 10, e você recebe adiantado, sabe quanto entra e garante a volta dele.
3. **Escolha o dia da cobrança com o cliente.** Escolha bem: o dia que vale é o da autorização e não muda depois. Pra trocar, é preciso cancelar e autorizar de novo.
4. **Mande a solicitação pelo banco.** Dependendo do banco, o cliente confirma por uma notificação no app ou lendo um QR Code. Em uma das formas, ele já paga o primeiro mês na hora e autoriza os próximos no mesmo passo.

### Cuidados

Explique o plano antes, com calma, e deixe as regras escritas onde o cliente veja. Assinatura que o cliente não entendeu vira cancelamento no segundo mês. Combine também o que acontece quando o preço sobe: se a nova mensalidade passar do valor máximo que ele autorizou, a cobrança não sai até ele mudar o limite no app.

E não esqueça de anotar quem é mensalista. Na hora de marcar, o barbeiro precisa saber de cara quem já pagou o mês. Pra calcular o valor do plano sem perder dinheiro, o curso [Preço e lucro na barbearia](/cursos/preco-e-lucro-na-barbearia) ajuda a fazer a conta.

O plano mensal sempre foi uma boa ideia que dava trabalho pra cobrar. Com o Pix Automático, o trabalho fica com o banco.""",
fontes=[
    {"titulo": "Banco Central — FAQ Pix Automático (participantes)", "url": BC_FAQ_PIX},
    {"titulo": "Banco Central — Fórum Pix, 26/06/2025 (Resolução BCB nº 482: CNPJ ativo há mais de 6 meses)", "url": "https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Forum_Pix_Plenaria/20252606-Forum_Pix.pdf"},
    {"titulo": "Agência Brasil — Bancos passam a oferecer Pix Automático a partir desta segunda (16/06/2025)", "url": "https://agenciabrasil.ebc.com.br/economia/noticia/2025-06/bancos-passam-oferecer-pix-automatico-partir-desta-segunda"},
    {"titulo": "Agência Brasil — Pix Automático torna-se obrigatório a partir desta segunda (13/10/2025)", "url": "https://agenciabrasil.ebc.com.br/economia/noticia/2025-10/pix-automatico-torna-se-obrigatorio-partir-desta-segunda"},
],
)


NOTA_MEI = guia(
slug="nota-fiscal-do-mei-barbeiro",
titulo="Nota fiscal do MEI barbeiro: quando é obrigatória e como emitir de graça",
resumo="Pro cliente pessoa física, o MEI não precisa emitir. Pra empresa, precisa, e só pelo emissor nacional. O que diz a Receita, o passo a passo pelo celular e o que guardar todo mês.",
publicadoEm="2026-10-27",
tags=["barbearia", "mei", "nota fiscal", "impostos", "guia"],
conteudo="""Um dia aparece o pedido: uma empresa quer contratar corte pros funcionários, um hotel quer um barbeiro pros hóspedes, uma produtora precisa de você num ensaio de fotos. E vem a pergunta: "você emite nota?". Se você é MEI, a resposta é sim, e dá pra fazer pelo celular, de graça, em poucos minutos.

### Quando o MEI é obrigado a emitir

A regra está no Perguntas e Respostas do MEI da Receita Federal (atualizado em abril de 2025, com base no art. 106 da Resolução CGSN nº 140): o MEI **fica dispensado de emitir nota pro consumidor pessoa física**, mas é obrigado quando quem contrata tem CNPJ.

Traduzindo pra barbearia: o cliente que senta na cadeira e paga o corte não exige nota. Se ele pedir, você pode emitir, mas não é obrigação. Já o serviço prestado pra uma empresa, seja ela um salão parceiro, uma academia que oferece corte aos alunos ou uma empresa que contrata um dia de barbearia pros funcionários, precisa de nota.

### Onde emitir: só no emissor nacional

Desde 1º de setembro de 2023, a nota de serviço do MEI (a NFS-e) é emitida exclusivamente no sistema nacional, segundo a Nota Técnica 2023.001 do Comitê Gestor da NFS-e. Não vale mais o site da prefeitura. Todo MEI do país já está habilitado, sem cadastro prévio e sem depender do município.

Existem três jeitos:

- **Emissor web**, gratuito, no Portal da NFS-e (nfse.gov.br/EmissorNacional);
- **Aplicativo NFS-e Mobile**, gratuito, na App Store e no Google Play;
- **Por sistema próprio (API)**, pra quem usa programa de emissão. Só esse caminho exige certificado digital.

### Como entrar

O jeito mais simples é com a conta gov.br do CPF do dono do MEI. O sistema reconhece sozinho que você é o responsável pelo CNPJ. A conta gov.br precisa ser nível **prata ou ouro**; se a sua for bronze, dá pra subir de nível no próprio app gov.br. A outra opção é criar usuário e senha no portal, que pede alguns dados de conferência, como o recibo do Imposto de Renda ou o título de eleitor.

O passo a passo fica no próprio Portal da NFS-e (gov.br/nfse), na área "MEI e demais empresas".

### O que mais o MEI precisa guardar

Emitir a nota não é a única tarefa. A Receita lista as obrigações do MEI, e duas delas andam junto com a nota:

**Relatório Mensal de Receitas Brutas.** Todo mês, anote quanto entrou. As notas que você emitiu e as notas do que comprou (produtos, pomada, lâmina) ficam guardadas junto. Não precisa mandar pra ninguém: é pra mostrar se o Fisco pedir.

**Compra sempre com nota.** Mesmo dispensado de emitir pro cliente pessoa física, o MEI tem que comprar mercadoria e serviço com documento fiscal. Guardar essas notas também te ajuda a saber quanto custa cada atendimento.

E uma vez por ano tem a declaração anual do MEI, a DASN-Simei.

### Por que vale a pena

A nota abre uma porta que muito barbeiro deixa fechada: o cliente empresa. Evento corporativo, dia do noivo com padrinhos pagando pela empresa, parceria com academia, convênio com empresa do bairro. Esse cliente paga em dia e volta, mas só contrata quem emite nota.

O limite de faturamento do MEI está mudando: explicamos em [MEI vai poder faturar mais](/revista/mei-vai-poder-faturar-mais-2027-2028). E pra organizar o resto da papelada, o curso [Abrir e organizar sua barbearia](/cursos/abrir-e-organizar-sua-barbearia) tem o caminho completo.

Dúvida sobre um caso específico, como cidade com regra própria de ISS, convênio ou valor alto: confirme com seu contador antes de fechar o serviço.""",
fontes=[
    {"titulo": "Receita Federal — Perguntas e Respostas MEI e Simei (atualizado em 29/04/2025)", "url": "https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/perguntaomei.pdf"},
    {"titulo": "NFS-e — Nota Técnica 2023.001: obrigatoriedade da NFS-e nacional para o MEI", "url": "https://www.gov.br/nfse/pt-br/nt-2023-001-obrigatoriedade-da-nfs-e-nacional-para-o-mei.pdf"},
    {"titulo": "Portal da NFS-e — MEI e demais empresas", "url": "https://www.gov.br/nfse/pt-br/mei-e-demais-empresas"},
],
)


PRECOS = guia(
slug="tabela-de-precos-da-barbearia-o-que-a-lei-pede",
titulo="Tabela de preços da barbearia: o que a lei pede e o desconto no Pix",
resumo="A lei manda o preço dos serviços ficar à vista, legível, enquanto a barbearia estiver aberta. E deixa cobrar diferente no Pix e no cartão, desde que o desconto esteja escrito. Como fazer a sua tabela.",
publicadoEm="2026-10-27",
tags=["barbearia", "preço", "consumidor", "lei", "guia"],
conteudo=""""Quanto tá o corte?" Se o cliente precisa perguntar, a barbearia já está em falta com a lei. Não é implicância: o direito de saber o preço antes de comprar é do Código de Defesa do Consumidor, e duas normas explicam como isso funciona na prática. A boa notícia é que cumprir custa uma folha bem feita, e ainda ajuda a vender.

### O que diz a lei

A Lei nº 10.962, de 2004, regula como os preços aparecem pro consumidor. Pra serviço, que não tem etiqueta, ela permite a **relação de preços**: uma lista escrita, clara e acessível. É a tabela na parede.

O Decreto nº 5.903, de 2006, detalha o resto. O preço precisa ser correto, claro, preciso, ostensivo e legível, e o decreto explica cada palavra: claro é entender na hora, sem abreviação e sem precisar fazer conta; legível é visível e que não apaga. Três regras do decreto valem ouro pra barbearia:

- os preços ficam **sempre visíveis enquanto o estabelecimento estiver aberto**;
- a lista fica com a frente virada pro cliente, pra ele ver sem precisar pedir;
- o preço é informado pelo **total à vista**. Se você parcela, informa também o total parcelado, o número e o valor das parcelas e os juros.

### O que é infração

O mesmo decreto lista o que não pode, e a lista parece feita pra placa de barbearia: letras de tamanhos diferentes que dificultam a leitura, cor da letra parecida com a do fundo, preço apagado ou rasurado, mostrar só o valor da parcela, dar dois preços diferentes pro mesmo serviço e escrever na vertical ou torto. Quem descumpre fica sujeito às sanções do Código de Defesa do Consumidor.

Aquele quadro de giz com "Corte ~~35~~ 40" escrito por cima, ou a placa preta com letra cinza-escura, é exatamente o que a regra quer evitar.

### Pode cobrar diferente no Pix e no cartão?

Pode. A Lei nº 13.455, de 2017, autoriza preço diferente conforme o prazo ou o meio de pagamento. Então "corte R$ 40, ou R$ 38 no Pix" é permitido. A mesma lei pôs uma condição na Lei 10.962: o desconto tem que estar informado **em local e formato visíveis**. Desconto que só existe se o cliente perguntar não vale.

### Como montar a sua tabela

1. **Um serviço por linha, com o preço total.** Corte, barba, sobrancelha, combos. Se o combo é mais barato que a soma, ele vende sozinho.
2. **Letra grande e do mesmo tamanho, com contraste forte**: preto no branco ou branco no preto.
3. **Diga o que está incluído** quando não for óbvio: "Corte + lavagem", "Barba com toalha quente".
4. **Desconto no Pix ou à vista, escrito na própria tabela.**
5. **Pendure onde o cliente vê antes de sentar**: na entrada ou no balcão. Atrás da cadeira, só o barbeiro enxerga.
6. **Preço novo, tabela nova.** Nada de riscar e escrever por cima.

E repita os mesmos preços onde o cliente marca horário. Preço diferente no site, no Instagram e na parede é o tipo de coisa que dá discussão no caixa. Se você ainda está decidindo quanto cobrar, o curso [Preço e lucro na barbearia](/cursos/preco-e-lucro-na-barbearia) ajuda a fechar a conta.

Uma tabela clara não serve só pro fiscal. O cliente que vê o preço do combo e da barba ali do lado é o cliente que pede mais um serviço.""",
fontes=[
    {"titulo": "Lei nº 10.962, de 11 de outubro de 2004 — texto atualizado na Câmara dos Deputados", "url": "https://www2.camara.leg.br/legin/fed/lei/2004/lei-10962-11-outubro-2004-534307-normaatualizada-pl.html"},
    {"titulo": "Decreto nº 5.903, de 20 de setembro de 2006 — texto atualizado na Câmara dos Deputados", "url": "https://www2.camara.leg.br/legin/fed/decret/2006/decreto-5903-20-setembro-2006-545543-normaatualizada-pe.pdf"},
    {"titulo": "Lei nº 13.455, de 26 de junho de 2017 — Câmara dos Deputados", "url": "https://www2.camara.leg.br/legin/fed/lei/2017/lei-13455-26-junho-2017-785093-publicacaooriginal-153193-pl.html"},
],
)


LGPD = guia(
slug="lgpd-na-barbearia-lista-de-clientes",
titulo="LGPD na barbearia: a lista de clientes no WhatsApp sem dor de cabeça",
resumo="Nome, telefone e aniversário do cliente são dados pessoais, e a lei vale pra barbearia pequena também, com regras mais leves pro MEI. O que pode, o que precisa de autorização e um roteiro simples.",
publicadoEm="2026-10-27",
tags=["barbearia", "lgpd", "whatsapp", "clientes", "guia"],
conteudo="""O caderno de clientes virou planilha, a planilha virou lista no WhatsApp, e hoje quase toda barbearia guarda nome, telefone, aniversário e até o corte preferido de centenas de pessoas. Isso tem nome na lei: são dados pessoais, e a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709, de 2018) vale pra barbearia de uma cadeira também. Não precisa de advogado pra ficar em dia: precisa de bom senso e de três ou quatro hábitos.

### A barbearia pequena tem regras mais leves

A Autoridade Nacional de Proteção de Dados (ANPD) fez um regulamento só pros agentes de pequeno porte: a Resolução CD/ANPD nº 2, de 2022. Ela cita o **microempreendedor individual pelo nome**, junto com microempresas e empresas de pequeno porte. Pra esse grupo:

- não é obrigatório nomear um "encarregado" de dados, mas é preciso ter **um canal pro cliente falar com você** sobre os dados dele, e o WhatsApp da barbearia serve;
- o registro do que você faz com os dados pode ser simplificado, e a ANPD fornece um modelo;
- a política de segurança pode ser simples, do tamanho da sua operação.

O alívio tem limite: as regras mais leves não valem pra quem faz tratamento de alto risco nem pra quem fatura acima do limite das empresas de pequeno porte. E o resto da LGPD continua valendo.

### O que a lei pede, em português de balcão

A lei tem princípios que cabem numa frase cada. **Finalidade**: você usa o dado pro que disse que ia usar. **Necessidade**: guarda só o que precisa. **Transparência**: o cliente sabe o que você guarda e pra quê.

E todo uso precisa de uma base legal. Duas interessam à barbearia. A primeira é a **execução de contrato**: pra marcar o horário, confirmar e avisar de atraso, você precisa do nome e do telefone, e isso faz parte do serviço que o cliente pediu. A segunda é o **consentimento**: pra mandar promoção, novidade e mensagem de aniversário, o caminho mais seguro é pedir autorização. A lei diz que o consentimento tem que ser pra uma finalidade determinada (autorização genérica é nula) e que pode ser retirado a qualquer momento, de graça e de forma fácil.

### O que o cliente pode pedir

Pela LGPD, o cliente pode a qualquer momento perguntar se você tem dados dele, ver quais são, corrigir o que está errado e pedir pra apagar o que foi guardado com o consentimento dele. Na prática: se ele mandar "me tira da lista", tire, e não volte a mandar.

### Roteiro de uma tarde

1. **Limpe a lista.** Apague o que não usa: CPF que você nunca precisou, endereço de quem não é atendido em casa, foto de documento.
2. **Separe quem autorizou promoção.** Na próxima visita, pergunte: "posso te mandar as novidades e promoções da barbearia no WhatsApp?". Anote quem disse sim.
3. **Ponha a saída em toda mensagem de divulgação**: "se não quiser mais receber, é só responder SAIR". E respeite.
4. **Use lista de transmissão, não grupo.** No grupo, todo mundo vê o número de todo mundo, e aí você expôs o dado do cliente pra centenas de desconhecidos.
5. **Cuide do celular da barbearia.** Senha na tela, e conta do WhatsApp só no aparelho da casa. Quando um funcionário sai, ele não leva a lista.
6. **Foto do cliente nas redes, só com autorização.** O rosto também é dado pessoal. Pergunte antes de postar o corte, e se ele preferir, poste de costas.

### Por que isso ajuda a vender

Cliente que recebe mensagem demais e não consegue sair bloqueia o número ou denuncia, e o WhatsApp pode restringir quem recebe muitas denúncias. Lista curta, de quem quer ouvir de você, dá mais resposta do que lista grande. O curso [Cliente que volta](/cursos/cliente-que-volta) mostra como fazer a mensagem certa pra essa lista.

Cuidar do dado do cliente é a mesma coisa que cuidar da toalha limpa: ninguém elogia, mas todo mundo repara quando falta.""",
fontes=[
    {"titulo": "Lei nº 13.709, de 14 de agosto de 2018 (LGPD) — texto atualizado na Câmara dos Deputados", "url": "https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html"},
    {"titulo": "ANPD — Resolução CD/ANPD nº 2, de 27 de janeiro de 2022 (agentes de tratamento de pequeno porte)", "url": "https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022"},
],
)


ARTIGOS = [GOOGLE, PARCEIRO, DIA, PIX_AUTOMATICO, NOTA_MEI, PRECOS, LGPD]
