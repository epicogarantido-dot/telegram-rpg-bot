"""
🌐 Isekairpg — ponto de entrada do SITE.

20/09/2026 — O BOT DO TELEGRAM SAIU.
------------------------------------
Até aqui este arquivo tinha ~1.160 linhas: o bot (aiogram, polling,
handlers de comando, render de mensagem, cache de jogador do bot, liberar
Pix pelo chat) e, pendurada nele, a API do site. A migração terminou —
contas próprias, Pix por upload com painel /admin, imagens espelhadas em
`data/imagens/` e envio de arte pelo painel —, então o bot virou código
morto que ainda exigia `aiogram` instalado e `BOT_TOKEN` configurado.

Sobrou só o que o site precisa pra subir:
  1. criar/migrar as tabelas (cada CREATE migra banco velho sozinho — ver
     `infra/migracao.py`);
  2. carregar as artes que já estavam registradas;
  3. servir a API (FastAPI) com o uvicorn, como o processo principal.

Os arquivos do bot (`core/router.py`, `core/keyboards.py`, `game/views.py`)
foram apagados junto. Nada do site importava deles — conferido antes de
apagar (a armadilha nº 3 era exatamente lógica morando só no bot).
"""
import os
import asyncio


async def preparar_banco() -> None:
    """Cria e migra tudo, na ordem em que as tabelas dependem umas das
    outras. Cada passo é idempotente: pode reiniciar quantas vezes quiser."""
    from game.sql_repo import init_db
    await init_db()

    try:
        from game.assets import _carregar_assets_salvos
        _carregar_assets_salvos()
    except Exception as e:
        print(f"⚠️ Falha ao carregar assets salvos: {e}")

    from game.raid_repo import RaidRepo
    RaidRepo().init_tables()

    from webapp.contas import init_contas
    from webapp.avisos import init_avisos
    from game.clan_repo import init_clan
    init_contas()
    init_avisos()
    init_clan()
    print("🔐 Banco pronto (contas, sessões, avisos, clã e território).")


async def main() -> None:
    print("🎮 Isekairpg — site")
    await preparar_banco()

    import uvicorn
    from webapp.api import app
    porta = int(os.environ.get("WEBAPP_PORT", "8080"))
    servidor = uvicorn.Server(uvicorn.Config(app, host="0.0.0.0", port=porta,
                                             log_level="warning"))
    print(f"🌐 Site no ar na porta {porta}")
    try:
        await servidor.serve()
    finally:
        print("✅ Fechado!")


if __name__ == "__main__":
    asyncio.run(main())
