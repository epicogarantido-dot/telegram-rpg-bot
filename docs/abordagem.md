# Abordagem do primeiro contato (aprovada e implementada no painel)

Objetivo da primeira conversa: **ganhar uma resposta**, não vender. Quem responde vira conversa;
quem não responde conta contra o seu número no WhatsApp (o WhatsApp está limitando mensagens
pra quem nunca responde) e cada "bloquear/denunciar" pesa. Então: pouca mensagem, muito
personalizada, pergunta fácil de responder, link só depois que a pessoa responder.

## Quem manda e de onde

- **Uma pessoa**, do **WhatsApp Business dela**. Foto de rosto, nome "Fulano · Aprenda Livre",
  descrição curta. Não tem bot: o primeiro contato e a conversa são sempre de gente.
- Um a um, abrindo pelo painel (`/painel`), que já respeita o limite diário e esconde quem pediu SAIR.
- Ritmo: **10 por dia na primeira semana**, depois 15-20. Nunca disparo em massa.
- Horário sugerido: terça a sexta, **9h30-11h** ou **14h-16h** (fora do pico; sábado é o dia
  mais cheio da barbearia e muitas fecham segunda).

## A sequência

**1ª mensagem (sem link):** quem é, por que ESTA barbearia, uma pergunta fácil, e como sair.

> Oi, tudo bem? Aqui é o {seu nome}, do Aprenda Livre. Vi a {Barbearia} {no Instagram / no Google}
> e gostei {do trabalho de degradê / do espaço}. Pergunta rápida: hoje vocês marcam horário pelo
> WhatsApp ou é por ordem de chegada?
>
> (Se preferir não receber mensagem, responde SAIR que eu não mando mais.)

**Se responder**, a 2ª mensagem traz o valor, ainda sem vender:

- *"Pelo WhatsApp"* → "Muita gente perde cliente por não conseguir responder no meio do corte.
  Montei um exemplo de como ficaria um site com agenda pra {Barbearia}: o cliente vê os cortes,
  escolhe o horário e marca sozinho. Quer que eu te mande o link pra ver?"
- *"Ordem de chegada"* → "Tem um jeito de mostrar a fila no celular do cliente, pra ele saber
  se vale ir agora. Quer ver como ficaria pra {Barbearia}?"

**Se disser sim:** manda o link da **demonstração com o nome da barbearia dele** (um dos 6
estilos, fotos de exemplo, marcado como demonstração). É o "uau" da conversa. Depois: "Se
quiser colocar no ar com as suas fotos, leva 5 minutos" → `/barbeiros`.

**Presente, em qualquer momento:** os cursos grátis (preço, cliente que volta, dinheiro em
ordem). "Tem uns cursos grátis pra barbearia, é aberto, sem cadastro: {site}/cursos". Os cursos
estão abertos e cada lição termina mostrando o site da barbearia: o site se vende sozinho.

**Sem resposta:** **um** lembrete curto depois de 3-4 dias ("Oi, {nome}! Só pra não sumir: quer
ver o exemplo do site da {Barbearia}?"). Sem resposta de novo: para. Lead fica marcado e não
volta pra fila.

## Personalização (o que faz responder)

Antes de mandar, 1 minuto no Instagram/Google da barbearia (o painel já traz o @ quando houver):
um detalhe real (um corte, o espaço, tempo de casa pela data de abertura da Receita, "vi que
abriram em 2019"). Nada de elogio genérico. Se não achar nada, só o nome e a cidade.

## Outros canais (bons em cidade pequena como Alegrete)

- **Direct do Instagram** (de um perfil do Aprenda Livre com posts da Revista): mesma sequência,
  comentando um post real primeiro. Barbeiro vive no Instagram.
- **Ir na barbearia**: em cidade de ~70 mil habitantes, 4-5 visitas por dia com um cartão com
  QR code do site ("cursos grátis pra barbeiro") convertem mais do que qualquer mensagem.

## Como fica no painel (`/painel`)

Cada cartão de lead mostra só o próximo passo da etapa em que ele está. Os botões abrem o
WhatsApp de quem está usando o painel com o texto pronto (`packages/prospeccao/src/mensagem.ts`)
e já avançam a etapa; quem aperta "enviar" no WhatsApp é a pessoa.

| Etapa | O que aparece |
|---|---|
| Novo | "Onde você viu" + "um detalhe real" → **Abrir 1ª mensagem** (conta no limite do dia) |
| 1ª mensagem enviada | "Lembrete em N dias"; no 3º dia, **Mandar lembrete**; "Respondeu: marca pelo WhatsApp / ordem de chegada" (2ª mensagem) |
| Lembrete enviado | 4 dias sem resposta → **Encerrar: sem resposta** (não volta pra fila) |
| Respondeu | **Criar demonstração** (escolhe o estilo) → **Mandar demonstração** |
| Demonstração enviada | Ver demonstração, mandar o link de novo, **Virou cliente** |
| Qualquer etapa da conversa | **Presente: cursos grátis** (link do site) e **Pediu SAIR** (bloqueio permanente) |

No alto do painel: quantos lembretes e encerramentos vencem hoje, com filtro só pra eles.

**Demonstração** (`criarDemonstracao` em `packages/agenda`): site em `/b/<slug>` com o nome da
barbearia, o estilo escolhido e as fotos de exemplo de `data/demo-fotos/` (Unsplash). Aviso de
demonstração no topo, fora do Google (noindex), sem telefone, marcação desligada, some em 14 dias.
O link mandado leva `?convite=…`: só quem tem o convite vê **Quero este site**, que abre o
cadastro já com o nome e transforma a demonstração no site dele (`assumirDemonstracao`: mesmo
endereço e estilo; acesso liberado só depois do Pix confirmado, como qualquer conta).

**Cartão pra visitas** (`/painel/cartao`): folha A4 com 10 cartões de 9 × 5 cm e QR code que abre o
site (`SITE_URL/?origem=cartao`).
Quem assina as mensagens: `REMETENTE` no `.env` ("João, do Aprenda Livre").

## O funil (27/10/2026)

Primeiro contato manual (acima) → convite pro **grupo** de barbeiros → no grupo saem matérias e
cursos do site → no site, tudo aberto e sem cadastro, e todo caminho termina no site da barbearia
(menu "Quero meu site", carrossel dos estilos na página inicial, propaganda no fim de cada lição e
matéria) → `/barbeiros` → `/app/cadastro`. Não tem bot nem login de aluno.

**Site + grupo** (botão no cartão do lead, só depois que ele respondeu): uma mensagem com o link do
site (`?origem=convite`) e o convite do grupo (`COMUNIDADE_LINK`). Nunca na 1ª mensagem: link pra
quem não conversou com você é o que o WhatsApp mais trata como spam. No grupo, use os posts prontos
de `/painel/divulgacao`, um por dia, e veja lá quais trouxeram visita e cadastro.

## Depois do "Quero meu site" (28/10/2026)

No site de leads o barbeiro só vê os exemplos e compra: cadastro (sem escolher estilo nem nada) e
Pix com comprovante, e vê "Pedido recebido!". Em `/painel/assinaturas` **do leads** você confere o
Pix e confirma: a assinatura fica salva com o prazo (quando acaba, aparece "atrasada"; nada é
bloqueado). Aí você chama no WhatsApp, pega fotos, serviços, preços e horários e cria o site no
**SaaS** ("Criar site de cliente": já no ar por 30 dias), que abre o seu WhatsApp com o link e a
senha do painel. Ele arruma o resto pelo painel. Recebeu a mensalidade? No SaaS, "+30 dias".

## Posicionamento: o site completa o WhatsApp (28/10/2026)

A Meta está vendendo o WhatsApp Business pro mesmo barbeiro (atendente de IA, anúncios que abrem
conversa, listas de transmissão). Não brigue com isso: **o WhatsApp conversa, o site agenda**. O
barbeiro continua no WhatsApp dele; o site faz o que conversa nenhuma faz bem, e os dois juntos
deixam a barbearia completa.

O que cada um faz (é o que está em `/barbeiros`, seção "Com o seu WhatsApp, a barbearia fica completa"):

| WhatsApp | O site completa |
|---|---|
| Conversa com quem já é cliente | Aparece no Google, com mapa e horário, pra quem ainda não te conhece |
| Responde quando dá, entre um corte e outro | Agenda sozinho, 24 h, só em horário livre, sem marcar dois no mesmo horário |
| Manda foto solta | Vitrine: antes e depois, cortes com foto e preço, equipe |
| — | Lembrete no celular do cliente e link pra remarcar ou cancelar sem te chamar |

Como um liga no outro: no painel, **WhatsApp** (`/app/whatsapp`) tem a **mensagem de saudação**
pronta, com o passo a passo: é a resposta automática do próprio WhatsApp Business (grátis, sem robô):
quem chama recebe UMA mensagem com o link pra ver os horários e agendar; se a conversa continua,
não repete (só volta depois de 14 dias sem conversa). Também tem a resposta rápida "/agendar" e o
link do perfil. Não é integração por API: nada sai sozinho do sistema.

### Respostas prontas

- **"Já tenho o WhatsApp Business."** — Ótimo, ele continua. O WhatsApp é pra conversar; o site é
  pra você parar de conversar pra marcar horário. No painel tem a mensagem de saudação pronta com o
  seu link: quem te chamar já recebe onde marcar.
- **"Já uso a IA do WhatsApp pra responder."** — A IA conversa, mas não sabe os seus horários
  livres de verdade; o site sabe. Com o link na saudação, o cliente recebe na hora onde marcar, e
  quem marca é a agenda, sem conflito.
- **"Meu cliente marca pelo WhatsApp mesmo."** — Quantas vezes por dia você para um corte pra
  responder "tem horário amanhã?"? Com o link na saudação, ele escolhe sozinho e você só recebe o
  aviso no celular.
- **"Vou fazer anúncio que abre conversa no WhatsApp."** — Pode fazer: quem chegar pelo anúncio
  recebe a saudação com o link e marca em um minuto. O site deixa o anúncio render mais, porque a
  conversa termina em horário marcado.

Custos de referência (pra não ser pego de surpresa, out/2026, fontes de terceiros): o app WhatsApp
Business é grátis; o atendente de IA é grátis até um limite mensal não divulgado, com planos pagos
anunciados; mensagem automática pela API oficial custa por mensagem (cerca de R$ 0,035 lembrete,
R$ 0,32 marketing) e exige conta da Meta com cartão. O nosso sistema não usa a API: quem manda é o
barbeiro, do WhatsApp dele.
