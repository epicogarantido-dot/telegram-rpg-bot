/**
 * Roda uma vez quando o servidor sobe. Instalação nova já nasce com os 6 sites de exemplo, sem
 * depender do admin apertar o botão em /painel/assinaturas: no site de leads são os exemplos e a
 * base das prévias; no SaaS não abrem como site, só guardam o acervo de fotos padrão das contas.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { criarSitesDeExemplo, sitesDeExemplo } = await import("@/lib/exemplos");
  if (Object.keys(sitesDeExemplo()).length > 0) return;
  // Sem await: o site já atende enquanto as fotos são processadas.
  criarSitesDeExemplo()
    .then((n) => console.log(`Sites de exemplo criados: ${n}`))
    .catch((erro) => console.error("Não deu pra criar os sites de exemplo:", erro));
}
