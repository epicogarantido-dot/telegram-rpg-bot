# Atlas de Estilos (temas dos sites das barbearias)

Plano completo dos 6 temas escolhidos: **`plano.md`** (com nível de efeitos de cada um).

Visual completo: `atlas.html` (abrir no navegador) · publicado em https://claude.ai/artifact/8mwJLupAGBJ91ix2gMFybz

**A ideia:** capturar a **essência** de como cada marca faz a pessoa se sentir (a extravagância da
Versace, o luxo silencioso da Prada) e traduzir em regras de design. A marca é só referência:
logos, nomes e desenhos dela nunca entram nos sites.

| # | Tema | Referência | Paleta | Fontes (Google, grátis) | Pra qual barbearia |
|---|---|---|---|---|---|
| 1 | Extravagância | Versace | #0C0B09 #C9A54B #E8C766 #F3E6C4 | Bodoni Moda + Cormorant Garamond | Clássica premium |
| 2 | Luxo Silencioso | Prada | #FFFFFF #111111 #E7E5E0 #555555 | Archivo | Bairro nobre, "menos é mais" |
| 3 | Luxo Técnico | Moncler | #F7F8FA #0F1D3A #9AA9C4 #DFE5EF | Jost | Moderna, jovem e família |
| 4 | Potência | Lamborghini | #0A0A0A #D7FF1E #2A2A2A #F4F4F4 | Barlow Condensed + Manrope | Degradê/freestyle |
| 5 | Cerimônia | Rolls-Royce | #120B14 #3B2342 #F5F0F6 #FFFFFF | Jost (light, espaçada) | Exclusiva, hora marcada |
| 6 | Elegância Atemporal | Chanel | #000000 #FFFFFF #ECECEC | Libre Caslon + Jost | Atemporal, casamentos |
| 7 | Artesanal | Hermès | #F4EAD9 #C2531B #8A4A24 #3A2414 | Fraunces + Manrope | Vintage/rústica |
| 8 | Precisão | Porsche | #EEEFF0 #101215 #8E939B #C9CCD1 | Manrope + Space Mono | Organizada, executivo |
| 9 | Ritual Sensorial | Aesop | #E8E3D6 #2B2A22 #6F6A4D #5D5A4C | Libre Caslon + Manrope | Spa de barba e pele |
| 10 | Maximalismo Retrô | Gucci | #12392B #B02E26 #E1B54B #F2E3C2 | Fraunces itálica + Barlow Condensed | Criativa, com música/bar |

## Como vira produto

- Cada estilo é um **tema** do site da barbearia (site 2): muda cores, fontes, formas e movimento;
  fotos, serviços e agenda são os mesmos.
- Implementar como conjunto de variáveis CSS por tema (`[data-tema="pista"] { --fundo: … }`),
  fontes embutidas via Fontsource (sem Google Fonts em tempo real, por LGPD e velocidade).
- Começar com 3 temas bem diferentes (sugestão: Pista, Luxo Silencioso, Extravagância).
