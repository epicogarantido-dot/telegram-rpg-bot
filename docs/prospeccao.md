# Captação de barbearias (leads)

Onde conseguir os contatos, como usar sem quebrar regra e como rodar. A abordagem do
primeiro contato (texto, canal, limites) fica em `docs/abordagem.md`.

## Fontes, da melhor pra pior

| Fonte | O que traz | Custo | Como |
|---|---|---|---|
| **Receita Federal (dados abertos do CNPJ)** | Quase todas as barbearias com CNPJ (inclusive MEI): nome, endereço, telefone e e-mail cadastrados, data de abertura | Grátis, oficial | `/painel/buscar` → "Buscar na Receita", ou `npm run prospectar -- receita barbearia Alegrete RS` |
| **Google, Instagram e Facebook, com uma pessoa buscando** | Quem não tem CNPJ, o WhatsApp de atendimento certo e o @ (ótimo pra personalizar) | Grátis (tempo de quem busca) | `/painel/buscar` → buscas prontas + cadastro rápido + "Completar" |
| OpenStreetMap | Poucas barbearias com telefone no Brasil | Grátis | `npm run prospectar -- buscar barbearia Alegrete` |
| Google Places API | Bom, com nota e avaliações | Pede conta com cartão (fora do custo zero) | `--fonte google` |

**Nunca** raspar automaticamente Google, Google Maps, Instagram ou Facebook: viola os termos,
dá bloqueio e expõe o projeto. A busca assistida é uma pessoa navegando; o painel só organiza.

## Receita: como funciona

- Atividade **9602-5/01** (cabeleireiros, manicure e pedicure), principal ou secundária, empresa
  **ativa**. "barb" no nome fantasia ou na razão social confirma barbearia; sem isso o lead
  ganha o aviso "pode ser salão ou manicure".
- **Telefone do contador:** número repetido em 3+ empresas da mesma cidade. O painel avisa e
  prefere o celular do dono quando existe.
- Celular antigo cadastrado com 8 dígitos ganha o 9 na frente. Fixo é avisado (raramente tem WhatsApp).
- Os arquivos são grandes (~7 GB por mês). O leitor baixa os 10 arquivos em paralelo e filtra
  em fluxo, sem gravar nada: uns 15-20 minutos por passada. Uma passada serve pra várias cidades
  da mesma UF: `receita barbearia "Alegrete,Uruguaiana,Santana do Livramento" RS`.
- Endereço: compartilhamento público da Receita
  (`https://arquivos.receitafederal.gov.br/index.php/s/gn672Ad4CF8N6TK`, pasta Dados > Cadastros > CNPJ).
  Se mudar, ponha o código novo em `RECEITA_COMPARTILHAMENTO` no `.env`.
- Atualizar a base de novo não apaga status, Instagram nem observação de quem já foi trabalhado.

## LGPD: por que pode e como fazer direito

- **Base legal: legítimo interesse** (LGPD art. 7º, IX e art. 10): oferta de produto pra negócio
  (B2B), sobre a atividade profissional da pessoa, com contato mínimo e saída fácil. O Guia de
  Legítimo Interesse da ANPD (fev/2024) pede que a finalidade seja legítima, o dado seja o
  necessário e haja salvaguardas. As nossas:
  - Só guardamos o necessário pro contato comercial (nome do negócio, telefone, e-mail,
    endereço, Instagram). Nada de sócio, CPF ou dado pessoal além disso.
  - Toda mensagem diz quem somos e **como sair** (SAIR); o bloqueio é permanente e sobrevive a
    novas importações.
  - Se perguntarem "como conseguiu meu número?": "do cadastro público do CNPJ (Receita
    Federal)" ou "do seu Instagram/Google". Responder com a verdade, sempre.
  - Banco em `data/privado/` (fora do git), sem venda nem compartilhamento da lista.
  - Lead que não respondeu em 6 meses: apagar (não insistir).
- Dado público não é dado livre (art. 7º, §3º e §7º): o uso tem que combinar com o contexto
  (contato comercial com o negócio), por isso nada de usar a base pra outra coisa.
- Isto é orientação de boa prática, não parecer jurídico. Ao escalar, vale uma consulta.
