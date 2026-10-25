import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const config: NextConfig = {
  // Pacotes do monorepo são TypeScript puro importados direto do workspace.
  transpilePackages: ["@aprenda/agenda", "@aprenda/catalogo", "@aprenda/prospeccao"],
  // Build autocontido (servidor + só as dependências usadas) pra subir na
  // Square Cloud sem npm install e com pouca memória. Ver scripts/pacote-square.mjs.
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
};

export default config;
