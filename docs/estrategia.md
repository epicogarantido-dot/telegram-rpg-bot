# Estratégia: nicho → comunidade → receita

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

- Usa a **Places API oficial**. Raspar o Google Maps viola os termos do Google (bloqueio
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

## 4. Roadmap técnico do SaaS

1. Banco no Postgres (Supabase): barbearias, profissionais, serviços, horários, agendamentos, clientes.
2. Página pública `/b/<barbearia>`: cliente escolhe serviço, profissional e horário.
3. Painel do barbeiro: agenda do dia, bloqueio de horários, cadastro de serviços.
4. Lembrete automático pro cliente (aqui sim, mensagem que o cliente pediu — melhor via API oficial do WhatsApp).
5. Cobrança da assinatura (Mercado Pago / Stripe), plano grátis limitado.
