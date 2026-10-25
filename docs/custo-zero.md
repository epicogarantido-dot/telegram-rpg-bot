# Custo zero

Regra do projeto: nada que exija pagar ou cadastrar cartão.

| Necessidade | Solução grátis | Evitamos |
|---|---|---|
| Hospedagem | ⚠️ Square Cloud **não tem plano grátis** (Hobby R$ 12,49/mês). Grátis: PC/celular em casa + túnel Cloudflare | Vercel Pro, VPS paga |
| Banco | SQLite embutido no Node (`node:sqlite`) + backup manual em `/painel/backup` | Postgres pago |
| Cobrança | Pix estático (BR Code gerado no código) + confirmação manual do admin | Gateways com taxa (Mercado Pago, Stripe) |
| Leads | OpenStreetMap / Overpass (`--fonte osm`, padrão) | Google Places (exige cartão) |
| Tradução dos cursos | O Claude traduz direto na sessão (skill `traduzir-cursos`) | API paga da Anthropic |
| WhatsApp | Baileys, número próprio (com os riscos de `docs/whatsapp.md`) | API oficial (cobra por conversa) |
| QR code do Pix | biblioteca `qrcode` (open source) | serviços de QR |

Se um dia entrar receita, os pontos que valem trocar primeiro: backup automático do banco
e a API oficial do WhatsApp (lembretes automáticos sem risco de banimento).
