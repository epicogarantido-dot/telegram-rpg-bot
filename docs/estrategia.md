# Estratégia: nicho → comunidade → receita

## Dois sites

1. **Site de cursos (este, `apps/site`)** — porta de entrada e captação: cursos grátis, conta com
   WhatsApp + senha (lead confirmado e com consentimento), vitrine do produto pros barbeiros.
2. **Site dos barbeiros (`app/(barbearias)`)** — o "book" de cada barbearia (fotos dos trabalhos,
   equipe, serviços, horários) com um dos 6 temas + agenda online + assinatura por Pix. Base pronta;
   próximos: efeitos completos de cada tema (docs/estilos/plano.md), vale-presente, plano mensal,
   depoimentos.
3. **Bot de WhatsApp** — responde dúvidas, confirma códigos de login, recebe SAIR.


Exemplo com barbeiros; o mesmo funil serve pra qualquer nicho local
(manicures, mecânicos, personal trainers, pet shops…).

```
Google Places ──► leads (painel) ──► convite 1 a 1 ──► grupo/canal ──► afiliados + cursos
                                                            │
  site /barbeiros (inscrição opt-in) ───────────────────────┘
                                                            ▼
                                              SaaS de agendamento (assinatura)
```

## 1. Leads — `npm run prospectar`

- Padrão: **OpenStreetMap** (grátis, sem chave). Menos telefones que o Google, mas custo zero.
- Opcional: **Places API oficial** do Google (`--fonte google`, exige conta com cartão). Raspar o Google Maps viola os termos do Google (bloqueio
  da conta/IP) e quebra a cada mudança de layout.
- Pelos termos da Google Maps Platform, o que pode ser guardado por tempo indefinido é
  o `place_id`; os outros campos devem ser atualizados periodicamente (rode `buscar`
  de novo — o status do lead é preservado).
- Leads ficam em `data/privado/prospeccao.db` (SQLite, fora do git).

## 2. Convite — painel `/painel`

O painel monta a mensagem personalizada e abre o WhatsApp; **uma pessoa clica em
enviar**, um por vez. Isso é deliberado:

- Disparo automático pra número que não pediu = spam. O WhatsApp bane rápido (ainda
  mais com Baileys) e você perde o número junto com o grupo.
- LGPD: contato B2B com dado público pode se apoiar em *legítimo interesse*, desde que
  seja pertinente ao negócio, identifique quem envia e ofereça saída fácil. A mensagem
  faz isso; o `SAIR` bloqueia o número para sempre (bot + tabela `bloqueados`).
- Limite diário (`LIMITE_DIARIO`, padrão 20). Aumente aos poucos, e só se a taxa de
  resposta for boa.

**O lead mais valioso é o que veio sozinho**: divulgue `/barbeiros` (Instagram, TikTok,
cartão com QR na barbearia). Essas inscrições aparecem no topo do painel.

## 3. Monetização

| Fonte | Quando | Cuidados |
|---|---|---|
| Afiliados (máquinas, produtos, cursos pagos) | Grupo com algumas centenas de membros | Identificar como publicidade (#publi — CONAR). No máx. 1 a 2 por semana, ou o grupo esvazia. |
| Cursos gratuitos | Desde o dia 1 | Só conteúdo com licença aberta (`docs/licencas.md`). É o que faz as pessoas ficarem. |
| **SaaS de agendamento** | Validar com a lista de espera | É a receita recorrente de verdade. Construir quando ~30 barbearias pedirem. |
| Rede social de barbeiros | Depois do SaaS | Rede social precisa de massa crítica; comece com perfil público da barbearia dentro do SaaS (vitrine + portfólio). |

## 4. SaaS de agendamento (`packages/agenda` + `/app`, `/b/<slug>`)

Pronto (MVP, SQLite local):
- ✅ Cobrança por Pix estático: QR + copia e cola, "já paguei", admin confirma em `/painel/assinaturas`; vencido = painel e página pública bloqueados.
- ✅ Cadastro/login do barbeiro (senha com scrypt, sessão por cookie httpOnly).
- ✅ Configurações: dados da barbearia, serviços (duração e preço), profissionais, horário por dia com pausa.
- ✅ Página pública `/b/<slug>`: serviço → profissional → dia → horário → nome e WhatsApp.
- ✅ Sem encaixe duplo (revalida dentro da transação) e isolamento total entre barbearias.
- ✅ Agenda do dia no painel, cancelar, botão de WhatsApp pro cliente.

Próximos:
1. Cliente cancelar/remarcar pelo link (token único por agendamento).
2. Lembrete no dia pelo bot (o cliente pediu ao agendar; volume baixo e esperado, diferente de prospecção).
3. Bloqueio de horário avulso (folga, médico).
4. Perfil público com fotos de cortes — semente da rede social de barbeiros.

### Site da barbearia como área de venda

Sem afiliados no site da barbearia (decisão do dono): o site vende o serviço do barbeiro e, no rodapé, o nosso.

| # | Conteúdo | Situação |
|---|---|---|
| 1 | Vagas dos próximos dias (horários reais, um toque leva à confirmação) | feito |
| 2 | Plano mensal do cliente (Pix pro barbeiro, ele confirma) | a fazer |
| 3 | Vale-presente (Pix, código usado ao agendar) | a fazer |
| 4 | Vitrine de produtos (reservar e retirar no próximo corte) | a fazer |
| 5 | Depoimentos reais pós-atendimento, aprovados pelo barbeiro | a fazer |
| 6 | Fidelidade (a cada 10 cortes, 1 grátis, pelo WhatsApp do cliente) | a fazer |
| 7 | Perguntas frequentes | a fazer |
| 8 | Rodapé "Você é barbeiro? Tenha um site assim" → `/barbeiros` | feito |
