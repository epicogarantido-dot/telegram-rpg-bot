# Bot de WhatsApp (Baileys)

O bot usa o [Baileys](https://github.com/WhiskeySockets/Baileys), que fala o
protocolo do WhatsApp Web. **Não é a API oficial.**

## Riscos — leia antes de ligar

- Viola os Termos de Serviço do WhatsApp. O número pode ser **banido sem aviso**,
  e o banimento costuma ser permanente.
- Use um **chip dedicado** só pro bot. Nunca o seu número pessoal ou o da empresa.
- A pasta `apps/bot/auth/` é a sessão logada do número: quem tiver ela controla o
  WhatsApp. Está no `.gitignore`; nunca commite, nunca compartilhe.
- O bot foi feito pra **só responder** quem escreve pra ele, com limite por conversa
  (`Limitador`). Disparo em massa / mensagem não solicitada é spam, é o caminho
  mais rápido pro banimento e não vamos implementar.

## Rodar

```bash
cp .env.example .env     # ajuste SITE_URL
npm install
npm run bot              # mostra um QR: WhatsApp > Aparelhos conectados > Conectar
# ou, sem QR: BOT_NUMERO=5511999999999 npm run bot  (gera código de pareamento)
```

Precisa rodar num processo que fique ligado (VPS, Railway, Fly.io, Square Cloud…).
Vercel/Cloudflare **não** servem pro bot: são serverless e derrubam a conexão.

## Migrar pra API oficial depois

Toda a lógica está em `src/responder.ts` (texto entra, texto sai). Pra trocar pela
WhatsApp Cloud API oficial, só o transporte (`src/index.ts`) muda: um webhook que
recebe a mensagem, chama `responder()` e devolve via Graph API.
