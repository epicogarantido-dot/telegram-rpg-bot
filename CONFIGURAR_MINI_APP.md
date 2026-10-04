# Como ativar o Mini App

O código já está pronto no zip, mas tem passos manuais que só você consegue
fazer (são configurações no painel do Telegram e da hospedagem, não dá pra
automatizar daqui).

## 1. Subir o zip normalmente na hospedagem

Nada muda no processo de sempre. Só adicione, se ainda não tiver, essa
variável de ambiente no painel (Environment):

- `WEBAPP_URL` — vazio por enquanto, você preenche no passo 3. **Enquanto
  estiver vazia, o botão "🕹️ Abrir Mini App" simplesmente não aparece no
  menu** — o bot funciona normal, só sem esse botão.
- Confirme que a porta que o servidor web escuta (variável `WEBAPP_PORT`,
  padrão 8080) é a mesma que a hospedagem expõe publicamente.

⚠️ **Importante**: como esse app agora faz duas coisas ao mesmo tempo (bot +
site), pode ser que a hospedagem precise que você marque o app como
"aplicação com HTTP" ou similar no painel — se der erro de porta/conexão
recusada, vale abrir um chamado com o suporte perguntando como expor uma
porta HTTP num app Python.

## 2. Pegar a URL pública do seu app

Depois que a hospedagem subir o app, ela vai te dar um endereço público
(algo como `https://seu-app.suahospedagem.app`). Copia esse link.

## 3. Duas configurações no @BotFather

Fala com **@BotFather** no Telegram:

1. `/mybots` → escolhe seu bot → **Bot Settings** → **Menu Button** →
   manda a URL que você copiou no passo 2. Isso faz aparecer um botão fixo
   de "abrir app" ao lado da caixa de digitar, sempre visível.
2. Ainda em **Bot Settings**, procura por **Configure Mini App** (ou
   **Web App**, dependendo da versão do BotFather) e registra a mesma URL
   como domínio autorizado do Mini App — o Telegram só deixa abrir Mini Apps
   de domínios que o bot autorizou explicitamente.

Depois disso, volta na hospedagem e preenche a variável `WEBAPP_URL` com
essa mesma URL, e reinicia o app. Agora o botão "🕹️ Abrir Mini App" vai
aparecer no topo do menu principal do bot.

## ⚠️ Restrição do próprio Telegram

Botões de Mini App **só funcionam em conversa privada** com o bot — não
funcionam se o bot estiver adicionado num grupo. Isso é uma regra do
Telegram, não do código.

## O que o Mini App já cobre nessa primeira versão (Fase 1)

- ✅ Ver ficha de personagem: status, atributos, equipamentos, esquadrão
  de espíritos — tudo com os valores reais, ao vivo do banco de dados.

## O que ainda só existe no bot (por enquanto)

Torre, Explorar, Raid, Arena, Arena dos Pets, Loja, Forja, Templo de
Evocação, Estábulo, Mercado, Missões, Skills, Inventário — todo o resto
do jogo. O botão de Mini App e o bot continuam funcionando lado a lado —
pra tudo que não está na lista acima, o jogador ainda usa o bot no chat
normalmente. Cada tela nova migra pro Mini App em fases futuras.

## Testando localmente antes de subir (opcional)

Se quiser testar sem depender da hospedagem:
```
pip install -r requirements.txt
python main.py
```
O bot sobe normal e o Mini App fica escutando na porta 8080 — mas pra abrir
de dentro do Telegram de verdade, o Telegram exige HTTPS público, então
testar 100% só dá depois de estar hospedado.
