# Roteiro de teste real (site das barbearias)

Faça com o site já na Square Cloud (endereço https de verdade) e dois celulares:
um seu, como **barbeiro**, e outro (de alguém da família) como **cliente**.

## Preparar (barbeiro)
1. Crie a conta em `/app/cadastro` com o seu WhatsApp.
2. Configurações: serviços com preço e tempo, profissionais, horário de funcionamento,
   "Como você atende" e "Horários a cada".
3. Meu site: escolha o tema, ponha bio, cidade e ano de abertura. Fotos: envie 6 a 10.
4. Na agenda: **Ligar avisos neste aparelho** (no iPhone, antes, "Adicionar à Tela de Início").
5. **Agenda no celular**: assine a agenda da barbearia no seu celular. No iPhone, deixe
   "Remover Alertas" desligado; no Google, ligue a notificação da agenda.

## Cliente
6. Abra o link do site no outro celular, marque um horário (3 passos).
7. Confira: chegou o aviso no celular do barbeiro? O botão "Confirmar no WhatsApp" abre a conversa certa?
8. Na tela "Agendado!", toque em **Adicionar à minha agenda**. O evento tem o link pra remarcar?
9. Pelo link: **Trocar dia ou horário** e depois **Cancelar**. O barbeiro recebeu os dois avisos?
10. O horário apareceu/sumiu na agenda assinada do barbeiro? (iPhone: até ~15 min; Google: pode levar horas.)

## Barbeiro no dia a dia
11. "Marcar horário pra um cliente" pelo painel e "Mandar este link pra … no WhatsApp".
12. Cancelar um horário pelo painel e usar "Avisar no WhatsApp".
13. Se atende por ordem de chegada: mexer na fila (+/−) e ver no site do outro celular.
14. "Fechar hoje" e ver o site mostrar "Fechado hoje".
15. "Bloquear um horário" (ex.: 14h–16h de um profissional) e conferir que some do site só pra ele.

## Anote
- O que demorou, confundiu ou deu erro (tire print).
- Aparelho e sistema (ex.: iPhone 12, iOS 17; Galaxy A15, Android 14).

## Travas contra abuso (já testadas no código)
| Trava | Limite |
|---|---|
| Mesmo número | até 2 horários futuros por barbearia (pelo site) |
| Mesmo aparelho | 4 agendamentos por hora na barbearia, 12 por dia no site |
| Rajada | 20 agendamentos em 30 min na barbearia seguram novos e avisam o barbeiro |
| Robô | campo isca escondido |
| Número de trote | barbeiro bloqueia (cancela os futuros e impede novos) |
| Senha do painel | 5 erros por e-mail / 20 por aparelho a cada 15 min |
| Cadastro | 3 contas novas por aparelho por dia |
| Link do cliente | remarcar/cancelar até 10 vezes por hora por aparelho |

O barbeiro logado não passa pelas travas (pode marcar quantos quiser pros clientes).
