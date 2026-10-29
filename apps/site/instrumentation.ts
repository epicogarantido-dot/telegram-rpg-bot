/**
 * Roda uma vez quando o servidor sobe.
 * - Site de leads (e um app só): instalação nova já nasce com os 6 sites de exemplo, sem depender
 *   do admin apertar o botão em /painel/assinaturas.
 * - SaaS: o app é de uma barbearia só; ela nasce aqui na primeira vez, com os dados do .env (e os
 *   exemplos, que no SaaS não abrem como site: só guardam as fotos padrão).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { soEntrega } = await import("@/lib/modo");
  // Sem await: o site já atende enquanto as fotos são processadas (a barbearia em si nasce na hora).
  if (soEntrega()) {
    const { prepararBarbeariaDoApp } = await import("@/lib/barbearia-do-app");
    prepararBarbeariaDoApp()
      .then((b) => console.log(`Barbearia do app: ${b.nome} (/b/${b.slug}), paga até ${b.acessoAte}`))
      .catch((erro) => console.error("Não deu pra preparar a barbearia do app:", erro));
    return;
  }
  const { criarSitesDeExemplo, sitesDeExemplo } = await import("@/lib/exemplos");
  if (Object.keys(sitesDeExemplo()).length > 0) return;
  criarSitesDeExemplo()
    .then((n) => console.log(`Sites de exemplo criados: ${n}`))
    .catch((erro) => console.error("Não deu pra criar os sites de exemplo:", erro));
}
