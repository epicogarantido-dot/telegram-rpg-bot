"""Gera data/artigos/<slug>.json de todas as matérias da Revista.

    python3 packages/ingestao/manuais/revista/gerar.py [pasta-destino]

Textos em serie.py, curiosidades.py e mercado.py; fotos em imagens.json (geradas com
apps/site/scripts/foto-materia.mjs). Rodar de novo sobrescreve os JSON com o que está aqui.
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
import curiosidades, guias, mercado, serie  # noqa: E402

DESTINO = sys.argv[1] if len(sys.argv) > 1 else "data/artigos"
IMAGENS = json.load(open(os.path.join(os.path.dirname(__file__), "imagens.json"), encoding="utf-8"))
ORDEM = ["slug", "titulo", "resumo", "tipo", "serie", "publicadoEm", "tags", "imagem", "conteudo", "fontes"]

def foto_no_texto(a):
    """[[foto:chave]] no texto vira figura com legenda de crédito, e a foto entra nas fontes."""
    fontes = list(a["fontes"])
    def troca(m):
        f = IMAGENS[m.group(1)]
        fontes.append({"titulo": f"Foto: {f['credito']} ({f['licenca']})", "url": f["fonte"]})
        return f'![{f["alt"]}]({f["arquivo"]} "Foto: {f["credito"]} ({f["licenca"]})")'
    conteudo = re.sub(r"\[\[foto:([a-z0-9-]+)\]\]", troca, a["conteudo"])
    return {**a, "conteudo": conteudo, "fontes": fontes}


for a in serie.ARTIGOS + curiosidades.ARTIGOS + mercado.ARTIGOS + guias.ARTIGOS:
    if a["slug"] not in IMAGENS:
        # Matéria sem foto não é publicada (o teste exige foto): fica esperando a imagem.
        print("espera foto:", a["slug"])
        continue
    a = {**foto_no_texto(a), "imagem": IMAGENS[a["slug"]]}
    a = {k: a[k] for k in ORDEM if k in a}
    with open(f"{DESTINO}/{a['slug']}.json", "w", encoding="utf-8") as f:
        json.dump(a, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("ok", a["slug"], len(a["conteudo"].split()), "palavras")
