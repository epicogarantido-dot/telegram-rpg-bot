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

## ⚠️ Conferir no seu plano (não deu pra verificar daqui)

A rede desta sessão não acessa o site da Square Cloud. Confirme na documentação/painel:

- **Seu plano permite site (subdomínio)?** Em alguns planos gratuitos só bots são permitidos.
  Se não permitir, alternativas sem custo: rodar o mesmo zip em qualquer máquina com Node 22+
  (`node iniciar.cjs`), ou os planos grátis de outras hospedagens Node.
- **Porta:** o `iniciar.cjs` usa a porta 80 (padrão de sites na Square Cloud). Se a doc pedir
  outra, defina `PORT` no `.env`.
- **Nome do arquivo de config:** usamos `squarecloud.config` (o formato que você já usava).
  Versões novas também aceitam `squarecloud.app` com os mesmos campos.
- **Memória:** 512 MB devem bastar pro site. O bot de WhatsApp é outro app (outro processo).

## Dados e backup

- O banco (agenda, assinaturas, leads) fica em `data/privado/` **no servidor**. Essa pasta não vai
  no zip, então um novo upload não deveria apagá-la — mas confirme como a Square Cloud trata
  arquivos antigos ao subir versão nova.
- **Antes de cada atualização, baixe o backup** em `/painel/backup` (arquivo `.db`).
- Pra restaurar: coloque o arquivo como `data/privado/agenda.db` e reinicie.
