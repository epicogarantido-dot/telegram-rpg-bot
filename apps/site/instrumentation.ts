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
  // Fotos que saíram do acervo: somem de todos os sites (exemplos e clientes que pegaram do acervo).
  const { retirarFotosDoAcervo } = await import("@/lib/exemplos");
  retirarFotosDoAcervo();
  // Lembrete no celular do cliente (1 hora antes do horário): confere a cada 5 minutos.
  const g = globalThis as { lembretesLigados?: boolean };
  if (!g.lembretesLigados) {
    g.lembretesLigados = true;
    const { enviarLembretesClientes } = await import("@/lib/avisos");
    setInterval(() => { enviarLembretesClientes().catch((e) => console.error("Lembretes:", e)); }, 5 * 60_000).unref?.();
  }
  if (soEntrega()) {
    const { prepararBarbeariaDoApp } = await import("@/lib/barbearia-do-app");
    prepararBarbeariaDoApp()
      .then((b) => console.log(`Barbearia do app: ${b.nome} (/b/${b.slug}), paga até ${b.acessoAte}`))
      .catch((erro) => console.error("Não deu pra preparar a barbearia do app:", erro));
    return;
  }
  // Convite da comunidade por e-mail (só no leads): uma rodada a cada 10 min; ela mesma confere
  // se está ligado, configurado, em horário comercial e dentro do limite do dia.
  const ge = globalThis as { emailsLigados?: boolean };
  if (!ge.emailsLigados) {
    ge.emailsLigados = true;
    const { rodadaDeEmails } = await import("@/lib/emails");
    setInterval(() => { rodadaDeEmails().catch((e) => console.error("E-mails:", e)); }, 10 * 60_000).unref?.();
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
