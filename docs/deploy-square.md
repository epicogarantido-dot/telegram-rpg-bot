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

Subdomínio e memória: `SQUARE_SUBDOMINIO=meusite SQUARE_MEMORIA=512 npm run pacote:square`.

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
