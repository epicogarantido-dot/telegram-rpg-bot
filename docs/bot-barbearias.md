# Bot das barbearias — plano (engavetado)

> **Engavetado.** O dono decidiu que o produto das barbearias não usa WhatsApp
> (risco de banimento do Baileys). O agendamento fica só no site. Mantido aqui
> caso um dia vá pra API oficial.

O cliente agenda conversando no WhatsApp, e o horário cai na mesma agenda do
site (painel `/app` e página `/b/<slug>`). Uma hora antes do corte, o bot
pergunta se está tudo certo.

## Princípio

O **site é a fonte da verdade**. O bot não tem banco de agenda: ele conversa e
pede ao site, por uma API protegida com `BOT_SEGREDO`, como já faz com o código
de login. Assim:

- um horário marcado pelo bot aparece no painel na hora, e vice-versa;
- a regra "sem encaixe duplo" continua num lugar só (`marcar`, na transação);
- na Square Cloud o bot e o site são apps separados (cada um com o próprio disco),
  então não daria pra dividir o arquivo SQLite mesmo.

```
cliente ──WhatsApp──► bot (Baileys)            site (Next.js)
                      conversa, estado curto ──► /api/bot/*  ──► agenda.db
                      lembretes (a cada 1 min) ◄─ pendentes
```

## Número

**Um número central "Agenda"** atende todas as barbearias. O botão
"Agendar pelo WhatsApp" do site abre `wa.me/<numero>?text=Agendar box-7`, e o bot
sabe de qual barbearia se trata pelo código.

Por que não o número de cada barbeiro:
- Baileys não é oficial: um banimento derrubaria o WhatsApp do negócio do barbeiro;
- cada sessão gasta memória (~50–80 MB), e o plano da Square não aguenta uma por barbearia.

Quando houver receita, o número de cada barbearia pode ir pra API oficial.
O `responder` é puro, então só o transporte muda (ver `whatsapp.md`).

O chip é **separado do bot de cursos**: outra marca, e um banimento não derruba os dois.
O código é o mesmo app, com o modo escolhido por variável de ambiente.

## Fluxo de agendamento (fase 1)

```
Cliente: Agendar box-7            (ou "oi": o bot usa a última barbearia do número,
                                    ou pede o nome e busca entre as ativas)
Bot:  Box 7 — o que vai ser?
      1 Corte (R$ 40) · 2 Barba (R$ 30) · 3 Corte + barba (R$ 65)
Cliente: 1
Bot:  Com quem?  1 Rafael · 2 Diego · 3 Tanto faz
Cliente: 3
Bot:  Próximas vagas:
      terça 27/10: 1) 09:00  2) 09:30  3) 10:00
      quarta 28/10: 4) 09:00 ...
      (mande "outro dia" pra ver mais)
Cliente: 2
Bot:  Seu nome?          (pula se o número já agendou antes)
Cliente: Lucas
Bot:  Corte com Diego, terça 27/10 às 09:30, R$ 40. Confirmo?  1 Sim · 2 Mudar
Cliente: 1
Bot:  Marcado ✅ Quer que eu te lembre 1 hora antes?  1 Sim · 2 Não
```

- **Comandos:** "meus horários" lista os agendamentos do número; "cancelar" cancela o horário.
- **Origem:** o agendamento nasce com `origem = 'whatsapp'`, mostrada no painel.
- **Número verificado:** o número vem do próprio WhatsApp. Quem agenda pelo bot já
  provou o número; no site, o número é digitado.
- **Estado da conversa:** fica em memória, com validade de 15 min. Se o bot reiniciar,
  o cliente recomeça; é só uma conversa.
- **Limites:**
  - até 2 horários futuros por número em cada barbearia;
  - o `Limitador` que já existe;
  - a barbearia precisa estar com o acesso ativo (vencida = bot responde com o
    WhatsApp da barbearia, como a página pública).

## Lembrete 1 h antes (fase 2)

Este é o único caso em que o bot fala primeiro. É uma **exceção à regra do
CLAUDE.md**, e só vale com as travas abaixo.

1. **Só com pedido do cliente:**
   - no bot, o "1 Sim" acima;
   - no site, um botão "Quero lembrete no WhatsApp" que abre o chat com o texto
     `LEMBRETE 4821` já escrito.
   Nos dois casos **o cliente manda a primeira mensagem**: o número fica provado e a
   conversa já existe. O bot nunca escreve pra quem nunca escreveu pra ele.
2. **Quando:** entre 55 e 65 min antes, só entre 7h e 22h. Se o bot estava fora do ar
   e passou da hora, não manda.
3. **Ritmo:** uma mensagem a cada ~20 s no máximo, sem link e com o nome da pessoa.
   É volume baixo e esperado, nada parecido com disparo.
4. **Sem duplicar:** o site marca `lembrete_enviado_em` na mesma chamada que entrega o
   pendente. Reiniciar o bot não manda duas vezes.
5. **Mensagem:**
   ```
   Oi, Lucas! Seu corte na Box 7 é hoje às 09:30 com Diego.
   1 Tudo certo  ·  2 Preciso remarcar  ·  3 Cancelar
   ```
   - **1:** marca `confirmado_pelo_cliente` (o painel mostra ✓).
   - **2:** entra no fluxo de horários e troca o horário.
   - **3:** cancela e libera o horário no site na hora.
6. **SAIR** desliga todos os lembretes daquele número, pra sempre (`bloqueados`).

## API do site pro bot

Todas exigem `Authorization: Bearer BOT_SEGREDO` e só aceitam o número que o bot leu
da mensagem.

| Rota | Faz |
|---|---|
| `GET /api/bot/barbearia?codigo=box-7` ou `?busca=nome` | dados públicos, serviços e equipe ativos |
| `GET /api/bot/vagas?barbearia&servico&profissional&apartir` | próximos horários livres (reusa `horariosLivres`) |
| `POST /api/bot/agendar` | chama `marcar` (revalida na transação), `origem='whatsapp'` |
| `GET /api/bot/meus?telefone` | agendamentos futuros desse número |
| `POST /api/bot/cancelar` / `remarcar` | só se o agendamento for desse número |
| `POST /api/bot/lembrete` | liga o lembrete (código `LEMBRETE 4821` ou "sim" no fluxo) |
| `POST /api/bot/lembretes/pendentes` | devolve os da janela e já marca como enviados |
| `POST /api/bot/resposta-lembrete` | 1/2/3 do lembrete |

## Mudanças no banco (`agendamentos`)

As colunas novas entram com `garantirColuna`, como as outras:

- `origem`: `site` ou `whatsapp`;
- `lembrete`: 0 ou 1;
- `lembrete_codigo`;
- `lembrete_enviado_em`;
- `confirmado_pelo_cliente_em`.

## Fase 3 (opcional) — o barbeiro no bot

O barbeiro liga isto no painel, mandando um código pro bot:

- aviso de agendamento novo;
- comando "agenda hoje";
- comando "bloquear 15h" (bloqueio avulso, item 3 do roadmap).

## Ordem

1. Fase 1: API + fluxo puro no `responder` com testes + botão "Agendar pelo WhatsApp"
   no site + coluna `origem` no painel.
2. Fase 2: lembrete com as travas acima + ✓ no painel.
3. Pacote do bot pra Square Cloud (app separado, 256 MB). O site fica com 512 MB,
   e os dois cabem no plano de 1 GB.
4. Fase 3, se fizer sentido.
