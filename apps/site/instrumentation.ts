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
  // Site de leads sem o que a venda precisa: avisa no console da Square logo na subida.
  const faltam = ["PIX_CHAVE", "PIX_NOME", "PIX_CIDADE", "ADMIN_WHATSAPP", "PAINEL_SENHA"].filter((v) => !process.env[v]?.trim());
  if (faltam.length) console.warn(`ATENÇÃO: faltam variáveis de ambiente: ${faltam.join(", ")}. Sem elas o Pix da assinatura e o contato não aparecem.`);
  const { criarSitesDeExemplo, sitesDeExemplo } = await import("@/lib/exemplos");
  if (Object.keys(sitesDeExemplo()).length > 0) return;
  criarSitesDeExemplo()
    .then((n) => console.log(`Sites de exemplo criados: ${n}`))
    .catch((erro) => console.error("Não deu pra criar os sites de exemplo:", erro));
}
