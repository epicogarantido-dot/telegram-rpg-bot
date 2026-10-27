# Publicar na Square Cloud

```bash
npm run pacote:square          # gera dist/aprenda-livre-square.zip
```

O zip já vem com o build pronto (Next "standalone"): a Square Cloud não precisa
rodar `npm install` nem `build`.

## Passo a passo

1. Gere o zip (ou peça ao Claude: ele gera e te manda o arquivo).
2. Dentro do zip, crie um arquivo `.env` a partir do `.env.example` com no mínimo:
   - `PAINEL_SENHA` — senha do admin (`/painel` e `/painel/assinaturas`)
   - `PIX_CHAVE`, `PIX_NOME`, `PIX_CIDADE` — onde você recebe as assinaturas
   - `ADMIN_WHATSAPP` — seu número, pra receber comprovantes
   - `SITE_URL` — ex.: `https://aprendalivre.squareweb.app`
   Se o painel da Square Cloud tiver "variáveis de ambiente", pode colocar lá em vez do `.env`.
3. Em squarecloud.app → Upload, envie o zip.
4. Acesse `/painel` com a senha.

## Atualizar um site que já está no ar (commit)

Use `dist/aprenda-livre-site-commit.zip` (o mesmo conteúdo, sem `squarecloud.config`: o app já
tem o dele, com o subdomínio dele). Depois de reiniciar, abra `/api/versao` no seu endereço: tem
que mostrar o mesmo código e horário que o `npm run pacote:square` imprimiu. Se mostrar o antigo,
o commit não entrou ou o app não reiniciou.


Use o mesmo zip como **commit** no app que já existe (painel do app → Commit, ou
`squarecloud commit <ID> --restart` no CLI). O commit descompacta o zip por cima dos
arquivos do app e **mantém** o resto: `data/privado/` (bancos e fotos) e o `.env` não
estão no zip, então continuam como estavam. O commit **não reinicia** o app sozinho:
reinicie depois. Não use "Upload" pra atualizar (cria um app novo, com outro ID e sem os dados).
Antes, baixe o backup em `/painel/backup`.

Subdomínio e memória: `SQUARE_SUBDOMINIO=meusite SQUARE_MEMORIA=512 npm run pacote:square`.

### Armadilha: página velha depois do commit

O Next 16 guarda as páginas que gera em `apps/site/.next/server/route-cache/`, pasta criada
pelo próprio servidor. Ela não vem no zip, o commit não apaga, e a chave é só o endereço
(sem a versão do build): home e Revista ficaram presas no primeiro deploy enquanto o resto
do site atualizava. O `iniciar.cjs` apaga essa pasta a cada início, e as páginas estáticas
têm `revalidate` de 10 min. Se algo parecer velho: confira `/api/versao` e reinicie.

## Sem bot (desde 27/10/2026)

O site não tem mais bot de WhatsApp nem login de aluno. Se o app ainda tinha `BOT_NUMERO`,
`BOT_WHATSAPP` e `BOT_SEGREDO` nas variáveis, pode apagar; e no celular do chip, em Aparelhos
conectados, desconecte o aparelho do bot. A pasta `data/privado/whatsapp/` pode ser apagada.

## O que a documentação da Square Cloud confirma (lida em 25/10/2026)

- **Não existe plano grátis.** O mais barato é o Hobby, a partir de R$ 12,49/mês (1 GB de RAM).
  Site exige no mínimo 512 MB, então o Hobby de 1 GB comporta o site + o bot (256 MB).
- Config: `squarecloud.app` ou `squarecloud.config`, ambos valem; tem que estar na raiz do zip.
- Site escuta na porta 80 em `0.0.0.0` (a Square Cloud já define `PORT`/`HOST`; o `iniciar.cjs` respeita).
- `package.json` na raiz é obrigatório; o `node_modules` da raiz é descartado e o servidor roda
  `npm install`. Por isso o pacote leva as dependências em `apps/node_modules` e um `package.json`
  vazio na raiz: nada é baixado e o site sobe direto.
- Node.js `recommended` = 24.x (tem o `node:sqlite` que o banco usa).
- O plano inclui o subdomínio `*.squareweb.app` e HTTPS.

**Custo zero de verdade** (alternativa à Square Cloud): rodar o mesmo zip num PC ou celular Android
antigo ligado em casa (`node iniciar.cjs`) e expor com um túnel gratuito da Cloudflare. Funciona,
mas depende da máquina e da internet de casa ficarem ligadas.

## Dados e backup

- O banco (agenda, assinaturas, leads) fica em `data/privado/` **no servidor**. Essa pasta não vai
  no zip, então um novo upload não deveria apagá-la — mas confirme como a Square Cloud trata
  arquivos antigos ao subir versão nova.
- **Antes de cada atualização, baixe o backup** em `/painel/backup` (arquivo `.db`).
- Pra restaurar: coloque o arquivo como `data/privado/agenda.db` e reinicie.


## Dois apps: site de leads e site das barbearias (27/10/2026)

`npm run pacote:square` gera quatro zips do mesmo build:

| Zip | Pra quê |
|---|---|
| `dist/leads-commit.zip` | atualizar o app de leads que já existe (Commit e reiniciar) |
| `dist/leads-square.zip` | criar o app de leads do zero (Upload; traz `squarecloud.config`) |
| `dist/saas-square.zip` | criar o app das barbearias (Upload) |
| `dist/saas-commit.zip` | atualizar o app das barbearias depois |

`.env` de cada um (modelo pronto do SaaS: `.env.saas.example`):

- **Leads:** `SAAS_URL=https://<app-saas>.squareweb.app`, `SITE_URL` (o próprio), `PAINEL_SENHA`, `COMUNIDADE_LINK`, `REMETENTE`. Sem `SAAS_URL`, ele serve tudo sozinho (como um app só).
- **SaaS:** `LEADS_URL=https://<app-leads>.squareweb.app`, `SITE_URL` (o próprio), a **mesma** `PAINEL_SENHA`, `PIX_*`, `ADMIN_WHATSAPP`, `PLANO_*` e, se quiser, `SITE_INICIAL` (o estilo do site de exemplo que abre no endereço principal; padrão `cerimonia`).

O banco da agenda (barbearias, pagamentos, fotos) mora no app SaaS; o de leads (prospecção, contagem por origem) no app de leads. Backup da agenda: `/painel/backup` no SaaS.
