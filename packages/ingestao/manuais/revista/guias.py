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


ARTIGOS = [GOOGLE, PARCEIRO, DIA]
