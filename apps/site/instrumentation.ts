/**
 * Roda uma vez quando o servidor sobe. No app das barbearias, instalação nova já nasce com os
 * 6 sites de exemplo (o endereço principal abre um deles e a conta nova tira as fotos padrão
 * de lá), sem depender do admin apertar o botão em /painel/assinaturas.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { modoSite } = await import("@/lib/modo");
  if (modoSite() === "leads") return;
  const { criarSitesDeExemplo, sitesDeExemplo } = await import("@/lib/exemplos");
  if (Object.keys(sitesDeExemplo()).length > 0) return;
  // Sem await: o site já atende enquanto as fotos são processadas.
  criarSitesDeExemplo()
    .then((n) => console.log(`Sites de exemplo criados: ${n}`))
    .catch((erro) => console.error("Não deu pra criar os sites de exemplo:", erro));
}
