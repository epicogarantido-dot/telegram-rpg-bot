"""Matérias "Curiosidade" da Revista. Gera data/artigos/<slug>.json.

Fatos conferidos em 26/10/2026:
- Royal College of Physicians of Edinburgh, blog da exposição "Rag: A History of Blood" (2026):
  barbeiros-cirurgiões, a vara de sangria, as cores, a tigela de sangue, a lei inglesa de 1540.
- Snopes (2023, com bibliografia): código de cores de Amsterdã no século 17 (citando Robert Wallace),
  separação em 1745, cirurgião britânico chamado de "Mr".
- Wikipedia, Worshipful Company of Barbers (com JRSM 2001 como referência): 1308, 1540, 1745, hoje.
"""
import json, sys

DESTINO = sys.argv[1] if len(sys.argv) > 1 else "data/artigos"

POSTE = {
"slug": "por-que-o-poste-da-barbearia-e-listrado",
"titulo": "Por que o poste da barbearia é listrado de vermelho e branco",
"resumo": "Barbeiro já foi cirurgião, tirava sangue e arrancava dente. O poste listrado na porta é o que sobrou dessa história, e ela rende uma boa conversa na cadeira.",
"tipo": "curiosidade",
"publicadoEm": "2026-10-26",
"tags": ["barbearia", "curiosidade", "história"],
"conteudo": """Você já viu o poste listrado girando na porta de uma barbearia. Pouca gente sabe que ele é **uma propaganda de sangria**. Isso mesmo: durante séculos, o barbeiro também fazia pequenas cirurgias.

### O barbeiro-cirurgião

Por centenas de anos, os **barbeiros-cirurgiões** cortavam cabelo, tiravam piolho e faziam **sangria**: um corte na veia pra "tirar o sangue ruim". Era a medicina da época, baseada na ideia de que o corpo tinha quatro líquidos que precisavam ficar em equilíbrio, e o sangue era um deles. Barbeiro também **arrancava dente**.

Segundo a Snopes, na Europa medieval os médicos se viam como estudiosos e achavam a cirurgia trabalho de menor importância. Por isso, sangria, dente e até amputação ficavam com quem tinha mão firme e navalha: o barbeiro.

### O poste era a vara da sangria

O museu do **Royal College of Physicians de Edimburgo**, na Escócia, guarda um poste de barbeiro dos anos 1930 e explica: o poste é **um modelo da vara que o cliente apertava** com a mão pra veia saltar na hora da sangria.

E as cores? Ninguém sabe ao certo. As explicações mais comuns:

- **Vermelho é o sangue, branco são as faixas** usadas pra enfaixar o braço depois.
- **Cada cor é um serviço:** sangria e extração de dente.
- Em **Amsterdã, no século 17**, segundo um livro citado pela Snopes, havia um código: **vermelho** = faz sangria, **branco** = arranca dente e põe osso no lugar, **azul** = só faz a barba.
- O **azul** dos postes americanos também é explicado por patriotismo (as cores da bandeira), mas é só uma das versões.

Na Idade Média, diz o museu de Edimburgo, quem fazia sangria anunciava o serviço **mostrando uma tigela com o sangue dos clientes**. Perto disso, o poste listrado é bem discreto.

### Barbeiros e cirurgiões, juntos e separados

Em Londres, a guilda dos barbeiros aparece em registros desde **1308**. Em **1540**, uma lei juntou barbeiros e cirurgiões numa companhia só. Segundo o museu de Edimburgo, a lei inglesa da época mandava **barbeiro usar poste azul e branco, e cirurgião, vermelho e branco**.

Em **1745** os cirurgiões saíram e formaram o que virou o Royal College of Surgeons. Os barbeiros seguiram com o cabelo e a barba. A **Worshipful Company of Barbers** existe até hoje em Londres, agora como entidade beneficente ligada à medicina.

Um resto curioso dessa história: segundo a Snopes, no Reino Unido o cirurgião é chamado de **"Mister"**, e não de "Doutor".

### Como usar isso na sua barbearia

- **Conte na cadeira.** É uma história curta, surpreendente e que todo cliente repete em casa. Conversa boa faz o cliente voltar.
- **Poste na porta é identidade.** Mesmo quem nunca entrou numa barbearia reconhece o poste. Se a sua tem um, cuide dele: limpo e aceso.
- **Vire post.** "Você sabia que o poste da barbearia era propaganda de sangria?" funciona no Instagram e no status do WhatsApp, com uma foto do seu poste.
- **Valorize o ofício.** O barbeiro já foi o cirurgião da cidade. Mão firme, higiene e confiança continuam sendo o centro do trabalho.""",
"fontes": [
    {"titulo": "Royal College of Physicians of Edinburgh — Bloodletting (exposição Rag: A History of Blood, 2026)", "url": "https://www.rcpe.ac.uk/heritage/heritage-blog/bloodletting"},
    {"titulo": "Snopes — The Surprisingly Bloody History of the Barber Pole (2023)", "url": "https://www.snopes.com/articles/465529/origin-of-barber-poles/"},
    {"titulo": "Wikipedia — Worshipful Company of Barbers", "url": "https://en.wikipedia.org/wiki/Worshipful_Company_of_Barbers"},
],
}

for a in (POSTE,):
    with open(f"{DESTINO}/{a['slug']}.json", "w", encoding="utf-8") as f:
        json.dump(a, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("ok", a["slug"])
