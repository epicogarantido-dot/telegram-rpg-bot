import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const config: NextConfig = {
  // Pacotes do monorepo são TypeScript puro importados direto do workspace.
  transpilePackages: ["@aprenda/agenda", "@aprenda/catalogo", "@aprenda/prospeccao"],
  // Build autocontido (servidor + só as dependências usadas) pra subir na
  // Square Cloud sem npm install e com pouca memória. Ver scripts/pacote-square.mjs.
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  poweredByHeader: false,
  // Envio de fotos dos barbeiros (várias de uma vez) passa por server action.
  experimental: { serverActions: { bodySizeLimit: "40mb" } },
  async headers() {
    const seguranca = [
      // Não deixa outro site embutir o nosso num iframe (clickjacking).
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ];
    if (process.env.NODE_ENV === "production") {
      seguranca.push({
        key: "Content-Security-Policy",
        // 'unsafe-inline' em script é exigido pelo Next sem nonce; o resto fica travado no próprio site.
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self'",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join("; "),
      });
    }
    return [{ source: "/:caminho*", headers: seguranca }];
  },
};

export default config;
