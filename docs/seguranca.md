# Segurança

## Login dos alunos (só WhatsApp, sem senha)

- **A pessoa escreve pro bot** ("Quero entrar no Aprenda Livre", "oi", "entrar"). A mensagem chega
  do número dela, então só quem tem aquele WhatsApp recebe a resposta. O bot nunca manda mensagem
  primeiro (menos risco de banimento, zero custo); o número vem do WhatsApp, não de formulário.
- O bot repassa número + nome do perfil ao site (`/api/whatsapp/entrada`, protegido por
  `BOT_SEGREDO`). O site cria a conta no primeiro contato e devolve um **link pessoal** `/e/<token>`.
- O link vale **uma vez** e por **24 horas**; pedir outro mata o anterior. No banco fica só o hash.
- **Prévia do WhatsApp não gasta o link:** a página `/e/<token>` só entra quando o navegador roda o
  JavaScript (ou a pessoa toca no botão). Quem só busca a página (robô de prévia) não envia nada.
  A página não manda Referer e não é indexada.
- Link já usado ou vencido → "Esse link venceu" com um botão pra pedir outro (mensagem fixa).
- **Força bruta:** token de 32 bytes aleatórios; 5 links por número em 15 min; 30 entradas por IP.
- Sessões: token aleatório no cookie httpOnly/SameSite=Lax/Secure, hash no banco, **180 dias**.
- **"Sair de todos os aparelhos"** na área do aluno derruba todas as sessões e o link pendente.
- O destino depois de entrar (`?voltar=`) só aceita caminho `/cursos/...` do próprio site.
- Plano B com o bot fora do ar: o admin gera o link em `/painel/alunos` e manda à mão, numa
  conversa que a pessoa começou.
- O painel das barbearias (que paga e tem dados de cliente) continua com e-mail + senha.

## Site

- Cabeçalhos: CSP (só recursos do próprio site), `X-Frame-Options: DENY`, `nosniff`, HSTS,
  `Referrer-Policy`, `Permissions-Policy` sem câmera/microfone/localização.
- APIs que mudam dados checam a origem (CSRF); server actions do Next já checam.
- Conteúdo das lições é sanitizado antes de virar HTML.
- Fontes, ícones e 3D vêm do próprio site: nenhum dado do visitante vai pra terceiros.

## LGPD

- A conta nasce quando a pessoa escreve pro bot pedindo pra entrar (data registrada). O bot só responde; convites e comunidade têm opt-in próprio.
- "Excluir minha conta" na área do aluno apaga conta, sessões e progresso.
- Quem responde SAIR ao bot é bloqueado pra sempre nos contatos de prospecção.
- Bancos em `data/privado/` (fora do git). Backup só com login de admin.

## Configuração obrigatória em produção

`PAINEL_SENHA` forte, `BOT_SEGREDO` (32+ caracteres aleatórios, mesmo valor no site e no bot),
`BOT_WHATSAPP`, `SITE_URL` com https.
