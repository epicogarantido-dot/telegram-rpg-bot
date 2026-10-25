#!/bin/bash
# Prepara sessões do Claude Code na nuvem: instala dependências pra testes,
# typecheck e build funcionarem desde o primeiro comando.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund
