# Segurança

## Login dos alunos (WhatsApp + senha)

- **Prova do número sem SMS:** o site mostra um código; a pessoa o **envia** pro WhatsApp do bot.
  A mensagem chega do número dela, então só quem tem o WhatsApp consegue confirmar. O bot nunca
  manda mensagem primeiro (menos risco de banimento, zero custo).
- O código vale 15 minutos, é de uso único, e só o **navegador que pediu** conclui o fluxo
  (cookie `desafio_whatsapp` httpOnly; no banco fica só o hash).
- Código de outro número não confirma; o bot só repassa ao site com o segredo `BOT_SEGREDO`.
- Senhas com scrypt + sal. Senhas óbvias recusadas. Sessões: token aleatório no cookie
  httpOnly/SameSite=Lax/Secure, hash no banco, 30 dias.
- **Força bruta:** 5 senhas erradas por número em 15 min; 30 ações por IP em 15 min (inclui o
  login do admin). Mesma mensagem pra "número não existe" e "senha errada", e o tempo de resposta
  é igual (não dá pra descobrir quem tem conta).
- Trocar a senha exige confirmar pelo WhatsApp de novo e **derruba todas as sessões**.
- Cadastro nunca confirmado pode ser refeito: quem provar o número fica com ele.

## Site

- Cabeçalhos: CSP (só recursos do próprio site), `X-Frame-Options: DENY`, `nosniff`, HSTS,
  `Referrer-Policy`, `Permissions-Policy` sem câmera/microfone/localização.
- APIs que mudam dados checam a origem (CSRF); server actions do Next já checam.
- Conteúdo das lições é sanitizado antes de virar HTML.
- Fontes, ícones e 3D vêm do próprio site: nenhum dado do visitante vai pra terceiros.

## LGPD

- Consentimento explícito no cadastro (registrado com data).
- "Excluir minha conta" na área do aluno apaga conta, sessões e progresso.
- Quem responde SAIR ao bot é bloqueado pra sempre nos contatos de prospecção.
- Bancos em `data/privado/` (fora do git). Backup só com login de admin.

## Configuração obrigatória em produção

`PAINEL_SENHA` forte, `BOT_SEGREDO` (32+ caracteres aleatórios, mesmo valor no site e no bot),
`BOT_WHATSAPP`, `SITE_URL` com https.
