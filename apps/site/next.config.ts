import type { NextConfig } from "next";

const config: NextConfig = {
  // O catálogo é TypeScript puro importado direto do workspace.
  transpilePackages: ["@aprenda/catalogo"],
};

export default config;
