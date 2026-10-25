# Atlas de Estilos (temas dos sites das barbearias)

Visual completo: `atlas.html` (abrir no navegador) · publicado em https://claude.ai/artifact/8mwJLupAGBJ91ix2gMFybz

**Regra:** copiamos o clima (cor, tipografia, ritmo), nunca símbolos registrados — logos, nomes,
monogramas, faixa grega/Medusa (Versace), triângulo (Prada), touro (Lamborghini), "RR" e estatueta
(Rolls-Royce), listra verde-vermelha (Gucci), caixa laranja/carruagem (Hermès), "CC" (Chanel).

| # | Tema | Inspiração | Paleta | Fontes (Google, grátis) | Pra qual barbearia |
|---|---|---|---|---|---|
| 1 | Barroco Dourado | Versace | #0C0B09 #C9A54B #E8C766 #F3E6C4 | Bodoni Moda + Cormorant Garamond | Clássica premium |
| 2 | Minimal Milanês | Prada | #FFFFFF #111111 #E7E5E0 #555555 | Archivo | Bairro nobre, "menos é mais" |
| 3 | Alpino | Moncler | #F7F8FA #0F1D3A #9AA9C4 #DFE5EF | Jost | Moderna, jovem e família |
| 4 | Pista | Lamborghini | #0A0A0A #D7FF1E #2A2A2A #F4F4F4 | Barlow Condensed + Manrope | Degradê/freestyle |
| 5 | Atelier Real | Rolls-Royce | #120B14 #3B2342 #F5F0F6 #FFFFFF | Jost (light, espaçada) | Exclusiva, hora marcada |
| 6 | Preto e Branco Parisiense | Chanel | #000000 #FFFFFF #ECECEC | Libre Caslon + Jost | Atemporal, casamentos |
| 7 | Couro e Sela | Hermès | #F4EAD9 #C2531B #8A4A24 #3A2414 | Fraunces + Manrope | Vintage/rústica |
| 8 | Engenharia | Porsche | #EEEFF0 #101215 #8E939B #C9CCD1 | Manrope + Space Mono | Organizada, executivo |
| 9 | Boticário | Aesop | #E8E3D6 #2B2A22 #6F6A4D #5D5A4C | Libre Caslon + Manrope | Spa de barba e pele |
| 10 | Retrô Eclético | Gucci | #12392B #B02E26 #E1B54B #F2E3C2 | Fraunces itálica + Barlow Condensed | Criativa, com música/bar |

## Como vira produto

- Cada estilo é um **tema** do site da barbearia (site 2): muda cores, fontes, formas e movimento;
  fotos, serviços e agenda são os mesmos.
- Implementar como conjunto de variáveis CSS por tema (`[data-tema="pista"] { --fundo: … }`),
  fontes embutidas via Fontsource (sem Google Fonts em tempo real, por LGPD e velocidade).
- Começar com 3 temas bem diferentes (sugestão: Pista, Minimal Milanês, Barroco Dourado).
