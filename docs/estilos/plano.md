# Plano dos 6 sites (temas)

Fonte da verdade pra implementar os temas do site das barbearias. Visual: `atlas.html`.

| Tema | Efeitos | Marca registrada do site |
|---|---|---|
| Extravagância | ●●●●● Máximo | Um título em letras douradas que acende como metal polido ao entrar, dentro de uma moldura ornamental que se desenha sozinha. |
| Luxo Silencioso | ●○○○○ Mínimo | Uma foto enorme de um corte perfeito, quase sem texto em volta. O espaço vazio é o luxo. |
| Luxo Técnico | ●●●○○ Médio | Uma faixa acolchoada (textura de costura de jaqueta) que acompanha a rolagem, com cartões macios por cima. |
| Potência | ●●●●○ Forte | Um título gigante e inclinado que entra rasgando a tela, com uma faixa de neon que corre por baixo, como linha de chegada. |
| Cerimônia | ●●○○○ Sutil | Um vídeo lento e escuro de detalhes (espuma, navalha, toalha), com uma única frase centralizada em letras finas e espaçadas. |
| Elegância Atemporal | ●●○○○ Sutil | Fotos em preto e branco que ganham cor quando o dedo passa por cima. |

## Lições de 15 barbearias reais (lista da Colorlib)

**Adotar em todos os temas**

- Agendar com um barbeiro específico, direto da foto dele na equipe (Abels on Queen). Nossa agenda já suporta.
- Foto do ambiente na abertura, não só de cortes: mostrar as cadeiras e o espaço gera confiança (Scissors & Scotch, Capelli's).
- Endereço, horário e telefone visíveis já na primeira tela (Balls Barbershop).
- Desconto na primeira visita, em faixa discreta (Boardroom).
- Vale-presente pra dar de presente (Scissors & Scotch, Crowsnest), pago com o Pix do próprio barbeiro.
- Plano mensal do cliente: X cortes por mês com preço fechado (Scissors & Scotch).
- Depoimentos dos próprios clientes ("The people have spoken"), escritos por eles, não copiados do Google.
- Equipe com nome, foto e especialidade ("The people behind the chair").
- Loja de produtos (pomada, óleo de barba) como etapa futura (Bruno's, Maverick, Shed).

**Evitar**

- Tela preta de carregamento antes do site aparecer (Tucson Barber ficou preto no teste): o site tem que aparecer na hora.
- Pop-up de cadastro tampando tudo logo na entrada (Barber Blades).
- Barra de aviso + aviso de cookies + menu tampando a foto principal ao mesmo tempo.
- Carrossel que troca sozinho na abertura: ninguém lê, e pesa.
- Botão de agendar escondido no menu: em todos os bons, ele está no topo e na abertura.

## Base comum

**Páginas**

- Início (cada tema muda a ordem e o clima das seções)
- Trabalhos: galeria completa com filtros (degradê, barba, infantil...)
- Serviços e preços
- Agendar: o fluxo que já existe (/b/nome-da-barbearia), vestido com o tema
- Sobre e contato: equipe, endereço, horário, link pro mapa e pro Instagram

**Em todos os temas**

- Botão "Agendar" fixo no rodapé do celular, em todos os temas
- Botão de WhatsApp da barbearia
- Ficha pro Google (dados estruturados de barbearia: nome, endereço, horário, preços) pra aparecer melhor nas buscas da cidade
- Imagem de compartilhamento bonita quando o link vai pro WhatsApp
- Fotos enviadas pelo barbeiro, otimizadas automaticamente

**Regras dos efeitos**

- Todo tema respeita o "reduzir movimento" do celular: o nível de efeitos cai pra 1
- Efeito nunca esconde conteúdo: a página está completa mesmo parada
- Teto de peso por tema e página carregando em menos de 2,5 s no 4G
- Tudo grátis: fontes embutidas, efeitos em CSS ou componentes gratuitos (React Bits, Uiverse)

**Ordem de construção**

1. Base do site 2: estrutura das páginas, upload de fotos e o motor de temas
2. Luxo Silencioso primeiro: o mais simples, valida a estrutura
3. Potência: o primeiro tema com bastante efeito
4. Extravagância: o mais pesado, testa o teto de efeitos
5. Elegância Atemporal, Cerimônia e Luxo Técnico, reaproveitando o que já existe

## Extravagância — efeitos 5/5 (Máximo)

**Movimento:** Muito e com brilho. Pode tudo, desde que seja dourado e teatral: entradas de palco, reflexos, partículas. Mesmo aqui, uma coisa por vez na tela.

**Marca registrada do site:** Um título em letras douradas que acende como metal polido ao entrar, dentro de uma moldura ornamental que se desenha sozinha.

**Pra quem:** Barbearia clássica premium: barba com toalha quente, cliente que gosta de ser tratado como rei.

**Quem já faz algo assim:** Crowsnest (dourado, estrelas e selo vintage), Gentlemen Barber Clubs (logo dourado sobre foto, parallax na abertura), Abels on Queen (letra cursiva com ornamentos finos).

**Página inicial, de cima pra baixo**

1. Abertura com moldura ornamental e título com reflexo dourado
2. Faixa de serviços em cartões com borda dourada e preço em destaque
3. Galeria dos trabalhos em mosaico com moldura em cada foto
4. O barbeiro: retrato grande com citação em itálico
5. Horários e endereço em placa ornamental
6. Chamada final: "Reserve sua cadeira"

**Efeitos**

- Brilho que atravessa o título (tipo Shiny Text do React Bits, ou gradiente animado em CSS)
- Moldura que se desenha ao rolar (linha SVG animada pela rolagem)
- Partículas douradas bem suaves no fundo da abertura (canvas leve, pausa fora da tela)
- Fotos da galeria entram com zoom lento e brilho na borda
- Botão com borda de luz girando (tipo Star Border)
- Parallax forte entre moldura, fundo e texto

**Fotos:** Fundo escuro, luz quente de lado, detalhes dourados (tesoura, navalha, frascos). Preto e dourado combinam com qualquer corte.

**Tom:** Solene e generoso. Ex.: "A arte da navalha, desde 1998" · botão "Reservar minha cadeira"

**Agendamento:** Etapas como cartões com borda dourada; horário escolhido acende em ouro.

**Evitar:** Ouro amarelado demais (fica brega), letra decorativa no texto corrido, efeitos brigando entre si.

**Peso:** Até ~120 KB de JavaScript de efeitos; partículas desligam no celular fraco e com "reduzir movimento".

## Luxo Silencioso — efeitos 1/5 (Mínimo)

**Movimento:** Quase nenhum. Só o que responde a um toque: trocar foto, abrir menu. Nada se move sozinho.

**Marca registrada do site:** Uma foto enorme de um corte perfeito, quase sem texto em volta. O espaço vazio é o luxo.

**Pra quem:** Barbearia de bairro nobre, uma ou duas cadeiras, cliente que não quer barulho.

**Quem já faz algo assim:** Bruno's Barbers: fundo branco, título grande em serifa ("Redefining the everyday standard."), quase nenhum enfeite.

**Página inicial, de cima pra baixo**

1. Uma foto em tela cheia, nome pequeno no canto
2. Uma frase curta e o botão "Agendar"
3. Grade editorial assimétrica de trabalhos (uma grande, duas pequenas)
4. Serviços em lista simples: nome, tempo, preço, alinhados
5. Endereço e horário em duas linhas

**Efeitos**

- Troca de foto em corte seco, sem deslizar
- Sublinhado fino que cresce ao passar o dedo nos links
- Fotos carregam com esmaecimento de 200 ms, e só isso

**Fotos:** Fundo claro e liso, luz natural e difusa, enquadramento centrado. Poucas fotos, todas excelentes.

**Tom:** Mínimo e seguro. Ex.: "Corte preciso. Nada além." · botão "Agendar"

**Agendamento:** Lista limpa, sem cartões; o horário escolhido fica sublinhado em preto.

**Evitar:** Ícones, emojis, cores extras, banner, carrossel automático. Qualquer enfeite quebra o clima.

**Peso:** Praticamente zero JavaScript de efeito: é o site mais rápido dos seis.

## Luxo Técnico — efeitos 3/5 (Médio)

**Movimento:** Médio e macio. Tudo desliza devagar, como neve caindo; nada pula nem pisca.

**Marca registrada do site:** Uma faixa acolchoada (textura de costura de jaqueta) que acompanha a rolagem, com cartões macios por cima.

**Pra quem:** Barbearia moderna e confortável: público jovem, famílias, ambiente climatizado com café.

**Quem já faz algo assim:** Boardroom Salon (a "experiência" explicada em etapas com ícones, desconto na primeira visita) e Scissors & Scotch (planos mensais e vale-presente).

**Página inicial, de cima pra baixo**

1. Abertura clara com título leve e botão em pílula
2. Cartões de serviço arredondados com ícones finos
3. Galeria em carrossel arrastável com cantos bem arredondados
4. "Por que aqui": conforto, café, Wi-Fi, estacionamento
5. Horários em blocos arredondados
6. Chamada final sobre fundo azul-marinho

**Efeitos**

- Parallax suave na textura acolchoada
- Cartões que afundam de leve ao tocar, como almofada
- Neve muito sutil na abertura, só no inverno (opcional)
- Contadores que sobem: anos de casa, cortes feitos (tipo Count Up)

**Fotos:** Ambiente claro, tons frios, gente sorrindo. Bom pra mostrar o espaço e o conforto, não só o corte.

**Tom:** Acolhedor e prático. Ex.: "Frio lá fora. Corte em dia." · botão "Marcar horário"

**Agendamento:** Etapas em pílulas arredondadas; calendário macio com dias em círculos.

**Evitar:** Cantos retos, preto puro, letras pesadas: deixam o site duro.

**Peso:** Até ~60 KB de efeitos; quase tudo em CSS.

## Potência — efeitos 4/5 (Forte)

**Movimento:** Muito, rápido e direto. Entradas velozes, texto que corre de lado, tudo com sensação de arrancada. Sem brilho delicado.

**Marca registrada do site:** Um título gigante e inclinado que entra rasgando a tela, com uma faixa de neon que corre por baixo, como linha de chegada.

**Pra quem:** Barbearia de degradê, freestyle e pigmentação: público jovem, ligado em futebol, carro e música.

**Quem já faz algo assim:** Shed Barber e FreshCut: nome gigante por cima de fotos divididas ao meio, vermelho forte. Balls Barbershop: escuro com detalhe amarelo.

**Página inicial, de cima pra baixo**

1. Abertura escura com vídeo curto de corte em câmera lenta e título gigante
2. Faixa de texto correndo: "DEGRADÊ · NAVALHADO · FREESTYLE"
3. Galeria com cantos cortados em ângulo, efeito antes e depois
4. Serviços como "ficha de corrida" (tempo e preço em números grandes)
5. Equipe em cartões com foto em preto e branco que ganha cor ao tocar
6. Chamada final com botão neon

**Efeitos**

- Título que entra letra por letra, rápido (tipo Split Text)
- Faixa de texto infinita que acelera com a rolagem (tipo Scroll Velocity)
- Antes e depois arrastável nas fotos
- Botão neon que puxa levemente pro dedo (tipo Magnet)
- Faíscas ao tocar no botão de agendar (tipo Click Spark)

**Fotos:** Fundo escuro, luz forte e dura de lado, close no acabamento do degradê. Vídeos curtos verticais funcionam muito bem.

**Tom:** Direto e cheio de energia. Ex.: "Degradê em alta velocidade" · botão "Agendar já"

**Agendamento:** Tudo em blocos com canto cortado; horário escolhido acende em neon.

**Evitar:** Serifas, tons pastel, animação lenta: tiram a força.

**Peso:** Até ~100 KB de efeitos; vídeo da abertura curto, sem som e leve (menos de 2 MB).

## Cerimônia — efeitos 2/5 (Sutil)

**Movimento:** Pouco e lento. O movimento é do vídeo; o resto da página fica parado e calmo.

**Marca registrada do site:** Um vídeo lento e escuro de detalhes (espuma, navalha, toalha), com uma única frase centralizada em letras finas e espaçadas.

**Pra quem:** Barbearia exclusiva, atendimento só com hora marcada, preço alto, uma hora inteira por cliente.

**Quem já faz algo assim:** Abels on Queen (escuro, centralizado, letras espaçadas, "Agendar com o Mitch") e Capelli's (cadeira de couro na penumbra, "barbearia sob medida").

**Página inicial, de cima pra baixo**

1. Vídeo em tela cheia com uma frase e o botão branco em pílula
2. "A experiência": as etapas do atendimento, em texto curto
3. Galeria em tela cheia, uma foto por vez
4. O mestre barbeiro: retrato e trajetória
5. Convite final: "Atendimento sob reserva"

**Efeitos**

- Vídeo de fundo lento, sem cortes bruscos
- Texto que surge desfocando devagar (tipo Blur Text), só na abertura
- Passagem lenta entre fotos da galeria

**Fotos:** Pouca luz, contraste alto, closes de mãos e ferramentas. Nada de fotos de grupo ou de salão cheio.

**Tom:** Calmo e cerimonioso. Ex.: "Uma hora inteira, só sua" · botão "Reservar"

**Agendamento:** Poucos horários por dia, mostrados com destaque, como convite.

**Evitar:** Preço em destaque, promoções, cores vivas, muitas fotos juntas.

**Peso:** Efeitos quase todos em CSS; o peso está no vídeo (versão leve no celular).

## Elegância Atemporal — efeitos 2/5 (Sutil)

**Movimento:** Pouco e preciso. Só transições que revelam algo: a cor da foto, o bloco seguinte.

**Marca registrada do site:** Fotos em preto e branco que ganham cor quando o dedo passa por cima.

**Pra quem:** Barbearia clássica e atemporal: noivos, terno e gravata, eventos, cliente de muitos anos.

**Quem já faz algo assim:** New York Barbershop (foto em preto e branco, serifa grande: "Real Cuts. Real People.") e Maverick (preto e branco com itálico).

**Página inicial, de cima pra baixo**

1. Abertura em bloco preto sólido com título em serifa clássica
2. Alternância de blocos preto e branco: serviços, galeria, história
3. Galeria em preto e branco que ganha cor ao tocar
4. "Dia do noivo": pacote especial em destaque
5. Endereço e horário em tipografia clássica

**Efeitos**

- Foto de preto e branco pra cor ao tocar ou passar o mouse
- Linha fina que se desenha entre as seções
- Troca de blocos preto e branco marcada pela rolagem, sem animar o texto

**Fotos:** Em preto e branco de verdade, com bom contraste; retratos e detalhes de terno, gravata e barba.

**Tom:** Clássico e seguro. Ex.: "O clássico nunca sai de moda" · botão "Agendar"

**Agendamento:** Fundo branco, letras pretas, horário escolhido vira bloco preto.

**Evitar:** Qualquer terceira cor, cantos arredondados, emojis.

**Peso:** Quase sem JavaScript; o efeito da cor é CSS puro.
